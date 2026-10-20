const nodemailer = require('nodemailer');
const { EmailLog } = require('../models');
const { createAuditLog } = require('./auditLogService');

const isSmtpConfigured = () => {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.NODE_ENV !== 'test');
};

function createTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

function buildInternalEmail({ inspectionNumber, outletName, status, reviewerName, role, comments }) {
  const statusText = {
    SUBMITTED: 'submitted for your review',
    DIRECTOR_APPROVED: 'approved your inspection. It has been forwarded to the CEO/Registrar for final approval.',
    RETURNED_TO_INSPECTOR: 'returned the inspection for correction.',
    FINAL_APPROVED: 'final approval has been recorded.',
  }[status] || `updated the inspection status: ${status}`;

  return {
    html: `
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #202a2f; background: #f7f8f4; margin: 0; padding: 30px; }
          .container { max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #dfe6df; border-radius: 14px; box-shadow: 0 10px 30px rgba(15,107,62,0.08); }
          .header { background: #0b4d32; color: white; padding: 20px 30px; border-radius: 14px 14px 0 0; }
          .header h1 { margin: 0; font-size: 20px; }
          .header .subtitle { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px; }
          .body { padding: 28px 30px; }
          .body h2 { margin: 0 0 12px; font-size: 17px; color: #102a43; }
          .body p { margin: 0 0 14px; line-height: 1.6; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .badge.info { background: #e8f3ff; color: #1f5dbf; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
          .info-row:last-child { border-bottom: none; }
          .info-row .label { color: #5c6770; font-weight: 600; }
          .footer { padding: 16px 30px; background: #f9faf7; border-radius: 0 0 14px 14px; font-size: 12px; color: #5c6770; text-align: center; }
          .comment-box { background: #f9faf7; border: 1px solid #dfe6df; border-radius: 10px; padding: 14px; margin: 16px 0; font-size: 14px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Kenya Veterinary Board</h1>
            <div class="subtitle">Veterinary Inspection Portal &mdash; Internal Notification</div>
          </div>
          <div class="body">
            <h2>${statusText}</h2>
            <p>Hello ${reviewerName || 'Reviewer'},</p>
            <div class="info-row"><span class="label">Inspection Number</span><span>${inspectionNumber}</span></div>
            <div class="info-row"><span class="label">Outlet</span><span>${outletName}</span></div>
            <div class="info-row"><span class="label">Action By</span><span>${role}</span></div>
            <div class="info-row"><span class="label">Status</span><span><span class="badge info">${statusText}</span></span></div>
            ${comments ? `<div class="comment-box"><strong>Comment:</strong> ${comments}</div>` : ''}
            <p>Please log in to the inspection portal to review the full details.</p>
          </div>
          <div class="footer">
            Kenya Veterinary Board &mdash; Upholding Veterinary Standards<br>
            P.O. Box 513 - 00605, Uthiru | Tel: +254-722 305 253 | info@kenyavetboard.or.ke
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Kenya Veterinary Board - Veterinary Inspection Portal

${statusText}

Inspection Number: ${inspectionNumber}
Outlet: ${outletName}
Action By: ${role}

${comments ? `Comment: ${comments}` : ''}

Please log in to the inspection portal to review the full details.
    `,
  };
}

function buildOwnerEmail({ outletName, inspectionNumber, inspectionDate, status, comments }) {
  return {
    html: `
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #202a2f; background: #f7f8f4; margin: 0; padding: 30px; }
          .container { max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #dfe6df; border-radius: 14px; box-shadow: 0 10px 30px rgba(15,107,62,0.08); }
          .header { background: #0b4d32; color: white; padding: 20px 30px; border-radius: 14px 14px 0 0; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
          .header .subtitle { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px; }
          .body { padding: 28px 30px; }
          .body h2 { margin: 0 0 12px; font-size: 17px; color: #102a43; }
          .body p { margin: 0 0 14px; line-height: 1.6; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .badge.success { background: #e7f8ee; color: #116c3a; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
          .info-row:last-child { border-bottom: none; }
          .info-row .label { color: #5c6770; font-weight: 600; }
          .footer { padding: 16px 30px; background: #f9faf7; border-radius: 0 0 14px 14px; font-size: 12px; color: #5c6770; text-align: center; }
          .comment-box { background: #f9faf7; border: 1px solid #dfe6df; border-radius: 10px; padding: 14px; margin: 16px 0; font-size: 14px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Kenya Veterinary Board</h1>
            <div class="subtitle">Upholding Veterinary Standards &mdash; Official Notification</div>
          </div>
          <div class="body">
            <h2>Final Inspection Report</h2>
            <p>Dear ${outletName || 'Outlet Owner'},</p>
            <p>This letter confirms that your veterinary inputs outlet has been inspected and final approval has been granted by the Kenya Veterinary Board.</p>
            <div class="info-row"><span class="label">Outlet Name</span><span>${outletName}</span></div>
            <div class="info-row"><span class="label">Inspection Number</span><span>${inspectionNumber}</span></div>
            <div class="info-row"><span class="label">Inspection Date</span><span>${inspectionDate}</span></div>
            <div class="info-row"><span class="label">Final Status</span><span><span class="badge success">Final Approved</span></span></div>
            ${comments ? `<div class="comment-box"><strong>Official Comment:</strong> ${comments}</div>` : ''}
            <p>A copy of the final inspection report is attached to this email.</p>
            <p>For any inquiries, contact the Kenya Veterinary Board at <a href="mailto:info@kenyavetboard.or.ke" style="color:#0f6b3e;">info@kenyavetboard.or.ke</a>.</p>
          </div>
          <div class="footer">
            Kenya Veterinary Board &mdash; Upholding Veterinary Standards<br>
            P.O. Box 513 - 00605, Uthiru<br>
            Tel: +254-722 305 253 | +254-701 581 718<br>
            E-mail: info@kenyavetboard.or.ke<br>
            &copy; 2026 Kenya Veterinary Board. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Kenya Veterinary Board - Veterinary Inspection Portal

Final Inspection Report

Outlet Name: ${outletName}
Inspection Number: ${inspectionNumber}
Inspection Date: ${inspectionDate}
Final Status: FINAL APPROVED

${comments ? `Official Comment: ${comments}` : ''}

A copy of the final inspection report is attached.

For inquiries, contact: info@kenyavetboard.or.ke
P.O. Box 513 - 00605, Uthiru
Tel: +254-722 305 253 | +254-701 581 718
    `,
  };
}

function buildPasswordResetEmail({ name, resetUrl, expiresInMinutes = 60 }) {
  const safeName = String(name || 'User').replace(/[<>&"']/g, '');
  const safeUrl = String(resetUrl || '').replace(/[<>&"']/g, '');

  return {
    html: `
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #202a2f; background: #f7f8f4; margin: 0; padding: 30px; }
          .container { max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #dfe6df; border-radius: 14px; box-shadow: 0 10px 30px rgba(15,107,62,0.08); }
          .header { background: #0b4d32; color: white; padding: 20px 30px; border-radius: 14px 14px 0 0; }
          .header h1 { margin: 0; font-size: 20px; }
          .header .subtitle { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px; }
          .body { padding: 28px 30px; }
          .body h2 { margin: 0 0 12px; font-size: 17px; color: #102a43; }
          .body p { margin: 0 0 14px; line-height: 1.6; }
          .btn { display: inline-block; padding: 12px 26px; background: #0f6b3e; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; margin: 6px 0 14px; }
          .note { background: #f9faf7; border: 1px solid #dfe6df; border-radius: 10px; padding: 14px; margin: 16px 0; font-size: 14px; line-height: 1.6; }
          .footer { padding: 16px 30px; background: #f9faf7; border-radius: 0 0 14px 14px; font-size: 12px; color: #5c6770; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Kenya Veterinary Board</h1>
            <div class="subtitle">Veterinary Inspection Portal &mdash; Password Reset</div>
          </div>
          <div class="body">
            <h2>Reset your password</h2>
            <p>Hello ${safeName},</p>
            <p>We received a request to reset the password for your Inspection Portal account. Use the button below to choose a new password.</p>
            <a class="btn" href="${safeUrl}">Reset my password</a>
            <p>If the button does not work, copy and paste this link into your browser:</p>
            <p><a href="${safeUrl}" style="color:#0f6b3e;word-break:break-all;">${safeUrl}</a></p>
            <div class="note">
              This link expires in <strong>${expiresInMinutes} minutes</strong>. If you did not request a password reset you can safely ignore this email &mdash; your password will not change.
            </div>
          </div>
          <div class="footer">
            Kenya Veterinary Board &mdash; Upholding Veterinary Standards<br>
            P.O. Box 513 - 00605, Uthiru | Tel: +254-722 305 253 | info@kenyavetboard.or.ke
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Kenya Veterinary Board - Veterinary Inspection Portal

Reset your password

Hello ${safeName},

We received a request to reset your Inspection Portal account password.
Open this link to choose a new password:

${safeUrl}

This link expires in ${expiresInMinutes} minutes. If you did not request a reset, ignore this email.
    `,
  };
}

async function sendEmail({ to, emailType, subject, html, text, inspection, attachments, sender }) {
  const transporter = createTransporter();

  let logEntry;
  try {
    logEntry = await EmailLog.create({
      recipient: to,
      emailType,
      inspection,
      status: 'PENDING',
      attempts: 0,
      template: emailType,
    });
  } catch (logError) {
    console.error(`Failed to create email log for ${emailType} to ${to}:`, logError.message);
    // Continue without logging if DB write fails — email sending is the primary operation
  }

  if (!transporter) {
    console.log(`[DEV] Email skipped (SMTP not configured): ${emailType} to ${to}`);

    if (sender) {
      try {
        await createAuditLog({
          user: sender._id || sender,
          role: sender.role,
          action: 'EMAIL_SENT',
          inspection,
          metadata: { emailType, recipient: to, dev: true },
        });
      } catch (auditError) {
        console.error('Audit log creation failed:', auditError.message);
      }
    }

    return { success: true, dev: true, emailLog: logEntry };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
      attachments,
    });

    await logEntry?.updateOne({
      status: 'SENT',
      sentAt: new Date(),
      attempts: 1,
      metadata: { messageId: info.messageId },
    });

    if (sender) {
      await createAuditLog({
        user: sender._id || sender,
        role: sender.role,
        action: 'EMAIL_SENT',
        inspection,
        metadata: { emailType, recipient: to, messageId: info.messageId },
      });
    }

    return { success: true, messageId: info.messageId, emailLog: logEntry };
  } catch (error) {
    console.error(`Email send failed (${emailType} to ${to}):`, error.message);

    await logEntry?.updateOne({
      status: 'FAILED',
      error: error.message,
      attempts: 1,
    });

    if (sender) {
      await createAuditLog({
        user: sender._id || sender,
        role: sender.role,
        action: 'EMAIL_FAILED',
        inspection,
        metadata: { emailType, recipient: to, error: error.message },
      });
    }

    return { success: false, error: error.message, emailLog: logEntry };
  }
}

async function retryEmail(emailLogId, sender) {
  const emailLog = await EmailLog.findById(emailLogId);
  if (!emailLog) {
    throw new Error('Email log not found.');
  }
  if (emailLog.status === 'SENT') {
    throw new Error('Email already sent successfully.');
  }

  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('SMTP is not configured.');
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: emailLog.recipient,
      subject: `KVB Inspection Portal Notification`,
      html: '<p>See inspection portal for details.</p>',
      text: 'See inspection portal for details.',
    });

    await emailLog.updateOne({
      status: 'SENT',
      sentAt: new Date(),
      attempts: emailLog.attempts + 1,
    });

    if (sender) {
      await createAuditLog({
        user: sender._id || sender,
        role: sender.role,
        action: 'EMAIL_SENT',
        metadata: { emailType: emailLog.emailType, recipient: emailLog.recipient, messageId: info.messageId },
      });
    }

    return { success: true };
  } catch (error) {
    await emailLog.updateOne({
      status: 'FAILED',
      error: error.message,
      attempts: emailLog.attempts + 1,
    });
    throw error;
  }
}

module.exports = {
  sendEmail,
  retryEmail,
  buildInternalEmail,
  buildOwnerEmail,
  buildPasswordResetEmail,
  isSmtpConfigured,
};
