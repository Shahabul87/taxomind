"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  required?: boolean;
  tooltip?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormFieldWrapper({
  label,
  required,
  tooltip,
  error,
  children,
  className
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-full"
                  aria-label="More information"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm p-3 rounded-xl shadow-xl border-0"
              >
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1.5">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  tooltip?: string;
  error?: string;
  showCharCount?: boolean;
  maxChars?: number;
  minChars?: number;
  successMessage?: string;
}

export function EnhancedInput({
  label,
  required,
  tooltip,
  error,
  showCharCount,
  maxChars,
  minChars,
  successMessage,
  value,
  className,
  ...props
}: EnhancedInputProps) {
  const charCount = typeof value === 'string' ? value.length : 0;
  const isValid = minChars ? charCount >= minChars : true;
  const isOverLimit = maxChars ? charCount > maxChars : false;

  return (
    <FormFieldWrapper label={label} required={required} tooltip={tooltip} error={error}>
      <div className="relative">
        <Input
          value={value}
          className={cn(
            "h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700",
            "rounded-xl text-base px-4 shadow-sm",
            "transition-all duration-200",
            "hover:border-indigo-300 dark:hover:border-indigo-600",
            "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
            "placeholder:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500",
            isValid && charCount > 0 && "border-emerald-300 dark:border-emerald-600",
            isOverLimit && "border-red-300 dark:border-red-600",
            error && "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {isValid && charCount > 0 && !error && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
        )}
      </div>
      {(showCharCount || minChars || maxChars) && (
        <div className="flex items-center justify-between mt-1.5">
          {successMessage && isValid && charCount > 0 ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">{successMessage}</span>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {minChars && `Minimum ${minChars} characters`}
            </span>
          )}
          <span className={cn(
            "text-xs font-medium tabular-nums",
            isOverLimit ? "text-red-500" : isValid ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"
          )}>
            {charCount}{maxChars ? `/${maxChars}` : minChars ? `/${minChars}+` : ''}
          </span>
        </div>
      )}
    </FormFieldWrapper>
  );
}

interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  tooltip?: string;
  error?: string;
  showCharCount?: boolean;
  maxChars?: number;
  minChars?: number;
  successMessage?: string;
}

export function EnhancedTextarea({
  label,
  required,
  tooltip,
  error,
  showCharCount,
  maxChars,
  minChars,
  successMessage,
  value,
  className,
  ...props
}: EnhancedTextareaProps) {
  const charCount = typeof value === 'string' ? value.length : 0;
  const isValid = minChars ? charCount >= minChars : true;
  const isOverLimit = maxChars ? charCount > maxChars : false;

  return (
    <FormFieldWrapper label={label} required={required} tooltip={tooltip} error={error}>
      <div className="relative">
        <Textarea
          value={value}
          className={cn(
            "min-h-[140px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700",
            "rounded-xl text-base px-4 py-3 shadow-sm resize-none",
            "transition-all duration-200",
            "hover:border-indigo-300 dark:hover:border-indigo-600",
            "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
            "placeholder:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500",
            isValid && charCount > 0 && "border-emerald-300 dark:border-emerald-600",
            isOverLimit && "border-red-300 dark:border-red-600",
            error && "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {isValid && charCount > 0 && !error && (
          <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-emerald-500" />
        )}
      </div>
      {(showCharCount || minChars || maxChars) && (
        <div className="flex items-center justify-between mt-1.5">
          {successMessage && isValid && charCount > 0 ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">{successMessage}</span>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {minChars && `Minimum ${minChars} characters`}
            </span>
          )}
          <span className={cn(
            "text-xs font-medium tabular-nums",
            isOverLimit ? "text-red-500" : isValid ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"
          )}>
            {charCount}{maxChars ? `/${maxChars}` : minChars ? `/${minChars}+` : ''}
          </span>
        </div>
      )}
    </FormFieldWrapper>
  );
}
