const { success } = require('../../common/utils/apiResponse');
const userService = require('./user.service');

const listUsers = async (req, res) => {
  const { users, meta } = await userService.list(req.query, req.user);
  return success(res, { message: 'Users retrieved successfully', data: { users }, meta });
};

const getUser = async (req, res) => success(res, {
  message: 'User retrieved successfully',
  data: { user: await userService.getById(req.params.id) },
});

const createUser = async (req, res) => success(res, {
  statusCode: 201,
  message: 'User created successfully',
  data: { user: await userService.create(req.body, req.user) },
});

const updateUser = async (req, res) => success(res, {
  message: 'User updated successfully',
  data: { user: await userService.update(req.params.id, req.body, req.user) },
});

const activateUser = async (req, res) => success(res, {
  message: 'User activated successfully',
  data: { user: await userService.setActive(req.params.id, true, req.user) },
});

const deactivateUser = async (req, res) => success(res, {
  message: 'User deactivated successfully',
  data: { user: await userService.setActive(req.params.id, false, req.user) },
});

const resetPassword = async (req, res) => success(res, {
  message: 'User password reset successfully',
  data: await userService.resetPassword(req.params.id, req.user),
});

module.exports = {
  activateUser,
  createUser,
  deactivateUser,
  getUser,
  listUsers,
  resetPassword,
  updateUser,
};
