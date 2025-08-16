'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Bug, Server, Zap, Activity, Database } from 'lucide-react';

export default function SentryTestPage() {
  const [isLoading, setIsLoading] = useState(false);

  const testClientError = () => {
    throw new Error('Test Client Error - This is a test error from the client side');
  };

  const testCapturedError = () => {
    try {
      throw new Error('Test Captured Error - This error is caught and sent to Sentry');
    } catch (error) {
      Sentry.captureException(error);
      alert('Error captured and sent to Sentry!');
    }
  };

  const testCustomEvent = () => {
    Sentry.captureMessage('Custom event from Sentry test page', 'info');
    alert('Custom event sent to Sentry!');
  };

  const testUserContext = () => {
    Sentry.setUser({
      id: 'test-user-123',
      email: 'test@example.com',
      username: 'testuser',
    });
    Sentry.captureMessage('User context test', 'info');
    alert('User context set and event sent!');
  };

  const testPerformanceTransaction = () => {
    // Performance monitoring with new API
    const startTime = Date.now();
    
    // Simulate some work
    setTimeout(() => {
      const duration = Date.now() - startTime;
      Sentry.captureMessage(`Performance test completed in ${duration}ms`, 'info');
      alert('Performance event sent to Sentry!');
    }, 1000);
  };

  const testServerError = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sentry-test');
      if (!response.ok) {
        throw new Error('Server error test failed');
      }
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error('Server test error:', error);
      alert('Check console and Sentry dashboard for server error');
    } finally {
      setIsLoading(false);
    }
  };

  const testBreadcrumbs = () => {
    Sentry.addBreadcrumb({
      message: 'User clicked test breadcrumb button',
      level: 'info',
      category: 'user-action',
      data: {
        buttonId: 'test-breadcrumb',
        timestamp: new Date().toISOString(),
      },
    });

    Sentry.addBreadcrumb({
      message: 'Performing test action',
      level: 'warning',
      category: 'test',
    });

    Sentry.captureMessage('Event with breadcrumbs', 'info');
    alert('Breadcrumbs added and event sent!');
  };

  const testTags = () => {
    Sentry.withScope((scope) => {
      scope.setTag('test-environment', 'development');
      scope.setTag('feature', 'sentry-test');
      scope.setTag('version', '1.0.0');
      scope.setLevel('warning');
      Sentry.captureMessage('Event with custom tags');
    });
    alert('Event with tags sent to Sentry!');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-6 w-6" />
            Sentry Integration Test Page
          </CardTitle>
          <CardDescription>
            Test various Sentry features to ensure proper integration. Check your Sentry dashboard to see the captured events.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={testClientError}
              variant="destructive"
              className="w-full"
            >
              Trigger Uncaught Client Error
            </Button>
            
            <Button 
              onClick={testCapturedError}
              variant="outline"
              className="w-full"
            >
              Trigger Captured Error
            </Button>

            <Button 
              onClick={testServerError}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              <Server className="mr-2 h-4 w-4" />
              {isLoading ? 'Testing...' : 'Test Server Error'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Event & Context Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={testCustomEvent}
              variant="secondary"
              className="w-full"
            >
              Send Custom Event
            </Button>
            
            <Button 
              onClick={testUserContext}
              variant="secondary"
              className="w-full"
            >
              Set User Context
            </Button>

            <Button 
              onClick={testBreadcrumbs}
              variant="secondary"
              className="w-full"
            >
              Test Breadcrumbs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={testPerformanceTransaction}
              variant="outline"
              className="w-full"
            >
              Test Performance Transaction
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Metadata Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={testTags}
              variant="outline"
              className="w-full"
            >
              Test Custom Tags
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Make sure you have set up your Sentry DSN in the environment variables</li>
            <li>Click any of the test buttons above to trigger different types of events</li>
            <li>Check your Sentry dashboard to see the captured events</li>
            <li>The uncaught error will show the error boundary UI</li>
            <li>Other tests will show alerts when events are sent successfully</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}