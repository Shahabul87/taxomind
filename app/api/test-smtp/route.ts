/**
 * Email Service Test API
 * Tests both Resend HTTP API and SMTP fallback
 * Use this endpoint to verify email configuration in production
 * Access: GET /api/test-smtp
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySmtpConnection, isSmtpConfigured, sendEmail as sendEmailSMTP } from '@/lib/email/smtp-service';
import { verifyResendConnection, isResendConfigured, sendEmail as sendEmailResend } from '@/lib/email/resend-service';

export async function GET(request: NextRequest) {
  try {
    // Check Resend HTTP API (preferred method)
    const resendConfigured = isResendConfigured();
    const smtpConfigured = isSmtpConfigured();

    console.log('[Email Test] Checking configuration:', {
      resendConfigured,
      smtpConfigured,
      env: process.env.NODE_ENV,
    });

    if (!resendConfigured && !smtpConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Email service not configured',
        details: {
          message: 'Neither Resend API nor SMTP is configured',
          envVars: {
            RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Set (***' + process.env.RESEND_API_KEY.slice(-8) + ')' : 'Not set',
            SMTP_HOST: process.env.SMTP_HOST || 'not set',
            SMTP_PORT: process.env.SMTP_PORT || 'not set',
            SMTP_USER: process.env.SMTP_USER || 'not set',
            EMAIL_FROM: process.env.EMAIL_FROM || 'not set',
          }
        }
      }, { status: 500 });
    }

    // Try Resend HTTP API first (preferred)
    if (resendConfigured) {
      console.log('[Email Test] Testing Resend HTTP API...');
      const resendVerified = await verifyResendConnection();

      const sendTest = request.nextUrl.searchParams.get('send');
      const testEmail = request.nextUrl.searchParams.get('to');
      let testResult = null;

      if (sendTest === 'true' && testEmail) {
        console.log('[Email Test] Sending test email via Resend to:', testEmail);
        const sent = await sendEmailResend({
          to: testEmail,
          subject: 'Resend API Test - Taxomind',
          html: `
            <h1>Resend API Test Successful</h1>
            <p>Your Resend HTTP API configuration is working correctly!</p>
            <p>Method: Resend HTTP API (Recommended)</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
            <p>Environment: ${process.env.NODE_ENV}</p>
          `,
        });

        testResult = {
          sent,
          to: testEmail,
          method: 'resend_http_api',
          message: sent ? 'Test email sent successfully via Resend HTTP API' : 'Test email failed to send'
        };
      }

      return NextResponse.json({
        success: resendVerified,
        message: resendVerified ? 'Resend HTTP API verified successfully' : 'Resend API verification failed',
        method: 'resend_http_api',
        config: {
          apiKey: process.env.RESEND_API_KEY ? 'Set (***' + process.env.RESEND_API_KEY.slice(-8) + ')' : 'Not set',
          from: process.env.EMAIL_FROM,
        },
        testResult,
        timestamp: new Date().toISOString(),
      });
    }

    // Fallback to SMTP if Resend not configured
    console.log('[Email Test] Testing SMTP (fallback)...');
    const smtpVerified = await verifySmtpConnection();

    if (!smtpVerified) {
      return NextResponse.json({
        success: false,
        error: 'SMTP connection failed',
        details: {
          message: 'Could not connect to SMTP server',
          config: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE,
            user: process.env.SMTP_USER,
          }
        }
      }, { status: 500 });
    }

    const sendTest = request.nextUrl.searchParams.get('send');
    const testEmail = request.nextUrl.searchParams.get('to');
    let testResult = null;

    if (sendTest === 'true' && testEmail) {
      console.log('[Email Test] Sending test email via SMTP to:', testEmail);
      const sent = await sendEmailSMTP({
        to: testEmail,
        subject: 'SMTP Test - Taxomind',
        html: `
          <h1>SMTP Test Successful</h1>
          <p>Your SMTP configuration is working correctly!</p>
          <p>Method: SMTP</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>Environment: ${process.env.NODE_ENV}</p>
        `,
      });

      testResult = {
        sent,
        to: testEmail,
        method: 'smtp',
        message: sent ? 'Test email sent successfully via SMTP' : 'Test email failed to send'
      };
    }

    return NextResponse.json({
      success: true,
      message: 'SMTP connection verified successfully',
      method: 'smtp',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM,
      },
      testResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Email Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Email test failed',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      }
    }, { status: 500 });
  }
}
