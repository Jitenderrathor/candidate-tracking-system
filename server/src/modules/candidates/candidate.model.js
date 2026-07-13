const mongoose = require('mongoose');
const {
  CANDIDATE_SOURCES,
  CANDIDATE_STATUSES,
  GENDERS,
} = require('./candidate.constants');

const candidateSchema = new mongoose.Schema({
  candidateId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    match: [/^CRTS\d{6}$/, 'Candidate ID must use the CRTS000001 format'],
  },
  firstName: { type: String, required: true, trim: true, maxlength: 100 },
  lastName: { type: String, required: true, trim: true, maxlength: 100 },
  fullName: { type: String, trim: true, maxlength: 200, default: '' },
  registrationDate: { type: Date, default: null },
  applicationType: { type: String, trim: true, maxlength: 255, default: '' },
  externalLeadId: { type: String, trim: true, maxlength: 200, default: '' },
  campaignName: { type: String, trim: true, maxlength: 255, default: '' },
  adName: { type: String, trim: true, maxlength: 255, default: '' },
  formName: { type: String, trim: true, maxlength: 255, default: '' },
  salesInterest: { type: String, trim: true, maxlength: 500, default: '' },
  salesExperience: { type: String, trim: true, maxlength: 200, default: '' },
  phoneVerified: { type: Boolean, default: null },
  linkedInProfile: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: (value) => !value || /^https?:\/\/[^\s]+$/i.test(value),
      message: 'LinkedIn profile URL is invalid',
    },
  },
  resumeFileName: { type: String, trim: true, maxlength: 255, default: '' },
  resumeFileType: { type: String, trim: true, maxlength: 100, default: '' },
  feedback: { type: String, trim: true, maxlength: 2000, default: '' },
  referenceStatus: { type: String, trim: true, maxlength: 200, default: '' },
  recruitmentStatus: {
    type: String,
    trim: true,
    maxlength: 200,
    default: undefined,
  },
  gender: { type: String, enum: GENDERS, default: 'Male' },
  dateOfBirth: {
    type: Date,
    default: null,
    validate: { validator: (value) => value < new Date(), message: 'Date of birth must be in the past' },
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email is invalid'],
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+?[1-9]\d{6,14}$/, 'Mobile is invalid'],
  },
  address: { type: String, trim: true, default: '', maxlength: 500 },
  qualification: { type: String, trim: true, default: '', maxlength: 200 },
  experienceYears: { type: Number, min: 0, max: 80, default: 0 },
  currentCompany: { type: String, trim: true, default: '', maxlength: 200 },
  currentCTC: { type: Number, min: 0, default: 0 },
  expectedCTC: { type: Number, min: 0, default: 0 },
  skills: {
    type: [{ type: String, trim: true, maxlength: 100 }],
    default: [],
  },
  resumeUrl: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: (value) => !value || /^https?:\/\/[^\s]+$/i.test(value),
      message: 'Resume URL is invalid',
    },
  },
  source: { type: String, required: true, enum: CANDIDATE_SOURCES },
  status: { type: String, enum: CANDIDATE_STATUSES, default: 'Registered' },
  remarks: { type: String, trim: true, default: '', maxlength: 2000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isDeleted: { type: Boolean, default: false, index: true, select: false },
  deletedAt: { type: Date, default: null, select: false },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, select: false },
}, { timestamps: true, optimisticConcurrency: true });

candidateSchema.index(
  { email: 1, mobile: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
candidateSchema.index({ isDeleted: 1, status: 1, source: 1, createdAt: -1 });
candidateSchema.index({ isDeleted: 1, source: 1 });
candidateSchema.index({ isDeleted: 1, createdAt: -1 });
candidateSchema.index({ isDeleted: 1, gender: 1 });
candidateSchema.index({ isDeleted: 1, qualification: 1 });
candidateSchema.index({ isDeleted: 1, experienceYears: 1 });
candidateSchema.index({ isDeleted: 1, currentCTC: 1 });
candidateSchema.index({ isDeleted: 1, expectedCTC: 1 });
candidateSchema.index({ isDeleted: 1, qualification: 1, experienceYears: 1 });

module.exports = mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);
