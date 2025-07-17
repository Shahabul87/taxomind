"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

interface FormField {
  name: string;
  type: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
  element: HTMLElement;
  label?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
}

interface DetectedForm {
  id: string;
  element: HTMLFormElement;
  action?: string;
  method?: string;
  submitButton?: HTMLButtonElement;
  fields: FormField[];
  dataForm?: string; // data-form attribute
}

interface PageData {
  title?: string;
  description?: string;
  breadcrumbs: string[];
  forms: DetectedForm[];
  links: string[];
  buttons: Array<{
    text: string;
    action?: string;
    element: HTMLButtonElement;
  }>;
  dataElements: Array<{
    type: string;
    content: string;
    element: HTMLElement;
  }>;
}

interface UniversalSamContextType {
  pageData: PageData;
  refreshPageData: () => void;
  populateForm: (formId: string, data: Record<string, any>) => Promise<boolean>;
  submitForm: (formId: string) => Promise<boolean>;
  executeAction: (action: string, params?: any) => Promise<boolean>;
  getFormData: (formId: string) => Record<string, any>;
  isReady: boolean;
}

const UniversalSamContext = createContext<UniversalSamContextType | undefined>(undefined);

export function UniversalSamProvider({ children }: { children: React.ReactNode }) {
  const [pageData, setPageData] = useState<PageData>({
    title: '',
    description: '',
    breadcrumbs: [],
    forms: [],
    links: [],
    buttons: [],
    dataElements: []
  });
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Universal form detector
  const detectForms = useCallback((): DetectedForm[] => {
    const forms: DetectedForm[] = [];
    const formElements = document.querySelectorAll('form');
    
    formElements.forEach((formElement, index) => {
      const formId = formElement.id || formElement.getAttribute('data-form') || `form-${index}`;
      const fields: FormField[] = [];
      
      // Detect all form fields
      const inputs = formElement.querySelectorAll('input, textarea, select');
      inputs.forEach((input) => {
        const element = input as HTMLElement;
        const name = element.getAttribute('name') || element.getAttribute('id') || `field-${fields.length}`;
        const type = getFieldType(element);
        const label = getFieldLabel(element);
        const placeholder = element.getAttribute('placeholder') || '';
        const required = element.hasAttribute('required');
        const value = getFieldValue(element);
        
        fields.push({
          name,
          type,
          element,
          label,
          placeholder,
          required,
          value
        });
      });
      
      // Find submit button
      const submitButton = formElement.querySelector('button[type="submit"]') as HTMLButtonElement ||
                          formElement.querySelector('input[type="submit"]') as HTMLButtonElement ||
                          formElement.querySelector('button:not([type])') as HTMLButtonElement;
      
      forms.push({
        id: formId,
        element: formElement,
        action: formElement.action,
        method: formElement.method || 'GET',
        submitButton,
        fields,
        dataForm: formElement.getAttribute('data-form') || undefined
      });
    });
    
    return forms;
  }, []);

  // Universal page data analyzer
  const analyzePage = useCallback((): PageData => {
    // Extract page title
    const title = document.querySelector('h1')?.textContent ||
                  document.querySelector('title')?.textContent ||
                  document.querySelector('[data-page-title]')?.textContent ||
                  'Unknown Page';

    // Extract page description
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                       document.querySelector('[data-page-description]')?.textContent ||
                       document.querySelector('p')?.textContent ||
                       '';

    // Extract breadcrumbs
    const breadcrumbs: string[] = [];
    const breadcrumbElements = document.querySelectorAll('[data-breadcrumb], nav a, .breadcrumb a');
    breadcrumbElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text) breadcrumbs.push(text);
    });

    // Add current page to breadcrumbs if not already there
    if (title && !breadcrumbs.includes(title)) {
      breadcrumbs.push(title);
    }

    // Extract links
    const links: string[] = [];
    const linkElements = document.querySelectorAll('a[href]');
    linkElements.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !links.includes(href)) {
        links.push(href);
      }
    });

    // Extract buttons
    const buttons: Array<{text: string, action?: string, element: HTMLButtonElement}> = [];
    const buttonElements = document.querySelectorAll('button:not([type="submit"])');
    buttonElements.forEach(button => {
      const text = button.textContent?.trim() || 'Button';
      const action = button.getAttribute('data-action') || button.getAttribute('onclick') || '';
      buttons.push({
        text,
        action,
        element: button as HTMLButtonElement
      });
    });

    // Extract data elements (tables, lists, cards, etc.)
    const dataElements: Array<{type: string, content: string, element: HTMLElement}> = [];
    
    // Tables
    document.querySelectorAll('table').forEach(table => {
      dataElements.push({
        type: 'table',
        content: extractTableData(table),
        element: table
      });
    });

    // Lists
    document.querySelectorAll('ul, ol').forEach(list => {
      dataElements.push({
        type: 'list',
        content: extractListData(list),
        element: list
      });
    });

    // Cards/containers with data
    document.querySelectorAll('[data-item], .card, [data-card]').forEach(card => {
      dataElements.push({
        type: 'card',
        content: card.textContent?.trim() || '',
        element: card
      });
    });

    return {
      title,
      description,
      breadcrumbs,
      forms: detectForms(),
      links,
      buttons,
      dataElements
    };
  }, [detectForms]);

  // Refresh page data
  const refreshPageData = useCallback(() => {
    const newData = analyzePage();
    setPageData(newData);
    setIsReady(true);
  }, [analyzePage]);

  // Universal form population
  const populateForm = useCallback(async (formId: string, data: Record<string, any>): Promise<boolean> => {
    const form = pageData.forms.find(f => f.id === formId || f.dataForm === formId);
    if (!form) return false;

    try {
      for (const field of form.fields) {
        const value = data[field.name];
        if (value !== undefined) {
          await setFieldValue(field.element, value);
        }
      }
      return true;
    } catch (error) {
      console.error('Error populating form:', error);
      return false;
    }
  }, [pageData.forms]);

  // Universal form submission
  const submitForm = useCallback(async (formId: string): Promise<boolean> => {
    const form = pageData.forms.find(f => f.id === formId || f.dataForm === formId);
    if (!form || !form.submitButton) return false;

    try {
      // Trigger form validation
      const isValid = form.element.checkValidity();
      if (!isValid) {
        form.element.reportValidity();
        return false;
      }

      // Click submit button
      form.submitButton.click();
      return true;
    } catch (error) {
      console.error('Error submitting form:', error);
      return false;
    }
  }, [pageData.forms]);

  // Universal action execution
  const executeAction = useCallback(async (action: string, params?: any): Promise<boolean> => {
    try {
      switch (action) {
        case 'navigate':
          if (params.url) {
            router.push(params.url);
            return true;
          }
          break;
        case 'click':
          if (params.selector) {
            const element = document.querySelector(params.selector) as HTMLElement;
            if (element) {
              element.click();
              return true;
            }
          }
          break;
        case 'refresh':
          router.refresh();
          return true;
        case 'scroll':
          if (params.selector) {
            const element = document.querySelector(params.selector);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
              return true;
            }
          }
          break;
        default:
          console.warn('Unknown action:', action);
      }
      return false;
    } catch (error) {
      console.error('Error executing action:', error);
      return false;
    }
  }, [router]);

  // Get form data
  const getFormData = useCallback((formId: string): Record<string, any> => {
    const form = pageData.forms.find(f => f.id === formId || f.dataForm === formId);
    if (!form) return {};

    const data: Record<string, any> = {};
    form.fields.forEach(field => {
      data[field.name] = getFieldValue(field.element);
    });
    return data;
  }, [pageData.forms]);

  // Auto-refresh page data when route changes
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshPageData();
    }, 1000); // Wait for page to load

    return () => clearTimeout(timer);
  }, [pathname, refreshPageData]);

  // Periodic refresh to catch dynamic content
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPageData();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [refreshPageData]);

  // Make functions available globally for SAM
  useEffect(() => {
    (window as any).universalSamFunctions = {
      populateForm,
      submitForm,
      executeAction,
      getFormData,
      refreshPageData,
      pageData
    };

    return () => {
      delete (window as any).universalSamFunctions;
    };
  }, [populateForm, submitForm, executeAction, getFormData, refreshPageData, pageData]);

  return (
    <UniversalSamContext.Provider value={{
      pageData,
      refreshPageData,
      populateForm,
      submitForm,
      executeAction,
      getFormData,
      isReady
    }}>
      {children}
    </UniversalSamContext.Provider>
  );
}

export function useUniversalSam() {
  const context = useContext(UniversalSamContext);
  if (!context) {
    throw new Error('useUniversalSam must be used within UniversalSamProvider');
  }
  return context;
}

// Helper functions
function getFieldType(element: HTMLElement): FormField['type'] {
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'textarea') return 'textarea';
  if (tagName === 'select') return 'select';
  if (tagName === 'input') {
    const type = element.getAttribute('type')?.toLowerCase();
    switch (type) {
      case 'checkbox': return 'checkbox';
      case 'radio': return 'radio';
      case 'file': return 'file';
      default: return 'input';
    }
  }
  return 'input';
}

function getFieldLabel(element: HTMLElement): string | undefined {
  const id = element.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent?.trim();
  }
  
  const parent = element.closest('label');
  if (parent) return parent.textContent?.trim();
  
  const prevSibling = element.previousElementSibling;
  if (prevSibling?.tagName === 'LABEL') {
    return prevSibling.textContent?.trim();
  }
  
  return undefined;
}

function getFieldValue(element: HTMLElement): string {
  const input = element as HTMLInputElement;
  if (input.type === 'checkbox' || input.type === 'radio') {
    return input.checked ? 'true' : 'false';
  }
  return input.value || '';
}

async function setFieldValue(element: HTMLElement, value: any): Promise<void> {
  const input = element as HTMLInputElement;
  
  // Handle TipTap editor - check if this is a TipTap editor container
  const tiptapEditor = element.closest('.tiptap-editor, .ProseMirror-editor, [data-tiptap]');
  if (tiptapEditor) {
    // Try to find the TipTap editor instance
    const proseMirrorElement = tiptapEditor.querySelector('.ProseMirror');
    if (proseMirrorElement) {
      // Set the HTML content directly in the ProseMirror element
      proseMirrorElement.innerHTML = String(value);
      
      // Trigger input events
      proseMirrorElement.dispatchEvent(new Event('input', { bubbles: true }));
      proseMirrorElement.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Also try to trigger React Hook Form events
      const formField = element.closest('[data-form]');
      if (formField) {
        const hiddenInput = formField.querySelector('input[type="hidden"]');
        if (hiddenInput) {
          (hiddenInput as HTMLInputElement).value = String(value);
          hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
          hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      return;
    }
  }
  
  // Handle textarea elements
  if (input.tagName === 'TEXTAREA') {
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 100));
    return;
  }
  
  // Handle checkbox and radio inputs
  if (input.type === 'checkbox' || input.type === 'radio') {
    input.checked = Boolean(value);
  } else {
    input.value = String(value);
  }
  
  // Trigger events for React components
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Small delay to ensure React updates
  await new Promise(resolve => setTimeout(resolve, 100));
}

function extractTableData(table: HTMLTableElement): string {
  const data: string[] = [];
  const rows = table.querySelectorAll('tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td, th');
    const rowData = Array.from(cells).map(cell => cell.textContent?.trim() || '');
    data.push(rowData.join(' | '));
  });
  return data.join('\n');
}

function extractListData(list: HTMLElement): string {
  const items = list.querySelectorAll('li');
  return Array.from(items).map(item => item.textContent?.trim() || '').join('\n');
}