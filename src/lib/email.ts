/**
 * Email Service for QUAD Platform
 * Supports: Resend (recommended) or Zoho SMTP
 *
 * Environment Variables:
 * - EMAIL_PROVIDER: 'resend' | 'zoho' (default: 'resend')
 * - RESEND_API_KEY: API key from resend.com
 * - ZOHO_SMTP_USER: quadframework@quadframe.work
 * - ZOHO_SMTP_PASSWORD: App password from Zoho (not regular password)
 */

import nodemailer from 'nodemailer';

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend';
const FROM_EMAIL = process.env.EMAIL_FROM || 'QUAD Platform <quadframework@quadframe.work>';

// Create transporter based on provider
function getTransporter() {
  if (EMAIL_PROVIDER === 'zoho') {
    // Zoho Mail SMTP (Pro accounts use smtppro.zoho.com)
    return nodemailer.createTransport({
      host: 'smtppro.zoho.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.ZOHO_SMTP_USER || 'quadframework@quadframe.work',
        pass: process.env.ZOHO_SMTP_PASSWORD,
      },
    });
  } else {
    // Resend (default) - faster and simpler
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    });
  }
}

/**
 * Send verification code email
 */
export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    const transporter = getTransporter();

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: `${code} is your QUAD verification code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3B82F6, #8B5CF6); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-weight: bold; font-size: 24px;">Q</span>
            </div>
            <h1 style="color: #1F2937; font-size: 24px; margin: 0;">QUAD Platform</h1>
          </div>

          <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
            Use this code to sign in to QUAD Platform:
          </p>

          <div style="background: linear-gradient(135deg, #EFF6FF, #F5F3FF); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1F2937;">
              ${code}
            </span>
          </div>

          <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">
            This code expires in <strong>10 minutes</strong>.
          </p>

          <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">
            If you didn't request this code, you can safely ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;">

          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            QUAD Platform - Enterprise Project Management<br>
            <a href="https://quadframe.work" style="color: #3B82F6; text-decoration: none;">quadframe.work</a>
          </p>
        </div>
      `,
      text: `Your QUAD verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`,
    });

    console.log(`Verification code sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

/**
 * Generate 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
