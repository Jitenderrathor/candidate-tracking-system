const Settings = require('./settings.model');
const AppError = require('../../common/errors/AppError');
const env = require('../../config/env');

const getSettings = async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    // Return default settings from env if not configured yet
    const match = env.smtp.from.match(/^(.*?) <(.*?)>$/);
    const defaultName = match ? match[1].replace(/^"|"$/g, '').trim() : 'Candidate Tracking System';
    const defaultEmail = match ? match[2].trim() : env.smtp.from;

    return res.status(200).json({
      success: true,
      data: {
        smtpFromName: defaultName,
        smtpFromEmail: defaultEmail,
        defaultCc: '',
        defaultBcc: '',
        smtpHost: env.smtp.host || '',
        smtpPort: env.smtp.port || '',
        smtpUser: env.smtp.user || '',
        hasSmtpPass: !!env.smtp.pass,
        history: [],
      },
    });
  }

  // Hide password, just return if it's set
  const responseData = settings.toObject();
  responseData.hasSmtpPass = !!responseData.smtpPass;
  delete responseData.smtpPass;
  // sort history newest first for UI
  responseData.history = (responseData.history || []).sort((a, b) => b.updatedAt - a.updatedAt);

  res.status(200).json({
    success: true,
    data: responseData,
  });
};

const updateSettings = async (req, res) => {
  const { smtpFromName, smtpFromEmail, defaultCc, defaultBcc, smtpHost, smtpPort, smtpUser, smtpPass } = req.body;
  
  let settings = await Settings.findOne();
  let smtpChanged = false;

  if (!settings) {
    settings = new Settings({
      smtpFromName,
      smtpFromEmail,
      defaultCc,
      defaultBcc,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      updatedBy: req.user._id,
    });
    smtpChanged = !!(smtpHost || smtpPort || smtpUser || smtpPass);
  } else {
    if (smtpFromName !== undefined) settings.smtpFromName = smtpFromName;
    if (smtpFromEmail !== undefined) settings.smtpFromEmail = smtpFromEmail;
    if (defaultCc !== undefined) settings.defaultCc = defaultCc;
    if (defaultBcc !== undefined) settings.defaultBcc = defaultBcc;
    
    // Check if smtp config changed
    if ((smtpHost !== undefined && settings.smtpHost !== smtpHost) || 
        (smtpPort !== undefined && settings.smtpPort !== smtpPort) || 
        (smtpUser !== undefined && settings.smtpUser !== smtpUser) || 
        (smtpPass && settings.smtpPass !== smtpPass)) {
      smtpChanged = true;
    }

    if (smtpHost !== undefined) settings.smtpHost = smtpHost;
    if (smtpPort !== undefined) settings.smtpPort = smtpPort;
    if (smtpUser !== undefined) settings.smtpUser = smtpUser;
    if (smtpPass) settings.smtpPass = smtpPass; // Only update if provided

    settings.updatedBy = req.user._id;
  }

  if (smtpChanged) {
    settings.history = settings.history || [];
    settings.history.push({
      action: 'SMTP_CONFIG_UPDATED',
      smtpUser: settings.smtpUser || 'Unknown',
      updatedBy: req.user._id,
      updatedAt: new Date(),
    });
  }

  await settings.save();
  await settings.populate('history.updatedBy', 'name email');

  const responseData = settings.toObject();
  responseData.hasSmtpPass = !!responseData.smtpPass;
  delete responseData.smtpPass;
  responseData.history = (responseData.history || []).sort((a, b) => b.updatedAt - a.updatedAt);

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: responseData,
  });
};

module.exports = {
  getSettings,
  updateSettings,
};
