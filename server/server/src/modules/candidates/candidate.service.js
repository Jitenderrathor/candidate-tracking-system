const AppError = require('../../common/errors/AppError');
const { documentLookup, escapeRegex } = require('../../common/utils/mongoQuery');
const Candidate = require('./candidate.model');
const CandidateCounter = require('./candidateCounter.model');

const EDITABLE_FIELDS = [
  'firstName', 'lastName', 'gender', 'dateOfBirth', 'email', 'mobile', 'address',
  'qualification', 'experienceYears', 'currentCompany', 'currentCTC', 'expectedCTC',
  'skills', 'resumeUrl', 'source', 'remarks',
];
const SORTABLE_FIELDS = new Set([
  'candidateId', 'firstName', 'lastName', 'dateOfBirth', 'experienceYears',
  'currentCTC', 'expectedCTC', 'status', 'source', 'createdAt', 'updatedAt', 'deletedAt',
]);

const pick = (input, fields) => fields.reduce((output, field) => {
  if (Object.prototype.hasOwnProperty.call(input, field)) output[field] = input[field];
  return output;
}, {});

const parseSort = (value = '-createdAt') => {
  const sort = {};
  value.split(',').forEach((item) => {
    const entry = item.trim();
    if (!entry) return;
    const direction = entry.startsWith('-') ? -1 : 1;
    const field = entry.replace(/^[-+]/, '');
    if (!SORTABLE_FIELDS.has(field)) {
      throw new AppError(`Sorting by ${field} is not supported`, 400, { code: 'INVALID_SORT' });
    }
    sort[field] = direction;
  });
  return Object.keys(sort).length ? sort : { createdAt: -1 };
};

const buildFilter = (query, isDeleted = false) => {
  const filter = { isDeleted };
  if (query.search) {
    const expression = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = ['candidateId', 'firstName', 'lastName', 'fullName', 'email', 'mobile']
      .map((field) => ({ [field]: expression }));
  }
  if (query.status) filter.status = query.status;
  if (query.source) filter.source = query.source;
  if (query.qualification) filter.qualification = new RegExp(`^${escapeRegex(query.qualification)}$`, 'i');
  if (query.minExperience !== undefined || query.maxExperience !== undefined) {
    filter.experienceYears = {};
    if (query.minExperience !== undefined) filter.experienceYears.$gte = Number(query.minExperience);
    if (query.maxExperience !== undefined) filter.experienceYears.$lte = Number(query.maxExperience);
  }
  if (query.createdFrom || query.createdTo) {
    filter.createdAt = {};
    if (query.createdFrom) filter.createdAt.$gte = new Date(query.createdFrom);
    if (query.createdTo) filter.createdAt.$lte = new Date(query.createdTo);
  }
  return filter;
};

const createCandidateService = ({ CandidateModel = Candidate, CounterModel = CandidateCounter } = {}) => {
  const ensureUniqueContact = async (email, mobile, excludeId) => {
    const duplicateFilter = { email, mobile, isDeleted: false };
    if (excludeId) duplicateFilter._id = { $ne: excludeId };
    if (await CandidateModel.exists(duplicateFilter)) {
      throw new AppError('A candidate with this email and mobile already exists', 409, {
        code: 'DUPLICATE_CANDIDATE',
      });
    }
  };

  const create = async (input, userId) => {
    await ensureUniqueContact(input.email, input.mobile);
    const counter = await CounterModel.findOneAndUpdate(
      { _id: 'candidateId' },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    if (counter.sequence > 999999) {
      throw new AppError('Candidate ID sequence limit has been reached', 409, {
        code: 'CANDIDATE_ID_LIMIT_REACHED',
      });
    }
    const candidateId = `CRTS${String(counter.sequence).padStart(6, '0')}`;
    return CandidateModel.create({
      ...pick(input, EDITABLE_FIELDS),
      candidateId,
      createdBy: userId,
      updatedBy: userId,
    });
  };

  const list = async (query) => {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const filter = buildFilter(query);
    const [candidates, total] = await Promise.all([
      CandidateModel.find(filter)
        .sort(parseSort(query.sort))
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CandidateModel.countDocuments(filter),
    ]);
    return {
      candidates,
      meta: { total, totalPages: Math.ceil(total / limit), currentPage: page },
    };
  };

  const getById = async (id) => {
    const candidate = await CandidateModel.findOne({
      ...documentLookup(id, 'candidateId'),
      isDeleted: false,
    });
    if (!candidate) throw new AppError('Candidate not found', 404, { code: 'CANDIDATE_NOT_FOUND' });
    return candidate;
  };

  const update = async (id, input, userId) => {
    const candidate = await getById(id);
    const changes = pick(input, EDITABLE_FIELDS);
    const email = changes.email ?? candidate.email;
    const mobile = changes.mobile ?? candidate.mobile;
    await ensureUniqueContact(email, mobile, candidate._id);
    candidate.set(changes);
    candidate.updatedBy = userId;
    await candidate.save();
    return candidate;
  };

  const remove = async (id, userId) => {
    const candidate = await getById(id);
    candidate.isDeleted = true;
    candidate.deletedAt = new Date();
    candidate.deletedBy = userId;
    candidate.updatedBy = userId;
    await candidate.save();
  };

  const listTrash = async (query) => {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const filter = buildFilter(query, true);
    const [candidates, total] = await Promise.all([
      CandidateModel.find(filter)
        .sort(parseSort(query.sort))
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CandidateModel.countDocuments(filter),
    ]);
    return {
      candidates,
      meta: { total, totalPages: Math.ceil(total / limit), currentPage: page },
    };
  };

  const restore = async (id, userId) => {
    const candidate = await CandidateModel.findOne({
      ...documentLookup(id, 'candidateId'),
      isDeleted: true,
    });
    if (!candidate) throw new AppError('Deleted candidate not found', 404, { code: 'CANDIDATE_NOT_FOUND' });
    
    // Ensure restoring doesn't conflict with active candidates (unique index on email/mobile is filtered by isDeleted: false)
    await ensureUniqueContact(candidate.email, candidate.mobile, candidate._id);
    
    candidate.isDeleted = false;
    candidate.deletedAt = null;
    candidate.deletedBy = null;
    candidate.updatedBy = userId;
    await candidate.save();
    return candidate;
  };

  const bulkDelete = async (userId, candidateIds = []) => {
    const filter = { isDeleted: false };
    if (candidateIds && candidateIds.length > 0) {
      filter.candidateId = { $in: candidateIds };
    }
    const result = await CandidateModel.updateMany(
      filter,
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: userId, updatedBy: userId } }
    );
    return { deletedCount: result.modifiedCount };
  };

  const bulkRestore = async (userId) => {
    // Note: Bulk restore might fail unique constraints if duplicates exist between active and trash,
    // but typically all are in trash, so it's safe. 
    // We update them iteratively to catch unique constraint errors if needed, but updateMany is faster.
    // Given the unique index applies to isDeleted: false, bulk restore could throw E11000 if duplicates exist.
    const result = await CandidateModel.updateMany(
      { isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, deletedBy: null, updatedBy: userId } }
    );
    return { restoredCount: result.modifiedCount };
  };

  const hardDeleteExpiredCandidates = async (days = 30) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - days);
    
    const result = await CandidateModel.deleteMany({
      isDeleted: true,
      deletedAt: { $lt: expiryDate },
    });
    return { deletedCount: result.deletedCount };
  };

  return { create, getById, list, remove, update, listTrash, restore, bulkDelete, bulkRestore, hardDeleteExpiredCandidates };
};

module.exports = Object.assign(createCandidateService(), {
  buildFilter,
  createCandidateService,
  parseSort,
});
