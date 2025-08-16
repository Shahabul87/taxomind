import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    // Test different types of server errors
    const testType = Math.random() > 0.5 ? 'error' : 'exception';

    if (testType === 'error') {
      // Captured error
      const error = new Error('Test Server Error - This is a test error from the API route');
      Sentry.captureException(error);
      
      return NextResponse.json(
        { 
          error: 'Server error captured and sent to Sentry',
          message: 'Check your Sentry dashboard for the server error' 
        },
        { status: 500 }
      );
    } else {
      // Uncaught exception
      throw new Error('Test Uncaught Server Error - This will be caught by Sentry');
    }
  } catch (error) {
    // This will be automatically captured by Sentry
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Log custom server event with context
    Sentry.withScope((scope) => {
      scope.setTag('api-route', 'sentry-test');
      scope.setContext('request-body', body);
      scope.setLevel('info');
      Sentry.captureMessage('Test POST request to Sentry API route');
    });

    return NextResponse.json({
      success: true,
      message: 'Server event logged to Sentry',
      receivedData: body
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}