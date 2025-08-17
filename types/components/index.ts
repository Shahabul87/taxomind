/**
 * Component Types
 * Type definitions for React components and props
 */

import { ReactNode, CSSProperties, MouseEvent, ChangeEvent, FormEvent } from 'react';
import { CourseWithRelations, UserWithRelations } from '../models';

/**
 * Base Component Props
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
  id?: string;
  'data-testid'?: string;
}

/**
 * Form Field Props
 */
export interface FormFieldProps extends BaseComponentProps {
  label?: string;
  name: string;
  value?: string | number | boolean;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

/**
 * Button Props
 */
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

/**
 * Modal Props
 */
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
}

/**
 * Card Props
 */
export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  hoverable?: boolean;
}

/**
 * Table Props
 */
export interface TableColumn<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
}

/**
 * Course Card Props
 */
export interface CourseCardProps extends BaseComponentProps {
  course: CourseWithRelations;
  showProgress?: boolean;
  showPrice?: boolean;
  showInstructor?: boolean;
  showRating?: boolean;
  onEnroll?: (courseId: string) => void;
  onViewDetails?: (courseId: string) => void;
  variant?: 'grid' | 'list';
}

/**
 * User Avatar Props
 */
export interface UserAvatarProps extends BaseComponentProps {
  user?: UserWithRelations | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showRole?: boolean;
  onClick?: () => void;
}

/**
 * Form Props
 */
export interface FormProps<T = Record<string, unknown>> extends BaseComponentProps {
  onSubmit: (data: T) => void | Promise<void>;
  onCancel?: () => void;
  initialValues?: Partial<T>;
  validation?: Record<keyof T, (value: unknown) => string | undefined>;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
}

/**
 * Alert Props
 */
export interface AlertProps extends BaseComponentProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  closable?: boolean;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Tab Props
 */
export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface TabsProps extends BaseComponentProps {
  tabs: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Dropdown Props
 */
export interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownProps extends BaseComponentProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right' | 'center';
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Progress Bar Props
 */
export interface ProgressBarProps extends BaseComponentProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

/**
 * Toast Props
 */
export interface ToastProps {
  id?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Loading Props
 */
export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

/**
 * Empty State Props
 */
export interface EmptyStateProps extends BaseComponentProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Pagination Props
 */
export interface PaginationProps extends BaseComponentProps {
  currentPage: number;
  totalPages: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSize?: boolean;
  showTotal?: boolean;
  maxPages?: number;
}

/**
 * Search Input Props
 */
export interface SearchInputProps extends BaseComponentProps {
  value?: string;
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  debounce?: number;
  loading?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}