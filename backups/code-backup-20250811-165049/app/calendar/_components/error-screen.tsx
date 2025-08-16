"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, XCircle, RefreshCcw, AlertTriangle } from "lucide-react";

interface ErrorScreenProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorScreen = ({
  message = "Failed to load calendar events",
  onRetry,
}: ErrorScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="bg-red-50 border border-red-100 rounded-lg p-8 max-w-md">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-700 mb-2">Calendar Error</h2>
        
        <p className="text-gray-700 mb-6">{message}</p>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded border border-gray-200">
            <h3 className="font-medium flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Troubleshooting Steps
            </h3>
            <ul className="text-sm text-left space-y-2">
              <li>• Check your internet connection</li>
              <li>• Make sure you&apos;re signed in</li>
              <li>• Try refreshing the page</li>
              <li>• Clear your browser cache</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Try Again
              </Button>
            )}
            
            <Link href="/calendar/debug" passHref>
              <Button
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Run Diagnostics
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}; 