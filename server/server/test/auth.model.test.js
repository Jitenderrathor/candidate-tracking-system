process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const User = require('../src/modules/auth/user.model');

test('User model hashes a changed password and omits sensitive JSON fields', async () => {
  const user = new User({
    name: 'Test User',
    email: 'USER@EXAMPLE.COM',
    password: 'Secure@123',
  });

  await user.validate();
  await new Promise((resolve, reject) => {
    User.schema.s.hooks.execPre('save', user, [], (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  assert.notEqual(user.password, 'Secure@123');
  assert.equal(await bcrypt.compare('Secure@123', user.password), true);
  assert.equal(user.email, 'user@example.com');
  assert.equal(user.role, 'User');
  assert.equal(user.isActive, true);

  const serialized = user.toJSON();
  assert.equal('password' in serialized, false);
  assert.equal('passwordResetToken' in serialized, false);
  assert.equal('passwordResetExpires' in serialized, false);
});
