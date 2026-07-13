process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildFilter,
  createCandidateService,
  parseSort,
} = require('../src/modules/candidates/candidate.service');

const makeServiceHarness = () => {
  const records = [];
  let sequence = 0;

  const wrap = (record) => ({
    ...record,
    set(changes) { Object.assign(this, changes); },
    async save() {
      const stored = records.find((item) => item._id === this._id);
      Object.assign(stored, this);
      return this;
    },
  });

  const matches = (record, filter) => {
    if (filter.isDeleted !== undefined && record.isDeleted !== filter.isDeleted) return false;
    if (filter.status && record.status !== filter.status) return false;
    if (filter.source && record.source !== filter.source) return false;
    if (filter.qualification && !filter.qualification.test(record.qualification)) return false;
    if (filter.experienceYears?.$gte !== undefined && record.experienceYears < filter.experienceYears.$gte) return false;
    if (filter.experienceYears?.$lte !== undefined && record.experienceYears > filter.experienceYears.$lte) return false;
    if (filter.$or && !filter.$or.some((condition) => {
      const [field, expression] = Object.entries(condition)[0];
      return expression.test(record[field]);
    })) return false;
    return true;
  };

  const CandidateModel = {
    async exists(filter) {
      return records.some((record) => record.email === filter.email
        && record.mobile === filter.mobile
        && !record.isDeleted
        && (!filter._id?.$ne || record._id !== String(filter._id.$ne)));
    },
    async create(input) {
      const record = { _id: String(records.length + 1).padStart(24, '0'), isDeleted: false, ...input };
      records.push(record);
      return wrap(record);
    },
    async findOne(filter) {
      const record = records.find((item) => matches(item, filter)
        && (!filter.candidateId || item.candidateId === filter.candidateId)
        && (!filter._id || item._id === String(filter._id)));
      return record ? wrap(record) : null;
    },
    find(filter) {
      let result = records.filter((record) => matches(record, filter));
      return {
        sort(sort) {
          const [field, direction] = Object.entries(sort)[0];
          result.sort((a, b) => String(a[field]).localeCompare(String(b[field])) * direction);
          return this;
        },
        skip(count) { result = result.slice(count); return this; },
        limit(count) { result = result.slice(0, count); return this; },
        lean() { return Promise.resolve(result.map((record) => ({ ...record }))); },
      };
    },
    async countDocuments(filter) { return records.filter((record) => matches(record, filter)).length; },
  };

  const CounterModel = {
    async findOneAndUpdate() { sequence += 1; return { sequence }; },
  };

  return { records, service: createCandidateService({ CandidateModel, CounterModel }) };
};

const input = (number = 1) => ({
  firstName: number === 1 ? 'Asha' : `Person${number}`,
  lastName: 'Sharma',
  gender: 'Female',
  dateOfBirth: new Date('1995-06-15'),
  email: `person${number}@example.com`,
  mobile: `+9198765432${String(number).padStart(2, '0')}`,
  address: 'Pune',
  qualification: number === 1 ? 'B.Tech' : 'MBA',
  experienceYears: number,
  skills: ['Node.js'],
  source: number === 1 ? 'LinkedIn' : 'Referral',
});

test('candidate service performs create, read, update, and soft delete', async () => {
  const { records, service } = makeServiceHarness();
  const created = await service.create(input(), 'user-1');
  assert.equal(created.candidateId, 'CRTS000001');

  const found = await service.getById('CRTS000001');
  assert.equal(found.email, 'person1@example.com');

  const updated = await service.update('CRTS000001', {
    firstName: 'Ashwini',
    candidateId: 'CRTS999999',
    status: 'Selected',
  }, 'user-2');
  assert.equal(updated.firstName, 'Ashwini');
  assert.equal(updated.candidateId, 'CRTS000001');
  assert.equal(updated.status, undefined);
  assert.equal(updated.updatedBy, 'user-2');

  await service.remove('CRTS000001', 'admin-1');
  assert.equal(records[0].isDeleted, true);
  assert.equal(records[0].deletedBy, 'admin-1');
  await assert.rejects(() => service.getById('CRTS000001'), { code: 'CANDIDATE_NOT_FOUND' });
});

test('candidate service rejects a duplicate email and mobile combination', async () => {
  const { service } = makeServiceHarness();
  await service.create(input(), 'user-1');
  await assert.rejects(() => service.create(input(), 'user-1'), { code: 'DUPLICATE_CANDIDATE' });
});

test('candidate listing paginates and returns required metadata', async () => {
  const { service } = makeServiceHarness();
  await service.create(input(1), 'user-1');
  await service.create(input(2), 'user-1');
  await service.create(input(3), 'user-1');

  const result = await service.list({ page: 2, limit: 1, sort: 'candidateId' });
  assert.equal(result.candidates.length, 1);
  assert.deepEqual(result.meta, { total: 3, totalPages: 3, currentPage: 2 });
  assert.equal(result.candidates[0].candidateId, 'CRTS000002');
});

test('search and filters produce scoped candidate results', async () => {
  const { service } = makeServiceHarness();
  await service.create(input(1), 'user-1');
  await service.create(input(2), 'user-1');
  await service.create(input(3), 'user-1');

  const searched = await service.list({ search: 'Asha' });
  assert.equal(searched.meta.total, 1);
  const filtered = await service.list({ source: 'Referral', minExperience: 2, maxExperience: 2 });
  assert.equal(filtered.meta.total, 1);
  assert.equal(filtered.candidates[0].candidateId, 'CRTS000002');

  const filter = buildFilter({ qualification: 'B.Tech', createdFrom: '2026-01-01' });
  assert.ok(filter.qualification instanceof RegExp);
  assert.ok(filter.createdAt.$gte instanceof Date);
  assert.deepEqual(parseSort('-experienceYears'), { experienceYears: -1 });
});
