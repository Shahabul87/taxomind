/**
 * Common form and UI types used throughout the application
 */

import { ReactNode, HTMLAttributes, FormEvent, ChangeEvent } from 'react';

/**
 * Form field value types
 */
export type FormFieldValue = string | number | boolean | Date | File | File[] | null | undefined;

/**
 * Form data with typed fields
 */
export interface FormData {
  [key: string]: FormFieldValue | FormFieldValue[] | FormData | FormData[];
}

/**
 * Form field configuration
 */
export interface FormField<T = FormFieldValue> {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'file';
  value?: T;
  defaultValue?: T;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number;
  pattern?: string;
  options?: Array<{ value: string | number; label: string; disabled?: boolean }>;
  multiple?: boolean;
  validation?: FormFieldValidation;
}

/**
 * Form field validation rules
 */
export interface FormFieldValidation {
  required?: boolean | { value: boolean; message: string };
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  validate?: (value: FormFieldValue) => boolean | string | Promise<boolean | string>;
}

/**
 * Form errors
 */
export interface FormErrors {
  [fieldName: string]: string | string[] | FormErrors;
}

/**
 * Form state
 */
export interface FormState<T = FormData> {
  data: T;
  errors: FormErrors;
  isSubmitting: boolean;
  isValidating: boolean;
  isDirty: boolean;
  isValid: boolean;
  touchedFields: Set<string>;
  dirtyFields: Set<string>;
}

/**
 * Form submission result
 */
export interface FormSubmissionResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: FormErrors;
  message?: string;
}

/**
 * Event handlers for forms
 */
export interface FormEventHandlers {
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (event: FocusEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onReset?: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Select/Dropdown option
 */
export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
  icon?: ReactNode;
  description?: string;
}

/**
 * Table column definition
 */
export interface TableColumn<T = unknown> {
  key: string;
  header: string | ReactNode;
  accessor?: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T, index: number) => ReactNode;
}

/**
 * Pagination state
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Sort state
 */
export interface SortState {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Filter state
 */
export interface FilterState {
  [field: string]: string | number | boolean | Date | string[] | number[];
}

/**
 * Modal/Dialog props
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title?: string | ReactNode;
  description?: string | ReactNode;
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}

/**
 * Toast/Notification types
 */
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Tab item configuration
 */
export interface TabItem {
  id: string;
  label: string | ReactNode;
  content: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  badge?: string | number;
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  current?: boolean;
}

/**
 * Menu/Navigation item
 */
export interface MenuItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
  children?: MenuItem[];
  divider?: boolean;
}

/**
 * Component size variants
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Component color variants
 */
export type ComponentColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

/**
 * Base component props with common HTML attributes
 */
export interface BaseComponentProps extends HTMLAttributes<HTMLElement> {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}

/**
 * Input change event with typed value
 */
export interface TypedChangeEvent<T = string> extends Omit<ChangeEvent<HTMLInputElement>, 'target'> {
  target: ChangeEvent<HTMLInputElement>['target'] & { value: T };
}