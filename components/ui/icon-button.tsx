"use client"

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'md' | 'lg' | 'xl' | 'full';
  notification?: number | boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({
    className,
    variant = 'subtle',
    size = 'md',
    rounded = 'lg',
    notification,
    children,
    ...props
  }, ref) => {
    const sizeClasses = {
      sm: 'min-w-[36px] min-h-[36px] xs:min-w-[40px] xs:min-h-[40px] p-2',
      md: 'min-w-[40px] min-h-[40px] xs:min-w-[44px] xs:min-h-[44px] p-2.5',
      lg: 'min-w-[44px] min-h-[44px] xs:min-w-[48px] xs:min-h-[48px] p-3'
    };

    const variantClasses = {
      default: 'bg-white/70 dark:bg-slate-800/80 hover:bg-white/90 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent text-slate-700 dark:text-gray-300',
      ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-gray-300',
      subtle: 'bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/50 text-slate-700 dark:text-gray-300'
    };

    const roundedClasses = {
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative flex items-center justify-center transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
          sizeClasses[size],
          variantClasses[variant],
          roundedClasses[rounded],
          className
        )}
        {...props}
      >
        {children}
        {notification !== undefined && notification !== false && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {typeof notification === 'number' ? notification : ''}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';