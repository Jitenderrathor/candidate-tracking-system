const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const AppError = require('../../common/errors/AppError');
const User = require('./user.model');

const DUMMY_PASSWORD_HASH = '$2b$12$RMhOb8UCAFHmyaoKKzN2H.AVMCiwtwloVGnkCpMORxlsGCpV03/Y6';

const publicUser = (user) => user.toJSON();

const signToken = (user) => jwt.sign(
  { sub: user.id, role: user.role },
  env.jwtSecret,
  { algorithm: 'HS256', expiresIn: env.jwtExpiresIn },
);

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  const passwordMatches = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
  if (!user || !passwordMatches) {
    throw new AppError('Invalid email or password', 401, { code: 'INVALID_CREDENTIALS' });
  }
  if (!user.isActive) {
    throw new AppError('User account is inactive', 403, { code: 'ACCOUNT_INACTIVE' });
  }

  user.lastLogin = new Date();
  await user.save();
  return { token: signToken(user), user: publicUser(user) };
};

const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
  if (!(await user.comparePassword(oldPassword))) {
    throw new AppError('Old password is incorrect', 400, { code: 'INVALID_OLD_PASSWORD' });
  }
  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user || !user.isActive) return null;

  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + env.passwordResetExpiresMinutes * 60 * 1000);
  await user.save();
  return token;
};

const resetPassword = async ({ token, newPassword }) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
    isActive: true,
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new AppError('Reset token is invalid or expired', 400, { code: 'INVALID_RESET_TOKEN' });
  }

  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
  return publicUser(user);
};

module.exports = { changePassword, forgotPassword, getProfile, login, resetPassword };
