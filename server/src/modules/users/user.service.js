const crypto = require('node:crypto');
const AppError = require('../../common/errors/AppError');
const { escapeRegex } = require('../../common/utils/mongoQuery');
const User = require('../auth/user.model');

const SORT_FIELDS = Object.freeze({ name: 'name', fullName: 'name', createdAt: 'createdAt' });

const toPublicUser = (user) => {
  const value = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete value.password;
  delete value.passwordResetToken;
  delete value.passwordResetExpires;
  return { ...value, fullName: value.fullName || value.name };
};

const parseSort = (value = '-createdAt') => {
  const descending = value.startsWith('-');
  const requestedField = value.replace(/^-/, '');
  return { [SORT_FIELDS[requestedField] || 'createdAt']: descending ? -1 : 1 };
};

const buildFilter = ({ search, role, status } = {}) => {
  const filter = {};
  if (search) {
    const expression = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: expression }, { fullName: expression }, { email: expression }];
  }
  if (role) filter.role = role;
  if (status) filter.isActive = status === 'active';
  return filter;
};

const generateTemporaryPassword = () => `Aa1!${crypto.randomBytes(9).toString('base64url')}`;

const createUserService = ({ UserModel = User, temporaryPasswordFactory = generateTemporaryPassword } = {}) => {
  const getDocument = async (id) => {
    const user = await UserModel.findById(id);
    if (!user) throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
    return user;
  };

  const ensureUniqueEmail = async (email, excludedId) => {
    const filter = { email: email.toLowerCase() };
    if (excludedId) filter._id = { $ne: excludedId };
    if (await UserModel.exists(filter)) {
      throw new AppError('A user with this email already exists', 409, { code: 'DUPLICATE_USER_EMAIL' });
    }
  };

  const list = async (query = {}, actor) => {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);
    const filter = buildFilter(query);
    if (actor && actor.role === 'Admin') {
      filter.role = 'User';
    }
    const [users, total] = await Promise.all([
      UserModel.find(filter).sort(parseSort(query.sort)).skip((page - 1) * limit).limit(limit).lean(),
      UserModel.countDocuments(filter),
    ]);
    return {
      users: users.map(toPublicUser),
      meta: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit },
    };
  };

  const getById = async (id) => toPublicUser(await getDocument(id));

  const create = async ({ fullName, email, password, role }, actor) => {
    if (actor.role === 'Admin' && role !== 'User') {
      throw new AppError('Admins can only create standard Users', 403, { code: 'FORBIDDEN_ROLE_CREATION' });
    }
    await ensureUniqueEmail(email);
    const user = await UserModel.create({
      name: fullName,
      fullName,
      email,
      password,
      role,
      createdBy: actor._id,
      updatedBy: actor._id,
    });
    return toPublicUser(user);
  };

  const update = async (id, changes, actor) => {
    const user = await getDocument(id);
    if (actor.role === 'Admin' && user.role !== 'User') {
      throw new AppError('Admins can only modify standard Users', 403, { code: 'FORBIDDEN_USER_MODIFICATION' });
    }
    if (actor.role === 'Admin' && changes.role && changes.role !== 'User') {
      throw new AppError('Admins cannot grant elevated roles', 403, { code: 'FORBIDDEN_ROLE_ELEVATION' });
    }
    if (changes.email && changes.email.toLowerCase() !== user.email) {
      await ensureUniqueEmail(changes.email, user._id);
    }
    if (changes.fullName !== undefined) {
      user.fullName = changes.fullName;
      user.name = changes.fullName;
    }
    if (changes.email !== undefined) user.email = changes.email;
    if (changes.role !== undefined) user.role = changes.role;
    user.updatedBy = actor._id;
    await user.save();
    return toPublicUser(user);
  };

  const setActive = async (id, isActive, actor) => {
    if (!isActive && String(id) === String(actor._id)) {
      throw new AppError('You cannot deactivate your own account', 409, {
        code: 'SELF_DEACTIVATION_FORBIDDEN',
      });
    }
    const user = await getDocument(id);
    if (actor.role === 'Admin' && user.role !== 'User') {
      throw new AppError('Admins can only deactivate standard Users', 403, { code: 'FORBIDDEN_USER_MODIFICATION' });
    }
    user.isActive = isActive;
    user.updatedBy = actor._id;
    await user.save();
    return toPublicUser(user);
  };

  const resetPassword = async (id, actor) => {
    const user = await getDocument(id);
    if (actor.role === 'Admin' && user.role !== 'User') {
      throw new AppError('Admins can only reset passwords for standard Users', 403, { code: 'FORBIDDEN_USER_MODIFICATION' });
    }
    const temporaryPassword = temporaryPasswordFactory();
    user.password = temporaryPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.updatedBy = actor._id;
    await user.save();
    return { user: toPublicUser(user), temporaryPassword };
  };

  return { create, getById, list, resetPassword, setActive, update };
};

module.exports = Object.assign(createUserService(), {
  buildFilter,
  createUserService,
  generateTemporaryPassword,
  parseSort,
});
