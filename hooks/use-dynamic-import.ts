"use client";

import { useState, useEffect, useCallback } from 'react';

interface DynamicImportState<T> {
  component: T | null;
  loading: boolean;
  error: Error | null;
}

export function useDynamicImport<T = any>(
  importFn: () => Promise<{ default: T }>,
  options: {
    preload?: boolean;
    onError?: (error: Error) => void;
  } = {}
) {
  const [state, setState] = useState<DynamicImportState<T>>({
    component: null,
    loading: false,
    error: null,
  });

  const loadComponent = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const importedModule = await importFn();
      setState({
        component: importedModule.default,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error('Import failed');
      setState({
        component: null,
        loading: false,
        error: err,
      });
      options.onError?.(err);
    }
  }, [importFn, options]);

  const preload = useCallback(() => {
    if (!state.component && !state.loading) {
      loadComponent();
    }
  }, [loadComponent, state.component, state.loading]);

  useEffect(() => {
    if (options.preload) {
      preload();
    }
  }, [options, preload]);

  return {
    ...state,
    load: loadComponent,
    preload,
  };
}

// Hook for conditional imports
export function useConditionalImport<T = any>(
  condition: boolean,
  importFn: () => Promise<{ default: T }>,
  options: {
    onError?: (error: Error) => void;
  } = {}
) {
  const [state, setState] = useState<DynamicImportState<T>>({
    component: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!condition) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    importFn()
      .then(module => {
        setState({
          component: module.default,
          loading: false,
          error: null,
        });
      })
      .catch(error => {
        const err = error instanceof Error ? error : new Error('Import failed');
        setState({
          component: null,
          loading: false,
          error: err,
        });
        options.onError?.(err);
      });
  }, [condition, importFn, options]);

  return state;
}

// Hook for progressive loading
export function useProgressiveImport<T extends Record<string, any>>(
  imports: Array<{
    key: keyof T;
    importFn: () => Promise<{ default: any }>;
    priority?: number;
  }>,
  options: {
    onProgress?: (loaded: number, total: number) => void;
    onError?: (key: keyof T, error: Error) => void;
  } = {}
) {
  const [components, setComponents] = useState<Partial<T>>({});
  const [loading, setLoading] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [errors, setErrors] = useState<Record<keyof T, Error | null>>({} as Record<keyof T, Error | null>);

  const loadComponent = useCallback(async (
    key: keyof T,
    importFn: () => Promise<{ default: any }>
  ) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: null }));

    try {
      const importedModule = await importFn();
      setComponents(prev => ({ ...prev, [key]: importedModule.default }));
      setLoading(prev => ({ ...prev, [key]: false }));
      
      const loadedCount = Object.keys(components).length + 1;
      options.onProgress?.(loadedCount, imports.length);
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error('Import failed');
      setErrors(prev => ({ ...prev, [key]: err }));
      setLoading(prev => ({ ...prev, [key]: false }));
      options.onError?.(key, err);
    }
  }, [components, imports.length, options]);

  const loadAll = useCallback(async () => {
    // Sort by priority (higher priority first)
    const sortedImports = imports.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    // Load components in order
    for (const { key, importFn } of sortedImports) {
      await loadComponent(key, importFn);
    }
  }, [imports, loadComponent]);

  const loadParallel = useCallback(async () => {
    await Promise.all(
      imports.map(({ key, importFn }) => loadComponent(key, importFn))
    );
  }, [imports, loadComponent]);

  return {
    components,
    loading,
    errors,
    loadAll,
    loadParallel,
    loadComponent,
  };
}