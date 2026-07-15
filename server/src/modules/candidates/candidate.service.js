const AppError = require('../../common/errors/AppError');
const { documentLookup, escapeRegex } = require('../../common/utils/mongoQuery');
const Candidate = require('./candidate.model');
const CandidateCounter = require('./candidateCounter.model');
const ExcelJS = require('exceljs');

const EDITABLE_FIELDS = [
  'fullName', 'gender', 'email', 'mobile',
  'experienceYears', 'resumeUrl', 'linkedInProfile', 'source', 'remarks',
];
const SORTABLE_FIELDS = new Set([
  'candidateId', 'fullName', 'experienceYears',
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

const buildFilter = (query, isDeleted = false, user = null) => {
  const filter = { isDeleted };
  
  if (user && user.role === 'User') {
    filter.$or = [
      { assignedTo: user._id },
      { createdBy: user._id }
    ];
  }

  if (query.search) {
    const expression = new RegExp(escapeRegex(query.search), 'i');
    const searchOr = ['candidateId', 'fullName', 'email', 'mobile']
      .map((field) => ({ [field]: expression }));
      
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
      delete filter.$or;
    } else {
      filter.$or = searchOr;
    }
  }
  if (query.status) filter.status = query.status;
  if (query.source) filter.source = query.source;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
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

  const list = async (query, user = null) => {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const filter = buildFilter(query, false, user);
    const [candidates, total] = await Promise.all([
      CandidateModel.find(filter)
        .populate('assignedTo', 'name email')
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

  const getById = async (id, user = null) => {
    const filter = { ...documentLookup(id, 'candidateId'), isDeleted: false };
    if (user && user.role === 'User') {
      filter.$or = [{ assignedTo: user._id }, { createdBy: user._id }];
    }
    const candidate = await CandidateModel.findOne(filter).populate('assignedTo', 'name email');
    if (!candidate) throw new AppError('Candidate not found', 404, { code: 'CANDIDATE_NOT_FOUND' });
    return candidate;
  };

  const getByIds = async (ids) => {
    return CandidateModel.find({ candidateId: { $in: ids }, isDeleted: false }).populate('assignedTo', 'name email').lean();
  };

  const getByStatuses = async (statuses) => {
    return CandidateModel.find({ status: { $in: statuses }, isDeleted: false }).populate('assignedTo', 'name email').lean();
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

  const listTrash = async (query, user = null) => {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const filter = buildFilter(query, true, user);
    const [candidates, total] = await Promise.all([
      CandidateModel.find(filter)
        .populate('assignedTo', 'name email')
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

  const bulkAssign = async (candidateIds, assignedTo, userId) => {
    const result = await CandidateModel.updateMany(
      { candidateId: { $in: candidateIds }, isDeleted: false },
      { $set: { assignedTo, updatedBy: userId } }
    );
    return { assignedCount: result.modifiedCount };
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

  const exportData = async (query, user = null) => {
    const filter = buildFilter(query, false, user);
    const candidates = await CandidateModel.find(filter)
      .populate('assignedTo', 'name email')
      .sort(parseSort(query.sort))
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Candidates');

    worksheet.columns = [
      { header: 'Candidate ID', key: 'candidateId', width: 15 },
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Experience (Years)', key: 'experienceYears', width: 15 },
      { header: 'Resume URL', key: 'resumeUrl', width: 30 },
      { header: 'LinkedIn URL', key: 'linkedInProfile', width: 30 },
      { header: 'Source', key: 'source', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Assigned To', key: 'assignedTo', width: 25 },
      { header: 'Registration Date', key: 'createdAt', width: 20 },
    ];

    candidates.forEach((c) => {
      worksheet.addRow({
        ...c,
        assignedTo: c.assignedTo ? c.assignedTo.name : 'Unassigned',
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '',
      });
    });

    worksheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  };

  return { create, getById, getByIds, getByStatuses, list, remove, update, listTrash, restore, bulkDelete, bulkRestore, bulkAssign, hardDeleteExpiredCandidates, exportData };
};

module.exports = Object.assign(createCandidateService(), {
  buildFilter,
  createCandidateService,
  parseSort,
});
