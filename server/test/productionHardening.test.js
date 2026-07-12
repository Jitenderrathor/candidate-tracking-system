process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeError } = require('../src/common/middleware/errorHandler');
const { executeAggregation } = require('../src/common/utils/mongoQuery');
const env = require('../src/config/env');

test('central error normalization maps database failures to operational API errors', () => {
  const duplicate = normalizeError({ code: 11000 });
  const validation = normalizeError({
    name: 'ValidationError',
    errors: { email: { path: 'email', message: 'Email is invalid' } },
  });
  const conflict = normalizeError({ name: 'VersionError' });

  assert.equal(duplicate.statusCode, 409);
  assert.equal(duplicate.code, 'DUPLICATE_RESOURCE');
  assert.equal(validation.statusCode, 422);
  assert.deepEqual(validation.details, [{ field: 'email', message: 'Email is invalid' }]);
  assert.equal(conflict.statusCode, 409);
  assert.equal(conflict.code, 'CONCURRENT_MODIFICATION');
});

test('aggregation helper applies a bounded MongoDB execution time', async () => {
  let options;
  const Model = {
    aggregate() {
      return {
        option(receivedOptions) {
          options = receivedOptions;
          return Promise.resolve([{ total: 1 }]);
        },
      };
    },
  };

  const result = await executeAggregation(Model, [{ $match: {} }]);
  assert.deepEqual(options, { maxTimeMS: env.mongoQueryMaxTimeMs });
  assert.equal(result[0].total, 1);
});
