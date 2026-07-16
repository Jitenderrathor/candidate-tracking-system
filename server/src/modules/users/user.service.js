const crypto = require('node:crypto');
const AppError = require('../../common/errors/AppError');
const { escapeRegex } = require('../../common/utils/mongoQuery');
const User = require('../auth/user.model');
const { sendUserCreationEmail } = require('../email/email.service');

const SORT_FIELDS = Object.freeze({ name: 'name', fullName: 'name', createdAt: 'createdAt' });

const PERMISSION_MAPPINGS = {
  'User': ['dashboard', 'edit_candidate'],
  'Admin': ['dashboard', 'reports', 'edit_candidate', 'add_candidate', 'assign_candidates', 'select_multiple', 'bulk_email', 'export_excel', 'excel_import', 'manage_users', 'recycle_bin', 'email_templates'],
  'Super Admin': ['dashboard', 'reports', 'edit_candidate', 'add_candidate', 'assign_candidates', 'select_multiple', 'bulk_email', 'export_excel', 'excel_import', 'manage_users', 'recycle_bin', 'email_templates', 'system_settings', 'manage_admins', 'wipe_data']
};

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
    if (actor && actor.role !== 'Super Admin') {
      const allowedRoles = actor.permissions?.includes('manage_admins') ? ['User', 'Admin'] : ['User'];
      if (filter.role) {
        if (!allowedRoles.includes(filter.role)) {
          filter.role = 'None';
        }
      } else {
        filter.role = { $in: allowedRoles };
      }
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

  const create = async ({ fullName, email, password, role, permissions }, actor) => {
    if (actor.role !== 'Super Admin') {
      if (role === 'Super Admin') {
        throw new AppError('Only Super Admins can create Super Admins', 403, { code: 'FORBIDDEN_ROLE_CREATION' });
      }
      if (role === 'Admin' && !actor.permissions?.includes('manage_admins')) {
        throw new AppError('You do not have permission to create Admins', 403, { code: 'FORBIDDEN_ROLE_CREATION' });
      }
    }
    await ensureUniqueEmail(email);
    
    const initialPermissions = permissions || PERMISSION_MAPPINGS[role] || [];
    
    const user = await UserModel.create({
      name: fullName,
      fullName,
      email,
      password,
      role,
      permissions: initialPermissions,
      createdBy: actor._id,
      updatedBy: actor._id,
    });
    
    const creatorName = actor.fullName || actor.name || 'An Administrator';
    await sendUserCreationEmail(email, fullName, password, creatorName);
    
    return toPublicUser(user);
  };

  const update = async (id, changes, actor) => {
    const user = await getDocument(id);
    if (actor.role !== 'Super Admin') {
      if (user.role === 'Super Admin') {
        throw new AppError('You cannot modify Super Admins', 403, { code: 'FORBIDDEN_USER_MODIFICATION' });
      }
      if (user.role === 'Admin' && !actor.permissions?.includes('manage_admins')) {
        throw new AppError('You do not have permission to modify Admins', 403, { code: 'FORBIDDEN_USER_MODIFICATION' });
      }
      if (changes.role === 'Super Admin') {
        throw new AppError('You cannot grant Super Admin role', 403, { code: 'FORBIDDEN_ROLE_ELEVATION' });
      }
      if (changes.role === 'Admin' && !actor.permissions?.includes('manage_admins')) {
        throw new AppError('You do not have permission to grant Admin role', 403, { code: 'FORBIDDEN_ROLE_ELEVATION' });
      }
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
    if (changes.permissions !== undefined) user.permissions = changes.permissions;
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
    if (actor.role !== 'Super Admin') {
      if (user.role === 'Super Admin') {
        throw new AppError('You cannot deactivate Super Admins', 403, { code: 'FORBIDDEN_USER_MODIFICATION' });
      }
      if (user.role === 'Admin' && !actor.permissions?.includes('manage_admins')) {
        throw new AppError('You do not have permission to deactivate Admins', 403, { code: 'FORBIDDEN_USER_MODIFICATION' });
      }
    }
    user.isActive = isActive;
    user.updatedBy = actor._id;
    await user.save();
    return toPublicUser(user);
  };

  const resetPassword = async (id, actor) => {
    const user = await getDocument(id);
    if (actor.role !== 'Super Admin') {
      if (user.role === 'Super Admin') {
        throw new AppError('You cannot reset password for Super Admins', 403, { code: 'FORBIDDEN_USER_MODIFICATION' });
      }
      if (user.role === 'Admin' && !actor.permissions?.includes('manage_admins')) {
        throw new AppError('You do not have permission to reset passwords for Admins', 403, { code: 'FORBIDDEN_USER_MODIFICATION' });
      }
    }
    const temporaryPassword = temporaryPasswordFactory();
    user.password = temporaryPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.updatedBy = actor._id;
    await user.save();
    return { user: toPublicUser(user), temporaryPassword };
  };

  const remove = async (id, actor) => {
    if (String(id) === String(actor._id)) {
      throw new AppError('You cannot delete your own account', 409, {
        code: 'SELF_DELETION_FORBIDDEN',
      });
    }
    const user = await getDocument(id);
    if (actor.role !== 'Super Admin') {
      if (user.role === 'Super Admin') {
        throw new AppError('You cannot delete Super Admins', 403, { code: 'FORBIDDEN_USER_MODIFICATION' });
      }
      if (user.role === 'Admin' && !actor.permissions?.includes('manage_admins')) {
        throw new AppError('You do not have permission to delete Admins', 403, { code: 'FORBIDDEN_USER_MODIFICATION' });
      }
    }
    await UserModel.findByIdAndDelete(id);
    return true;
  };

  return { create, getById, list, resetPassword, setActive, update, remove };
};

module.exports = Object.assign(createUserService(), {
  buildFilter,
  createUserService,
  generateTemporaryPassword,
  parseSort,
});
