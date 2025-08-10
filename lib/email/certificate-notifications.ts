import { Resend } from "resend";
import { logger } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface CertificateEmailData {
  recipientName: string;
  courseName: string;
  certificateUrl: string;
  verificationCode: string;
  instructorName?: string;
  organizationName?: string;
}

export interface BadgeEmailData {
  recipientName: string;
  badgeName: string;
  badgeDescription: string;
  verificationCode: string;
  badgeImageUrl?: string;
  organizationName?: string;
}

export async function sendCertificateEmail(
  recipientEmail: string,
  data: CertificateEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@alamlms.com',
      to: recipientEmail,
      subject: `🎓 Your Certificate for ${data.courseName}`,
      html: generateCertificateEmailHTML(data),
    });

    return { success: true };
  } catch (error) {
    logger.error('Certificate email error:', error);
    return { 
      success: false, 
      error: 'Failed to send certificate email' 
    };
  }
}

export async function sendBadgeEmail(
  recipientEmail: string,
  data: BadgeEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@alamlms.com',
      to: recipientEmail,
      subject: `🏆 You've Earned a New Badge: ${data.badgeName}`,
      html: generateBadgeEmailHTML(data),
    });

    return { success: true };
  } catch (error) {
    logger.error('Badge email error:', error);
    return { 
      success: false, 
      error: 'Failed to send badge email' 
    };
  }
}

function generateCertificateEmailHTML(data: CertificateEmailData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/verify/${data.verificationCode}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificate Earned</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          border-radius: 12px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content {
          background: #f8fafc;
          padding: 30px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .certificate-info {
          background: white;
          padding: 25px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #3b82f6;
        }
        .button {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 10px 5px;
          transition: background 0.2s;
        }
        .button:hover {
          background: #2563eb;
        }
        .button.secondary {
          background: #6b7280;
        }
        .button.secondary:hover {
          background: #4b5563;
        }
        .verification-code {
          font-family: monospace;
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          background: #f3f4f6;
          padding: 8px 12px;
          border-radius: 4px;
          display: inline-block;
          margin: 10px 0;
        }
        .footer {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .social-share {
          margin: 20px 0;
          text-align: center;
        }
        .social-share a {
          display: inline-block;
          margin: 0 10px;
          color: #6b7280;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎓 Certificate Earned!</h1>
        <p>Congratulations on your achievement</p>
      </div>

      <div class="content">
        <h2>Hello ${data.recipientName},</h2>
        
        <p>Congratulations! You have successfully completed the course and earned your certificate.</p>

        <div class="certificate-info">
          <h3>Certificate Details:</h3>
          <p><strong>Course:</strong> ${data.courseName}</p>
          ${data.instructorName ? `<p><strong>Instructor:</strong> ${data.instructorName}</p>` : ''}
          <p><strong>Issued:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Verification Code:</strong></p>
          <div class="verification-code">${data.verificationCode}</div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.certificateUrl}" class="button" download>
            📥 Download Certificate
          </a>
          <a href="${verificationUrl}" class="button secondary">
            🔍 Verify Certificate
          </a>
        </div>

        <div class="social-share">
          <p><strong>Share your achievement:</strong></p>
          <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}" target="_blank">
            📘 Share on LinkedIn
          </a>
          <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just completed ${data.courseName} and earned my certificate! 🎓`)}&url=${encodeURIComponent(verificationUrl)}" target="_blank">
            🐦 Share on Twitter
          </a>
        </div>

        <p>Your certificate is digitally signed and can be verified using the verification code above. You can also use the QR code on your certificate for quick verification.</p>

        <p>Keep learning and achieving your goals!</p>
      </div>

      <div class="footer">
        <p>© ${new Date().getFullYear()} ${data.organizationName || 'Alam LMS'}. All rights reserved.</p>
        <p>This certificate is issued digitally and verified through our secure verification system.</p>
      </div>
    </body>
    </html>
  `;
}

function generateBadgeEmailHTML(data: BadgeEmailData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/verify/${data.verificationCode}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Badge Earned</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 40px 20px;
          border-radius: 12px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .content {
          background: #f8fafc;
          padding: 30px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .badge-info {
          background: white;
          padding: 25px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #f59e0b;
          text-align: center;
        }
        .badge-image {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          margin: 20px auto;
          display: block;
          border: 3px solid #f59e0b;
        }
        .badge-placeholder {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          margin: 20px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: white;
          font-size: 48px;
          font-weight: bold;
        }
        .button {
          display: inline-block;
          background: #f59e0b;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 10px 5px;
          transition: background 0.2s;
        }
        .button:hover {
          background: #d97706;
        }
        .verification-code {
          font-family: monospace;
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          background: #f3f4f6;
          padding: 8px 12px;
          border-radius: 4px;
          display: inline-block;
          margin: 10px 0;
        }
        .footer {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .social-share {
          margin: 20px 0;
          text-align: center;
        }
        .social-share a {
          display: inline-block;
          margin: 0 10px;
          color: #6b7280;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏆 Badge Earned!</h1>
        <p>You've unlocked a new achievement</p>
      </div>

      <div class="content">
        <h2>Hello ${data.recipientName},</h2>
        
        <p>Congratulations! You've earned a new badge for your learning achievements.</p>

        <div class="badge-info">
          ${data.badgeImageUrl 
            ? `<img src="${data.badgeImageUrl}" alt="${data.badgeName}" class="badge-image" />`
            : `<div class="badge-placeholder">🏆</div>`
          }
          <h3>${data.badgeName}</h3>
          <p>${data.badgeDescription}</p>
          <p><strong>Earned:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Verification Code:</strong></p>
          <div class="verification-code">${data.verificationCode}</div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" class="button">
            🔍 Verify Badge
          </a>
        </div>

        <div class="social-share">
          <p><strong>Share your achievement:</strong></p>
          <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}" target="_blank">
            📘 Share on LinkedIn
          </a>
          <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just earned the "${data.badgeName}" badge! 🏆`)}&url=${encodeURIComponent(verificationUrl)}" target="_blank">
            🐦 Share on Twitter
          </a>
        </div>

        <p>Your badge is digitally verified and can be authenticated using the verification code above. Keep up the great work!</p>

        <p>Continue learning to unlock more badges and achievements!</p>
      </div>

      <div class="footer">
        <p>© ${new Date().getFullYear()} ${data.organizationName || 'Alam LMS'}. All rights reserved.</p>
        <p>This badge is issued digitally and verified through our secure verification system.</p>
      </div>
    </body>
    </html>
  `;
}

export async function sendBulkCertificateNotifications(
  recipients: Array<{
    email: string;
    data: CertificateEmailData;
  }>
): Promise<{ success: boolean; results: any[] }> {
  const results = await Promise.allSettled(
    recipients.map(({ email, data }) => 
      sendCertificateEmail(email, data)
    )
  );

  const success = results.every(result => 
    result.status === 'fulfilled' && result.value.success
  );

  return {
    success,
    results: results.map((result, index) => ({
      email: recipients[index].email,
      success: result.status === 'fulfilled' && result.value.success,
      error: result.status === 'rejected' ? result.reason : 
             (result.status === 'fulfilled' ? result.value.error : null)
    }))
  };
}

export async function sendBulkBadgeNotifications(
  recipients: Array<{
    email: string;
    data: BadgeEmailData;
  }>
): Promise<{ success: boolean; results: any[] }> {
  const results = await Promise.allSettled(
    recipients.map(({ email, data }) => 
      sendBadgeEmail(email, data)
    )
  );

  const success = results.every(result => 
    result.status === 'fulfilled' && result.value.success
  );

  return {
    success,
    results: results.map((result, index) => ({
      email: recipients[index].email,
      success: result.status === 'fulfilled' && result.value.success,
      error: result.status === 'rejected' ? result.reason : 
             (result.status === 'fulfilled' ? result.value.error : null)
    }))
  };
}