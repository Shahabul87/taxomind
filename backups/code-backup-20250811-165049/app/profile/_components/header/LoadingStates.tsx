"use client";

import { Button } from "@/components/ui/button";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="w-full h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="w-full h-64 flex items-center justify-center flex-col gap-4">
      <p className="text-red-500 text-lg">{message}</p>
      {onRetry && (
        <Button 
          onClick={onRetry}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

interface AuthErrorStateProps {
  message: string;
}

export function AuthErrorState({ message }: AuthErrorStateProps) {
  return (
    <div className="w-full h-64 flex items-center justify-center flex-col gap-4">
      <p className="text-red-500 text-lg">{message}</p>
      <Button 
        onClick={() => window.location.href = '/auth/login'}
        className="bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        Go to Login
      </Button>
    </div>
  );
} 