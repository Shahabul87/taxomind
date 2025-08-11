"use client";

import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error(`Analytics Error Boundary caught an error: ${error}`, errorInfo);
    
    // Check if it's the specific Next.js headers error
    if (error.message.includes('headers') && error.message.includes('request scope')) {
      logger.warn('Headers called outside request scope - this is expected in client components');
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Analytics Temporarily Unavailable</span>
              </div>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                There was an issue loading the analytics. This is usually temporary.
              </p>
              {this.state.error?.message.includes('headers') && (
                <p className="text-xs text-orange-500 mt-1">
                  Authentication context is being established...
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={this.handleReset}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={this.handleReset}
                >
                  Reset Component
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}