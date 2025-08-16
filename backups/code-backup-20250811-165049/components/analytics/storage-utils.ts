// Storage utilities for analytics component
const TAB_STORAGE_KEY = 'analytics-active-tab';
const PERIOD_STORAGE_KEY = 'analytics-selected-period';

export const getStoredTab = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TAB_STORAGE_KEY) || 'overview';
  }
  return 'overview';
};

export const getStoredPeriod = (): 'DAILY' | 'WEEKLY' | 'MONTHLY' => {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem(PERIOD_STORAGE_KEY) as 'DAILY' | 'WEEKLY' | 'MONTHLY') || 'DAILY';
  }
  return 'DAILY';
};

export const storeTab = (tab: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TAB_STORAGE_KEY, tab);
  }
};

export const storePeriod = (period: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PERIOD_STORAGE_KEY, period);
  }
};