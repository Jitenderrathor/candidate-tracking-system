process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Candidate = require('../src/modules/candidates/candidate.model');

const validCandidate = () => ({
  candidateId: 'CRTS000001',
  firstName: 'Asha',
  lastName: 'Sharma',
  gender: 'Female',
  dateOfBirth: new Date('1995-06-15'),
  email: 'ASHA@EXAMPLE.COM',
  mobile: '+919876543210',
  address: 'Pune, Maharashtra',
  qualification: 'B.Tech',
  experienceYears: 4,
  currentCTC: 800000,
  expectedCTC: 1100000,
  skills: ['React', 'Node.js'],
  source: 'LinkedIn',
  createdBy: new mongoose.Types.ObjectId(),
  updatedBy: new mongoose.Types.ObjectId(),
});

test('Candidate model accepts valid data and applies defaults', async () => {
  const candidate = new Candidate(validCandidate());
  await candidate.validate();

  assert.equal(candidate.email, 'asha@example.com');
  assert.equal(candidate.status, 'Registered');
  assert.equal(candidate.isDeleted, false);
  assert.equal(candidate.candidateId, 'CRTS000001');
});

test('Candidate model rejects invalid enums and negative compensation', async () => {
  const input = validCandidate();
  input.source = 'Unknown';
  input.currentCTC = -1;
  const error = new Candidate(input).validateSync();

  assert.ok(error.errors.source);
  assert.ok(error.errors.currentCTC);
});

test('Candidate model defines active email and mobile uniqueness', () => {
  const index = Candidate.schema.indexes().find(([fields]) => fields.email === 1 && fields.mobile === 1);
  assert.ok(index);
  assert.equal(index[1].unique, true);
  assert.deepEqual(index[1].partialFilterExpression, { isDeleted: false });
});

test('Candidate model stores imported profile metadata', async () => {
  const candidate = new Candidate({
    ...validCandidate(),
    fullName: 'Asha Sharma',
    registrationDate: new Date('2026-06-15'),
    applicationType: 'Full Time',
    linkedInProfile: 'https://www.linkedin.com/in/asha-sharma',
    resumeFileName: 'asha.pdf',
    resumeFileType: 'application/pdf',
    feedback: 'Good communication',
    referenceStatus: 'Contacted',
    recruitmentStatus: 'Rejected',
  });
  await candidate.validate();

  assert.equal(candidate.fullName, 'Asha Sharma');
  assert.equal(candidate.recruitmentStatus, 'Rejected');
  assert.equal(candidate.resumeFileName, 'asha.pdf');
});
