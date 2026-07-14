const emailTemplateService = require('./emailTemplate.service');

const createTemplate = async (req, res, next) => {
  try {
    const template = await emailTemplateService.createTemplate(req.body, req.user.id);
    res.status(201).json({ status: 'success', data: template });
  } catch (error) {
    next(error);
  }
};

const getTemplates = async (req, res, next) => {
  try {
    const templates = await emailTemplateService.getTemplates();
    res.status(200).json({ status: 'success', data: templates });
  } catch (error) {
    next(error);
  }
};

const getTemplateById = async (req, res, next) => {
  try {
    const template = await emailTemplateService.getTemplateById(req.params.id);
    res.status(200).json({ status: 'success', data: template });
  } catch (error) {
    next(error);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const template = await emailTemplateService.updateTemplate(req.params.id, req.body, req.user.id);
    res.status(200).json({ status: 'success', data: template });
  } catch (error) {
    next(error);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    await emailTemplateService.deleteTemplate(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
};
