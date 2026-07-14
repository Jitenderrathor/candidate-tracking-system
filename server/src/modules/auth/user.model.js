const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
  fullName: { type: String, trim: true, maxlength: 100, default: undefined },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  password: { type: String, required: [true, 'Password is required'], select: false },
  role: { type: String, enum: ['Super Admin', 'Admin', 'User'], default: 'User' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  passwordChangedAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  passwordResetToken: { type: String, select: false, default: null },
  passwordResetExpires: { type: Date, select: false, default: null },
}, {
  timestamps: true,
  optimisticConcurrency: true,
  toJSON: {
    transform: (_document, result) => {
      result.fullName = result.fullName || result.name;
      delete result.password;
      delete result.passwordResetToken;
      delete result.passwordResetExpires;
      return result;
    },
  },
});

userSchema.index({ role: 1, isActive: 1, createdAt: -1 });
userSchema.index({ name: 1, createdAt: -1 });

userSchema.index(
  { passwordResetToken: 1, passwordResetExpires: 1 },
  { partialFilterExpression: { passwordResetToken: { $type: 'string' } } },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  this.passwordChangedAt = new Date();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
