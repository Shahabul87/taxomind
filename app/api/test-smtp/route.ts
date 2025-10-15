/**
 * SMTP Connection Test API
 * Use this endpoint to verify SMTP configuration in production
 * Access: GET /api/test-smtp
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySmtpConnection, isSmtpConfigured, sendEmail } from '@/lib/email/smtp-service';

export async function GET(request: NextRequest) {
  try {
    // Check if SMTP is configured
    const configured = isSmtpConfigured();

    if (!configured) {
      return NextResponse.json({
        success: false,
        error: 'SMTP not configured',
        details: {
          message: 'Missing SMTP_USER or SMTP_PASSWORD environment variables',
          envVars: {
            SMTP_HOST: process.env.SMTP_HOST || 'not set',
            SMTP_PORT: process.env.SMTP_PORT || 'not set',
            SMTP_USER: process.env.SMTP_USER ? '***' + process.env.SMTP_USER.slice(-10) : 'not set',
            SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '***' : 'not set',
            SMTP_FROM: process.env.SMTP_FROM || 'not set',
          }
        }
      }, { status: 500 });
    }

    // Verify SMTP connection
    console.log('[SMTP Test] Verifying SMTP connection...');
    const verified = await verifySmtpConnection();

    if (!verified) {
      return NextResponse.json({
        success: false,
        error: 'SMTP connection failed',
        details: {
          message: 'Could not connect to SMTP server',
          config: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE,
            user: process.env.SMTP_USER ? '***' + process.env.SMTP_USER.slice(-10) : 'not set',
          }
        }
      }, { status: 500 });
    }

    // Optional: Send test email (commented out for safety)
    // Uncomment and provide test email to actually send a test
    const sendTest = request.nextUrl.searchParams.get('send');
    const testEmail = request.nextUrl.searchParams.get('to');

    let testResult = null;
    if (sendTest === 'true' && testEmail) {
      console.log('[SMTP Test] Sending test email to:', testEmail);
      const sent = await sendEmail({
        to: testEmail,
        subject: 'SMTP Test - Taxomind',
        html: `
          <h1>SMTP Test Successful</h1>
          <p>Your SMTP configuration is working correctly!</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>Environment: ${process.env.NODE_ENV}</p>
        `,
      });

      testResult = {
        sent,
        to: testEmail,
        message: sent ? 'Test email sent successfully' : 'Test email failed to send'
      };
    }

    return NextResponse.json({
      success: true,
      message: 'SMTP connection verified successfully',
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER ? '***' + process.env.SMTP_USER.slice(-10) : 'not set',
        from: process.env.SMTP_FROM,
      },
      testResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[SMTP Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'SMTP test failed',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      }
    }, { status: 500 });
  }
}
