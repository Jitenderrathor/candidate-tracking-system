const nodemailer = require('nodemailer');
const env = require('../../config/env');
const AppError = require('../../common/errors/AppError');
const Settings = require('../settings/settings.model');

const getTransporter = async () => {
  let host = env.smtp.host;
  let port = env.smtp.port;
  let user = env.smtp.user;
  let pass = env.smtp.pass;

  try {
    const settings = await Settings.findOne();
    if (settings && settings.smtpHost && settings.smtpPort && settings.smtpUser && settings.smtpPass) {
      host = settings.smtpHost;
      port = settings.smtpPort;
      user = settings.smtpUser;
      pass = settings.smtpPass;
    }
  } catch (error) {
    console.error('Failed to fetch SMTP settings from DB:', error);
  }

  if (!user || !pass) {
    console.warn('SMTP credentials are not configured. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass: pass.replace(/^"|"$/g, ''), // Strip surrounding quotes if present
    },
  });
};

const getSettings = async () => {
  try {
    const settings = await Settings.findOne();
    if (settings) {
      const email = settings.smtpUser || env.smtp.user;
      const from = settings.smtpFromName
        ? `"${settings.smtpFromName}" <${email}>`
        : env.smtp.from;
      
      return {
        from,
        defaultCc: settings.defaultCc || '',
        defaultBcc: settings.defaultBcc || '',
      };
    }
  } catch (error) {
    console.error('Failed to fetch settings from DB:', error);
  }
  return {
    from: env.smtp.from,
    defaultCc: '',
    defaultBcc: '',
  };
};

const sendPasswordResetOTP = async (to, otp) => {
  const transporter = await getTransporter();
  if (!transporter) {
    console.error('Failed to send OTP because SMTP is not configured.');
    return;
  }

  const { from } = await getSettings();

  const mailOptions = {
    from,
    to,
    subject: 'Your Password Reset OTP',
    text: `Your password reset OTP is: ${otp}\n\nThis OTP is valid for ${env.passwordResetExpiresMinutes} minutes. If you did not request a password reset, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>You requested to reset your password. Use the following OTP to complete the process:</p>
        <div style="background-color: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; margin: 24px 0;">
          <strong style="font-size: 24px; letter-spacing: 4px; color: #1e40af;">${otp}</strong>
        </div>
        <p>This OTP is valid for <strong>${env.passwordResetExpiresMinutes} minutes</strong>.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new AppError('There was an error sending the password reset email. Try again later!', 500);
  }
};

const sendBulkEmails = async (candidates, template, { cc } = {}) => {
  const transporter = await getTransporter();
  if (!transporter) {
    console.error('Failed to send bulk emails because SMTP is not configured.');
    return;
  }

  const { from, defaultCc } = await getSettings();

  const finalCc = [cc, defaultCc].filter(Boolean).join(', ');

  // Process sequentially to avoid slamming the SMTP server
  for (const candidate of candidates) {
    let html = template.htmlBody;
    let subject = template.subject;

    template.variables.forEach((variable) => {
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
      const value = candidate[variable] || '';
      html = html.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    try {
      await transporter.sendMail({
        from,
        to: candidate.email,
        cc: finalCc,
        subject,
        html,
      });
      // Tiny delay to avoid rate limits on basic SMTP servers
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      console.error(`Failed to send email to ${candidate.email}:`, error);
    }
  }
};

module.exports = { sendPasswordResetOTP, sendBulkEmails };
