process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildFilter,
  createUserService,
  generateTemporaryPassword,
  parseSort,
} = require('../src/modules/users/user.service');

const ADMIN_ID = '000000000000000000000001';

const makeHarness = () => {
  const records = [];

  const wrap = (record) => ({
    ...record,
    toJSON() { return { ...this }; },
    async save() {
      const stored = records.find((item) => item._id === this._id);
      Object.assign(stored, this);
      return this;
    },
  });

  const matches = (record, filter) => {
    if (filter.role && record.role !== filter.role) return false;
    if (filter.isActive !== undefined && record.isActive !== filter.isActive) return false;
    if (filter.$or && !filter.$or.some((condition) => {
      const [field, expression] = Object.entries(condition)[0];
      return expression.test(record[field] || '');
    })) return false;
    return true;
  };

  const UserModel = {
    async exists(filter) {
      return records.some((record) => record.email === filter.email
        && (!filter._id?.$ne || record._id !== String(filter._id.$ne)));
    },
    async create(input) {
      const record = {
        _id: String(records.length + 2).padStart(24, '0'),
        isActive: true,
        createdAt: new Date(Date.UTC(2026, 0, records.length + 1)),
        updatedAt: new Date(),
        ...input,
      };
      records.push(record);
      return wrap(record);
    },
    async findById(id) {
      const record = records.find((item) => item._id === String(id));
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

  const service = createUserService({
    UserModel,
    temporaryPasswordFactory: () => 'TempSecure@123',
  });
  return { records, service };
};

const createInput = (number, role = 'User') => ({
  fullName: number === 1 ? 'Asha Sharma' : `Person ${number}`,
  email: `person${number}@example.com`,
  password: 'Secure@123',
  role,
});

test('user service creates and retrieves a backward-compatible public user', async () => {
  const { service } = makeHarness();
  const created = await service.create(createInput(1), ADMIN_ID);
  assert.equal(created.fullName, 'Asha Sharma');
  assert.equal(created.name, 'Asha Sharma');
  assert.equal(created.createdBy, ADMIN_ID);
  assert.equal('password' in created, false);
  const found = await service.getById(created._id);
  assert.equal(found.email, 'person1@example.com');
});

test('user service rejects duplicate email addresses', async () => {
  const { service } = makeHarness();
  await service.create(createInput(1), ADMIN_ID);
  await assert.rejects(() => service.create({ ...createInput(2), email: 'person1@example.com' }, ADMIN_ID), {
    code: 'DUPLICATE_USER_EMAIL',
  });
});

test('user service updates only supported profile fields', async () => {
  const { service } = makeHarness();
  const created = await service.create(createInput(1), ADMIN_ID);
  const updated = await service.update(created._id, {
    fullName: 'Asha Patel',
    email: 'asha@example.com',
    role: 'Admin',
  }, ADMIN_ID);
  assert.equal(updated.fullName, 'Asha Patel');
  assert.equal(updated.name, 'Asha Patel');
  assert.equal(updated.role, 'Admin');
});

test('user service activates, deactivates, and prevents self-deactivation', async () => {
  const { service } = makeHarness();
  const created = await service.create(createInput(1), ADMIN_ID);
  assert.equal((await service.setActive(created._id, false, ADMIN_ID)).isActive, false);
  assert.equal((await service.setActive(created._id, true, ADMIN_ID)).isActive, true);
  await assert.rejects(() => service.setActive(ADMIN_ID, false, ADMIN_ID), {
    code: 'SELF_DEACTIVATION_FORBIDDEN',
  });
});

test('user service resets a password and returns the temporary value once', async () => {
  const { records, service } = makeHarness();
  const created = await service.create(createInput(1), ADMIN_ID);
  const result = await service.resetPassword(created._id, ADMIN_ID);
  assert.equal(result.temporaryPassword, 'TempSecure@123');
  assert.equal(records[0].password, 'TempSecure@123');
  assert.equal(result.user.password, undefined);
});

test('user listing supports pagination, search, role, status, and sorting', async () => {
  const { service } = makeHarness();
  await service.create(createInput(1, 'Admin'), ADMIN_ID);
  await service.create(createInput(2), ADMIN_ID);
  const third = await service.create(createInput(3), ADMIN_ID);
  await service.setActive(third._id, false, ADMIN_ID);

  const page = await service.list({ page: 2, limit: 1, sort: 'name' });
  assert.deepEqual(page.meta, { total: 3, totalPages: 3, currentPage: 2, limit: 1 });
  const searched = await service.list({ search: 'Asha' });
  assert.equal(searched.meta.total, 1);
  assert.equal((await service.list({ role: 'Admin' })).meta.total, 1);
  assert.equal((await service.list({ status: 'inactive' })).meta.total, 1);
  assert.ok(buildFilter({ search: 'a+b' }).$or[0].name instanceof RegExp);
  assert.deepEqual(parseSort('-fullName'), { name: -1 });
});

test('generated temporary passwords satisfy the configured strength shape', () => {
  const password = generateTemporaryPassword();
  assert.match(password, /[a-z]/);
  assert.match(password, /[A-Z]/);
  assert.match(password, /\d/);
  assert.match(password, /[^A-Za-z0-9]/);
  assert.ok(password.length >= 8 && password.length <= 72);
});
