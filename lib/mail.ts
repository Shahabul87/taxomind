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
      subject: "Reset Your Password - MindForge",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2; margin-bottom: 20px;">Reset Your Password</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Click the link below to reset your password:
          </p>
          <a href="${resetLink}" 
             style="display: inline-block; background: linear-gradient(to right, #0891b2, #8b5cf6); 
                    color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; 
                    font-weight: bold;">
            Reset Password
          </a>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            Or copy this URL: ${resetLink}
          </p>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            This link will expire in 1 hour.
          </p>
        </div>
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
      subject: "Verify Your Email - MindForge",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2; margin-bottom: 20px;">Verify Your Email Address</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Thank you for registering with MindForge. Please click the button below to verify your email address:
          </p>
          <a href="${confirmLink}" 
             style="display: inline-block; background: linear-gradient(to right, #0891b2, #8b5cf6); 
                    color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; 
                    font-weight: bold;">
            Verify Email
          </a>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            This link will expire in 1 hour. If you didn't create an account with us, please ignore this email.
          </p>
        </div>
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