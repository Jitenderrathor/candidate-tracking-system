const EmailTemplate = require('./emailTemplate.model');
const AppError = require('../../common/errors/AppError');

const extractVariables = (html) => {
  const matches = html.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '').trim()))];
};

const createTemplate = async (data, userId) => {
  const existing = await EmailTemplate.findOne({ name: data.name });
  if (existing) {
    throw new AppError('Template with this name already exists', 400);
  }
  
  const variables = extractVariables(data.htmlBody + ' ' + data.subject);
  
  const template = await EmailTemplate.create({
    ...data,
    variables,
    createdBy: userId,
    updatedBy: userId,
  });
  
  return template;
};

const getTemplates = async () => {
  return EmailTemplate.find().sort({ createdAt: -1 });
};

const getTemplateById = async (id) => {
  const template = await EmailTemplate.findById(id);
  if (!template) {
    throw new AppError('Template not found', 404);
  }
  return template;
};

const updateTemplate = async (id, data, userId) => {
  const template = await EmailTemplate.findById(id);
  if (!template) {
    throw new AppError('Template not found', 404);
  }
  
  if (data.name && data.name !== template.name) {
    const existing = await EmailTemplate.findOne({ name: data.name });
    if (existing) {
      throw new AppError('Template with this name already exists', 400);
    }
  }
  
  const htmlBody = data.htmlBody || template.htmlBody;
  const subject = data.subject || template.subject;
  const variables = extractVariables(htmlBody + ' ' + subject);
  
  Object.assign(template, {
    ...data,
    variables,
    updatedBy: userId,
  });
  
  await template.save();
  return template;
};

const deleteTemplate = async (id) => {
  const template = await EmailTemplate.findByIdAndDelete(id);
  if (!template) {
    throw new AppError('Template not found', 404);
  }
  return template;
};

module.exports = {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
};
