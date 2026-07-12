const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const User = require('../src/modules/auth/user.model');
const Candidate = require('../src/modules/candidates/candidate.model');
const CandidateCounter = require('../src/modules/candidates/candidateCounter.model');
const StatusHistory = require('../src/modules/status-workflow/statusHistory.model');
const ActivityLog = require('../src/modules/activity-logs/activityLog.model');

const CANDIDATE_COUNT = 100;
const SEED_DOMAIN = 'seed.candidate.example.com';

const firstNames = [
  'Aarav', 'Aditi', 'Akash', 'Ananya', 'Arjun', 'Avni', 'Dev', 'Diya', 'Ishaan', 'Ishita',
  'Kabir', 'Kavya', 'Kiran', 'Meera', 'Neha', 'Nikhil', 'Priya', 'Rahul', 'Riya', 'Rohan',
];
const lastNames = [
  'Sharma', 'Patel', 'Singh', 'Gupta', 'Reddy', 'Nair', 'Iyer', 'Mehta', 'Joshi', 'Verma',
];
const cities = ['Bengaluru', 'Mumbai', 'Pune', 'Hyderabad', 'Chennai', 'Delhi', 'Kolkata', 'Ahmedabad'];
const qualifications = ['B.Tech Computer Science', 'B.E. Information Technology', 'MCA', 'MBA Human Resources', 'B.Sc Computer Science', 'M.Tech Software Engineering'];
const companies = ['Infosys', 'TCS', 'Wipro', 'Accenture', 'Tech Mahindra', 'Cognizant', 'Zoho', 'Freshworks', 'Razorpay', 'Flipkart'];
const skillSets = [
  ['JavaScript', 'React', 'Node.js', 'MongoDB'],
  ['TypeScript', 'Express.js', 'AWS', 'Docker'],
  ['Java', 'Spring Boot', 'MySQL', 'Microservices'],
  ['Python', 'Django', 'PostgreSQL', 'REST APIs'],
  ['Recruitment', 'Talent Acquisition', 'HR Operations'],
  ['React', 'Redux', 'HTML', 'CSS'],
  ['Node.js', 'MongoDB', 'Redis', 'Git'],
  ['SQL', 'Power BI', 'Excel', 'Data Analysis'],
];
const sources = ['Website', 'Referral', 'LinkedIn', 'Job Portal', 'Walk-in', 'Facebook', 'Instagram'];
const statuses = ['Registered', 'Under Consideration', 'To Be Shortlisted', 'Selected'];
const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

const requiredUsers = () => {
  if (!process.env.SEED_USERS_JSON) {
    throw new Error('SEED_USERS_JSON is required and must contain the development user objects');
  }
  const users = JSON.parse(process.env.SEED_USERS_JSON);
  if (!Array.isArray(users) || users.length === 0) throw new Error('SEED_USERS_JSON must be a non-empty array');
  for (const user of users) {
    if (!user.name || !user.email || !user.password || !user.role) {
      throw new Error('Each seed user requires name, email, password, and role');
    }
  }
  return users;
};

const registrationDate = (index) => {
  const now = new Date();
  const monthOffset = 11 - (index % 12);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthOffset, 2 + (index % 25), 4 + (index % 14)));
};

const candidateData = (index, actorId, candidateId) => {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[(index * 3) % lastNames.length];
  const experienceYears = Number(((index % 15) * 0.75).toFixed(1));
  const currentCTC = Number((3.2 + experienceYears * 1.15 + (index % 4) * 0.35).toFixed(2));
  const createdAt = registrationDate(index);
  return {
    candidateId,
    firstName,
    lastName,
    gender: genders[index % genders.length],
    dateOfBirth: new Date(Date.UTC(1985 + (index % 17), index % 12, 1 + (index % 27))),
    email: `${firstName}.${lastName}.${String(index + 1).padStart(3, '0')}@${SEED_DOMAIN}`.toLowerCase(),
    mobile: `+91${String(7000000000 + index).padStart(10, '0')}`,
    address: `${12 + index}, ${cities[index % cities.length]} Tech Park Road, ${cities[index % cities.length]}, India`,
    qualification: qualifications[index % qualifications.length],
    experienceYears,
    currentCompany: experienceYears === 0 ? '' : companies[index % companies.length],
    currentCTC: experienceYears === 0 ? 0 : currentCTC,
    expectedCTC: Number(((experienceYears === 0 ? 4.5 : currentCTC * 1.28)).toFixed(2)),
    skills: skillSets[index % skillSets.length],
    resumeUrl: `https://resumes.example.com/candidates/${String(index + 1).padStart(3, '0')}.pdf`,
    source: sources[index % sources.length],
    status: statuses[index % statuses.length],
    remarks: `Development profile for a ${experienceYears}-year candidate. Available for interview with standard notice-period coordination.`,
    createdBy: actorId,
    updatedBy: actorId,
    createdAt,
    updatedAt: createdAt,
  };
};

const ensureCollections = async () => {
  const models = [User, Candidate, CandidateCounter, StatusHistory, ActivityLog];
  for (const model of models) {
    await model.createCollection();
    await model.syncIndexes();
  }
  return models.map((model) => model.collection.collectionName);
};

const seed = async () => {
  const users = requiredUsers();
  await connectDatabase();
  const collections = await ensureCollections();

  let usersCreated = 0;
  const persistedUsers = [];
  for (const input of users) {
    let user = await User.findOne({ email: input.email.toLowerCase() });
    if (!user) {
      user = await User.create({ ...input, isActive: input.isActive !== false });
      usersCreated += 1;
    }
    persistedUsers.push(user);
  }

  const actor = persistedUsers.find((user) => user.role === 'Admin') || persistedUsers[0];
  const existingSeedEmails = new Set((await Candidate.find({
    email: { $regex: `@${SEED_DOMAIN.replaceAll('.', '\\.')}$` },
  }).select('email').lean()).map(({ email }) => email));
  const missingIndexes = Array.from({ length: CANDIDATE_COUNT }, (_, index) => index)
    .filter((index) => !existingSeedEmails.has(candidateData(index, actor._id, 'CRTS000000').email));

  let candidatesCreated = 0;
  if (missingIndexes.length) {
    const counter = await CandidateCounter.findOneAndUpdate(
      { _id: 'candidateId' },
      { $inc: { sequence: missingIndexes.length } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const firstSequence = counter.sequence - missingIndexes.length + 1;
    if (counter.sequence > 999999) throw new Error('Candidate ID sequence limit has been reached');
    const documents = missingIndexes.map((index, offset) => candidateData(
      index,
      actor._id,
      `CRTS${String(firstSequence + offset).padStart(6, '0')}`,
    ));
    await Candidate.create(documents);
    candidatesCreated = documents.length;
  }

  console.info(JSON.stringify({
    connected: mongoose.connection.readyState === 1,
    database: mongoose.connection.name,
    collections,
    usersCreated,
    candidatesCreated,
    totalSeedCandidates: await Candidate.countDocuments({ email: { $regex: `@${SEED_DOMAIN.replaceAll('.', '\\.')}$` } }),
  }, null, 2));
};

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
