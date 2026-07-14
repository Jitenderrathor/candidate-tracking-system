require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const env = require('../config/env');
const EmailTemplate = require('../modules/email-templates/emailTemplate.model');
const User = require('../modules/auth/user.model');

const baseHtml = (content) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Headfield | Sales Hiring Event | Landing Page</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f5f7fa; font-family: 'Inter', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        .btn-primary:hover { background-color: #005f85 !important; box-shadow: 0 4px 12px rgba(0, 122, 172, 0.3) !important; }
        .data-row:hover { background-color: #f8fafc !important; }
        @media screen and (max-width: 480px) {
            .content-cell { padding: 30px 20px 30px 20px !important; }
            .header-cell { padding: 25px 15px !important; }
        }
    </style>
</head>
<body style="margin: 0 !important; padding: 0 !important; background-color: #f5f7fa; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f5f7fa; min-height: 100vh;">
        <tr>
            <td align="center" valign="top" style="padding: 40px 10px 40px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(5, 10, 26, 0.05); border: 1px solid #eef2f6;">
                    <tr>
                        <td align="center" valign="top" class="header-cell" style="background-color: #050A1A; padding: 35px 20px; border-bottom: 4px solid #007aac;">
                            <a href="https://headfield.com" target="_blank" style="text-decoration: none; border: none;">
                                <img src="https://headfield.com/wp-content/uploads/2026/05/Headfield-white.png" alt="Head Field Logo" width="180" style="display: block; border: 0; max-width: 180px; width: 180px;" />
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td align="left" valign="top" class="content-cell" style="padding: 40px 35px 40px 35px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="left" valign="top" style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #57565a;">
                                        ${content}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" valign="top" style="padding: 30px 20px; text-align: center; background-color: #050A1A;">
                            <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 20px auto;">
                                <tr>
                                    <td align="center" style="padding: 0 8px;">
                                        <a href="https://www.linkedin.com/company/head-field-solutions-pvt-ltd-" target="_blank" style="text-decoration: none;">
                                            <img src="https://cdn-icons-png.flaticon.com/512/145/145807.png" alt="LinkedIn" width="24" height="24" style="display: block; border: 0;" />
                                        </a>
                                    </td>
                                    <td align="center" style="padding: 0 8px;">
                                        <a href="https://www.instagram.com/head.field/" target="_blank" style="text-decoration: none;">
                                            <img src="https://cdn-icons-png.flaticon.com/512/3955/3955024.png" alt="Instagram" width="24" height="24" style="display: block; border: 0;" />
                                        </a>
                                    </td>
                                    <td align="center" style="padding: 0 8px;">
                                        <a href="https://wa.me/919211733881" target="_blank" style="text-decoration: none;">
                                            <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" alt="WhatsApp" width="24" height="24" style="display: block; border: 0;" />
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 6px 0; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: rgba(255, 255, 255, 0.7); font-weight: 500;">
                                © 2026 Head Field. All rights reserved.
                            </p>
                            <p style="margin: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.5; color: rgba(255, 255, 255, 0.5);">
                                You are receiving this because an inquiry or registration was submitted on the Headfield event page.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const ackContent = `<p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #050A1A;">Dear {{fullName}},</p>
<p style="margin: 0 0 20px 0;">Congratulations, you have successfully registered for India’s First Global Sales Talent Hunt, presented by Head Field.</p>
<p style="margin: 0 0 25px 0;">Our team will review your application, and you will be contacted shortly with the next steps, along with important updates regarding the event.</p>
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 25px; border-collapse: collapse;">
    <tr>
        <td style="padding: 20px; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #57565a;">
            <strong style="color: #050A1A; font-size: 15px; display: block; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Event Details</strong>
            <span style="display: block; margin-bottom: 6px;">📍 &nbsp;<strong>Venue:</strong> Bharat Mandapam, New Delhi</span>
            <span style="display: block;">📅 &nbsp;<strong>Date:</strong> 8th & 9th August</span>
        </td>
    </tr>
</table>
<p style="margin: 0 0 20px 0;">In the meantime, please keep an eye on your inbox and phone for further communication from our team.</p>
<p style="margin: 0 0 35px 0; font-weight: 600; color: #050A1A;">We look forward to welcoming you to India's First Global Sales Talent Hunt.</p>
<p style="margin: 0; line-height: 1.5; color: #57565a;">
    Warm regards,<br><br>
    <strong>Team HR</strong><br>
    <span style="color: #718096; font-size: 14px;">Head Field Solutions Pvt. Ltd.</span>
</p>`;

const shortContent = `<p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #050A1A;">Dear {{fullName}},</p>
<p style="margin: 0 0 20px 0;">We are thrilled to inform you that you have been <strong>Shortlisted</strong> for India’s First Global Sales Talent Hunt, presented by Head Field!</p>
<p style="margin: 0 0 25px 0;">Your profile stood out among many applications, and we are excited to learn more about your experience and skills in sales.</p>
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 25px; border-collapse: collapse;">
    <tr>
        <td style="padding: 20px; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #57565a;">
            <strong style="color: #050A1A; font-size: 15px; display: block; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Next Steps</strong>
            <span style="display: block; margin-bottom: 6px;">Please wait for our scheduling team to contact you with your interview slot.</span>
            <span style="display: block;">📍 &nbsp;<strong>Venue:</strong> Bharat Mandapam, New Delhi</span>
            <span style="display: block;">📅 &nbsp;<strong>Date:</strong> 8th & 9th August</span>
        </td>
    </tr>
</table>
<p style="margin: 0 0 20px 0;">Please ensure you are available on the event dates and prepare to showcase your best sales pitches.</p>
<p style="margin: 0 0 35px 0; font-weight: 600; color: #050A1A;">Congratulations once again! We look forward to meeting you soon.</p>
<p style="margin: 0; line-height: 1.5; color: #57565a;">
    Warm regards,<br><br>
    <strong>Team HR</strong><br>
    <span style="color: #718096; font-size: 14px;">Head Field Solutions Pvt. Ltd.</span>
</p>`;

const rejContent = `<p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #050A1A;">Dear {{fullName}},</p>
<p style="margin: 0 0 20px 0;">Thank you for your interest in India’s First Global Sales Talent Hunt and for taking the time to apply.</p>
<p style="margin: 0 0 25px 0;">After careful consideration of your application and profile, we regret to inform you that we will not be moving forward with your candidacy for this event at this time.</p>
<p style="margin: 0 0 20px 0;">We received a large number of applications, and the selection process was highly competitive. Please note that this decision does not reflect on your overall qualifications or potential.</p>
<p style="margin: 0 0 35px 0; font-weight: 600; color: #050A1A;">We wish you the very best in your future endeavors and hope our paths cross again.</p>
<p style="margin: 0; line-height: 1.5; color: #57565a;">
    Warm regards,<br><br>
    <strong>Team HR</strong><br>
    <span style="color: #718096; font-size: 14px;">Head Field Solutions Pvt. Ltd.</span>
</p>`;

async function seed() {
  try {
    await mongoose.connect(env.mongoUri);
    let adminUser = await User.findOne();
    const adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

    const templates = [
      {
        name: 'Acknowledgment',
        subject: 'Registration Confirmed: India\'s First Global Sales Talent Hunt',
        htmlBody: baseHtml(ackContent),
        variables: ['fullName'],
        createdBy: adminId,
        updatedBy: adminId,
      },
      {
        name: 'Shortlisted',
        subject: 'Congratulations! You are Shortlisted for the Sales Talent Hunt',
        htmlBody: baseHtml(shortContent),
        variables: ['fullName'],
        createdBy: adminId,
        updatedBy: adminId,
      },
      {
        name: 'Rejected',
        subject: 'Update on your application - Head Field Solutions',
        htmlBody: baseHtml(rejContent),
        variables: ['fullName'],
        createdBy: adminId,
        updatedBy: adminId,
      }
    ];

    for (const t of templates) {
      await EmailTemplate.findOneAndUpdate(
        { name: t.name },
        t,
        { upsert: true, new: true }
      );
    }
    
    console.log('Successfully seeded templates');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding templates:', error);
    process.exit(1);
  }
}

seed();
