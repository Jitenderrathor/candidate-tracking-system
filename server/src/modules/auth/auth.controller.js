const env = require('../../config/env');
const { success } = require('../../common/utils/apiResponse');
const authService = require('./auth.service');

const login = async (req, res) => success(res, {
  message: 'Login successful',
  data: await authService.login(req.body),
});

const changePassword = async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  return success(res, { message: 'Password changed successfully' });
};

const forgotPassword = async (req, res) => {
  const resetToken = await authService.forgotPassword(req.body.email);
  const data = env.nodeEnv === 'development' && resetToken ? { resetToken } : null;
  return success(res, {
    message: 'If an active account exists, a password reset has been initiated',
    data,
  });
};

const resetPassword = async (req, res) => {
  await authService.resetPassword(req.body);
  return success(res, { message: 'Password reset successfully' });
};

const profile = async (req, res) => success(res, {
  message: 'Profile retrieved successfully',
  data: { user: await authService.getProfile(req.user.id) },
});

module.exports = { changePassword, forgotPassword, login, profile, resetPassword };
