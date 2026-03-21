import nodemailer from 'nodemailer';
import { config } from '@config/index';
import { logger } from '@config/logger';

// ─── Transport ─────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  auth: config.email.smtp.auth,
  secure: config.email.smtp.port === 465,
});

transporter.verify().catch((err) =>
  logger.warn({ err }, 'Email transporter not ready — emails will fail'),
);

// ─── Send ──────────────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await transporter.sendMail({ from: config.email.from, to, subject, html });
  logger.info({ to, subject }, 'Email sent');
}

// ─── Templates ─────────────────────────────────────────────────────────────────
function baseTemplate(content: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <body style="font-family: Arial, sans-serif; background: #f6f6f6; padding: 32px;">
    <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px;">
      <h2 style="color: #333;">${config.appName}</h2>
      ${content}
      <p style="color: #999; font-size: 12px; margin-top: 32px;">
        If you did not request this, please ignore this email.
      </p>
    </div>
  </body>
  </html>`;
}

// ─── Public Methods ────────────────────────────────────────────────────────────
export const emailService = {
  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const link = `${config.security.corsOrigin}/verify-email?token=${token}`;
    await sendEmail(
      to,
      'Verify your email',
      baseTemplate(`
        <p>Hi <strong>${name}</strong>,</p>
        <p>Click the button below to verify your email address:</p>
        <a href="${link}" style="display:inline-block;background:#4F46E5;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;">Verify Email</a>
        <p style="color:#666;font-size:13px;margin-top:16px;">This link expires in ${config.jwt.verifyEmailExpirationMinutes} minutes.</p>
      `),
    );
  },

  async sendResetPasswordEmail(to: string, name: string, token: string): Promise<void> {
    const link = `${config.security.corsOrigin}/reset-password?token=${token}`;
    await sendEmail(
      to,
      'Reset your password',
      baseTemplate(`
        <p>Hi <strong>${name}</strong>,</p>
        <p>Click the button below to reset your password:</p>
        <a href="${link}" style="display:inline-block;background:#DC2626;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;">Reset Password</a>
        <p style="color:#666;font-size:13px;margin-top:16px;">This link expires in ${config.jwt.resetPasswordExpirationMinutes} minutes.</p>
      `),
    );
  },
};
