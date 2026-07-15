const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const env = require('../../config/env');
const AppError = require('../../common/errors/AppError');
const asyncHandler = require('../../common/utils/asyncHandler');
const User = require('./user.model');

const authenticate = asyncHandler(async (req, _res, next) => {
  const authorization = req.get('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new AppError('Authentication token is required', 401, { code: 'AUTH_TOKEN_REQUIRED' });
  }

  const token = authorization.slice(7).trim();
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch (_error) {
    throw new AppError('Authentication token is invalid or expired', 401, {
      code: 'INVALID_AUTH_TOKEN',
    });
  }

  if (!mongoose.isValidObjectId(payload.sub)) {
    throw new AppError('Authentication token is invalid or expired', 401, {
      code: 'INVALID_AUTH_TOKEN',
    });
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new AppError('Authenticated user is unavailable', 401, { code: 'USER_UNAVAILABLE' });
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to access this resource', 403, {
      code: 'FORBIDDEN',
    }));
  }
  return next();
};

const superAdminOnly = authorize('Super Admin');
const adminOnly = authorize('Super Admin', 'Admin');
const userOrAdmin = authorize('Super Admin', 'Admin', 'User');

const requirePermission = (permission) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, { code: 'UNAUTHORIZED' }));
  }
  if (req.user.role === 'Super Admin') {
    return next();
  }
  if (!req.user.permissions || !req.user.permissions.includes(permission)) {
    return next(new AppError('You do not have permission to perform this action', 403, { code: 'FORBIDDEN_PERMISSION' }));
  }
  return next();
};

const requireAnyPermission = (...permissions) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, { code: 'UNAUTHORIZED' }));
  }
  if (req.user.role === 'Super Admin') {
    return next();
  }
  if (!req.user.permissions || !permissions.some(p => req.user.permissions.includes(p))) {
    return next(new AppError('You do not have permission to perform this action', 403, { code: 'FORBIDDEN_PERMISSION' }));
  }
  return next();
};

module.exports = { adminOnly, authenticate, authorize, superAdminOnly, userOrAdmin, requirePermission, requireAnyPermission };
