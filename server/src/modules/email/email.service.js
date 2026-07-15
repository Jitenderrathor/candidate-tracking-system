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

    (template.variables || []).forEach((variable) => {
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
      const value = candidate[variable] || '';
      html = html.replace(regex, value);
      subject = subject.replace(regex, value);
    });

    try {
      const mailOptions = {
        from,
        to: candidate.email,
        subject,
        html,
      };
      if (finalCc) mailOptions.cc = finalCc;

      await transporter.sendMail(mailOptions);
      // Tiny delay to avoid rate limits on basic SMTP servers
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      console.error(`Failed to send email to ${candidate.email}:`, error);
    }
  }
};

const sendUserCreationEmail = async (to, name, password, creatorName) => {
  const transporter = await getTransporter();
  if (!transporter) {
    console.error('Failed to send user creation email because SMTP is not configured.');
    return;
  }

  const { from } = await getSettings();

  const mailOptions = {
    from,
    to,
    subject: 'Welcome to Candidate Tracking System',
    text: `Hello ${name},\n\n${creatorName} has created an account for you and given you access to the application.\n\nHere are your login credentials:\nEmail (Username): ${to}\nPassword: ${password}\n\nPlease log in here: ${env.clientOrigin}/login\n\nPlease log in and change your password as soon as possible.\n\nBest regards,\nThe Candidate Tracking System Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.5;">
        <h2>Welcome to Candidate Tracking System!</h2>
        <p>Hello ${name},</p>
        <p><strong>${creatorName}</strong> has created an account for you and granted you access to the application.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Your Login Credentials:</h3>
          <p style="margin: 4px 0; color: #4b5563;"><strong>Username / Email:</strong> ${to}</p>
          <p style="margin: 4px 0; color: #4b5563;"><strong>Password:</strong> ${password}</p>
        </div>
        <p>You can log in to the application using the button below:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${env.clientOrigin}/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log In Now</a>
        </p>
        <p>Please log in and change your password as soon as possible for security purposes.</p>
        <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">Best regards,<br>The Candidate Tracking System Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending user creation email:', error);
  }
};

module.exports = { sendPasswordResetOTP, sendBulkEmails, sendUserCreationEmail };
