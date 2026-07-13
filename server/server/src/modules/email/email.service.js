const nodemailer = require('nodemailer');
const env = require('../../config/env');
const AppError = require('../../common/errors/AppError');

const createTransporter = () => {
  if (!env.smtp.user || !env.smtp.pass) {
    console.warn('SMTP credentials are not configured. Emails will not be sent.');
    return null;
  }
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465, // true for 465, false for other ports
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass.replace(/^"|"$/g, ''), // Strip surrounding quotes if present
    },
  });
};

const transporter = createTransporter();

const sendPasswordResetOTP = async (to, otp) => {
  if (!transporter) {
    console.error('Failed to send OTP because SMTP is not configured.');
    return;
  }

  const mailOptions = {
    from: env.smtp.from,
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

module.exports = { sendPasswordResetOTP };
