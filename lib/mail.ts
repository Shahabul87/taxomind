import { Resend } from "resend";

// Initialize Resend with better error handling
let resend: Resend | null = null;

try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  } else {
    console.warn('RESEND_API_KEY not found. Email functionality will be disabled.');
  }
} catch (error) {
  console.error('Failed to initialize Resend:', error);
}

// Helper function to get the appropriate domain
const getDomain = () => {
  // Check for explicit URL environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Check for Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Check for production environment
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    return 'https://taxomind.com';
  }
  
  // Default to localhost for development
  return 'http://localhost:3000';
};

const domain = getDomain();

// Helper function to check if email is configured
const isEmailConfigured = () => {
  return resend !== null && process.env.RESEND_API_KEY;
};

export const sendTwoFactorTokenEmail = async (
  email: string,
  token: string
) => {
  // Check if email is configured
  if (!isEmailConfigured()) {
    console.warn('Email not configured. 2FA token would be:', token);
    return;
  }

  try {
    const { data, error } = await resend!.emails.send({
      from: "noreply@taxomind.com",
      to: email,
      subject: "2FA Code for Login",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2; margin-bottom: 20px;">Your Two-Factor Authentication Code</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">Your verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${token}
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            This code will expire in 5 minutes. If you didn't request this code, please ignore this email.
          </p>
        </div>
      `
    });

    if (error) {
      console.error("Resend API Error:", error);
      return;
    }

    return data;
  } catch (error) {
    console.error("Detailed error:", error);
    return null;
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
) => {
  const resetLink = `${domain}/auth/new-password?token=${token}`;
  
  // Check if email is configured
  if (!isEmailConfigured()) {
    console.warn('Email not configured. Reset link would be:', resetLink);
    console.warn('In development, you can manually visit this URL to reset password.');
    return;
  }
  
  try {
    const { data, error } = await resend!.emails.send({
      from: "noreply@taxomind.com",
      to: email,
      subject: "Reset Your Taxomind Password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - Taxomind</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                🔐 Taxomind
              </h1>
              <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                Password Reset Request
              </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                Reset Your Password 🔑
              </h2>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                We received a request to reset the password for your <strong>Taxomind</strong> account. Don't worry, it happens to the best of us!
              </p>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Click the button below to create a new password:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" 
                   style="display: inline-block; 
                          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                          color: #ffffff; 
                          padding: 16px 32px; 
                          border-radius: 8px; 
                          text-decoration: none; 
                          font-weight: 600; 
                          font-size: 16px;
                          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
                          transition: all 0.3s ease;">
                  🔐 Reset My Password
                </a>
              </div>
              
              <!-- Alternative Link -->
              <div style="margin: 24px 0; padding: 16px; background-color: #f1f5f9; border-radius: 8px; border-left: 4px solid #dc2626;">
                <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                  <strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>
                  <a href="${resetLink}" style="color: #dc2626; word-break: break-all;">${resetLink}</a>
                </p>
              </div>
              
              <!-- Security Notes -->
              <div style="margin-top: 32px; padding: 16px; background-color: #fef3cd; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; font-size: 14px; margin: 0 0 12px 0; line-height: 1.5;">
                  <strong>⏰ Time Sensitive:</strong> This reset link expires in 1 hour for your security.
                </p>
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                  <strong>🛡️ Security:</strong> If you didn't request this reset, please ignore this email or contact our support team.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center; line-height: 1.5;">
                © 2025 Taxomind. Empowering minds through intelligent learning.<br>
                <a href="https://taxomind.com" style="color: #667eea; text-decoration: none;">taxomind.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error("Resend API Error:", error);
      throw new Error(`Failed to send reset email: ${error.message}`);
    }

    console.log('Password reset email sent successfully:', data);
    return data;
  } catch (error) {
    console.error("Reset email error:", error);
    throw error;
  }
};

export const sendVerificationEmail = async (
  email: string, 
  token: string
) => {
  const confirmLink = `${domain}/auth/new-verification?token=${token}`;

  // Check if email is configured
  if (!isEmailConfigured()) {
    console.warn('Email not configured. Verification link would be:', confirmLink);
    console.warn('In development, you can manually visit this URL to verify email.');
    return;
  }

  try {
    const { data, error } = await resend!.emails.send({
      from: "noreply@taxomind.com",
      to: email,
      subject: "Welcome to Taxomind - Verify Your Email",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Taxomind</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                🧠 Taxomind
              </h1>
              <p style="color: #e2e8f0; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                Intelligent Learning Platform
              </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                Welcome aboard! 🚀
              </h2>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you for joining <strong>Taxomind</strong>, where AI meets personalized learning. You're just one step away from unlocking your cognitive potential.
              </p>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Please verify your email address to start your intelligent learning journey:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${confirmLink}" 
                   style="display: inline-block; 
                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: #ffffff; 
                          padding: 16px 32px; 
                          border-radius: 8px; 
                          text-decoration: none; 
                          font-weight: 600; 
                          font-size: 16px;
                          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                          transition: all 0.3s ease;">
                  ✉️ Verify Email Address
                </a>
              </div>
              
              <!-- Alternative Link -->
              <div style="margin: 24px 0; padding: 16px; background-color: #f1f5f9; border-radius: 8px; border-left: 4px solid #667eea;">
                <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">
                  <strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>
                  <a href="${confirmLink}" style="color: #667eea; word-break: break-all;">${confirmLink}</a>
                </p>
              </div>
              
              <!-- Security Note -->
              <div style="margin-top: 32px; padding: 16px; background-color: #fef3cd; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                  <strong>🔒 Security Notice:</strong> This verification link expires in 1 hour. If you didn't create a Taxomind account, please ignore this email.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center; line-height: 1.5;">
                © 2025 Taxomind. Empowering minds through intelligent learning.<br>
                <a href="https://taxomind.com" style="color: #667eea; text-decoration: none;">taxomind.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error("Resend API Error:", error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }

    console.log('Verification email sent successfully:', data);
    return data;
  } catch (error) {
    console.error("Verification email error:", error);
    throw error;
  }
};