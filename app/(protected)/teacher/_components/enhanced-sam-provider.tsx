"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

// Enhanced types for better context understanding
interface EnhancedFormField {
  name: string;
  type: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'rich-text' | 'date' | 'number';
  element: HTMLElement;
  label?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  options?: Array<{ value: string; label: string }>;
  metadata?: {
    fieldPurpose?: string; // e.g., "course-title", "learning-objective"
    dataType?: string; // e.g., "bloom-taxonomy", "markdown"
    relatedTo?: string; // e.g., "chapter-123"
  };
}

interface PageComponent {
  type: 'form' | 'table' | 'card' | 'list' | 'chart' | 'editor';
  identifier: string;
  data: any;
  actions: Array<{
    name: string;
    type: 'submit' | 'navigate' | 'api-call' | 'state-change';
    handler?: () => void;
  }>;
  metadata?: any;
}

interface ServerSideData {
  entityType?: 'course' | 'chapter' | 'section' | 'post' | 'template';
  entityId?: string;
  entityData?: any;
  relatedData?: any;
  permissions?: {
    canEdit?: boolean;
    canDelete?: boolean;
    canPublish?: boolean;
  };
  statistics?: any;
}

interface WorkflowContext {
  currentStep?: number;
  totalSteps?: number;
  completedSteps?: string[];
  nextAction?: string;
  blockers?: string[];
}

interface EnhancedPageData {
  // Basic page info
  title: string;
  description: string;
  pageType: 'list' | 'detail' | 'create' | 'edit' | 'analytics' | 'settings';
  breadcrumbs: Array<{ label: string; url: string }>;
  
  // Enhanced form understanding
  forms: Array<{
    id: string;
    purpose: string; // e.g., "update-course-title", "create-chapter"
    fields: EnhancedFormField[];
    currentValues: Record<string, any>;
    validationState: Record<string, boolean>;
    submitEndpoint?: string;
    method?: string;
  }>;
  
  // Page components with semantic understanding
  components: PageComponent[];
  
  // Server-side context
  serverData: ServerSideData;
  
  // Workflow awareness
  workflow: WorkflowContext;
  
  // Available actions with context
  availableActions: Array<{
    id: string;
    label: string;
    type: string;
    enabled: boolean;
    reason?: string; // Why enabled/disabled
    handler?: () => void;
  }>;
  
  // Page-specific metadata
  metadata: {
    lastUpdated?: Date;
    userRole?: string;
    capabilities?: string[];
    relatedPages?: Array<{ label: string; url: string }>;
  };
}

interface EnhancedSamContextType {
  pageData: EnhancedPageData;
  refreshPageData: () => void;
  
  // Enhanced form operations
  populateForm: (formId: string, data: Record<string, any>, validate?: boolean) => Promise<boolean>;
  submitForm: (formId: string, additionalData?: Record<string, any>) => Promise<boolean>;
  validateForm: (formId: string) => Promise<{ valid: boolean; errors: Record<string, string> }>;
  
  // Page component operations
  interactWithComponent: (componentId: string, action: string, params?: any) => Promise<boolean>;
  getComponentData: (componentId: string) => any;
  
  // Workflow operations
  navigateWorkflow: (direction: 'next' | 'previous' | 'specific', step?: string) => Promise<boolean>;
  getWorkflowStatus: () => WorkflowContext;
  
  // Server data operations
  refreshServerData: () => Promise<void>;
  updateServerData: (updates: any) => Promise<boolean>;
  
  // Context injection for specific pages
  injectPageContext: (context: Partial<EnhancedPageData>) => void;
  
  isReady: boolean;
}

const EnhancedSamContext = createContext<EnhancedSamContextType | undefined>(undefined);

export function EnhancedSamProvider({ children }: { children: React.ReactNode }) {
  const [pageData, setPageData] = useState<EnhancedPageData>({
    title: '',
    description: '',
    pageType: 'list',
    breadcrumbs: [],
    forms: [],
    components: [],
    serverData: {},
    workflow: {},
    availableActions: [],
    metadata: {}
  });
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  // Detect page type from URL pattern
  const detectPageType = useCallback((path: string): EnhancedPageData['pageType'] => {
    if (path.includes('/create')) return 'create';
    if (path.includes('/edit')) return 'edit';
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/courses/') && path.match(/\/[a-zA-Z0-9-]+$/)) return 'edit';
    if (path.includes('/posts/') && path.match(/\/[a-zA-Z0-9-]+$/)) return 'edit';
    if (path.match(/\/[a-zA-Z0-9-]+$/)) return 'detail';
    return 'list';
  }, []);

  // Extract semantic form information
  const analyzeFormSemantically = useCallback((form: HTMLFormElement): any => {
    const formId = form.id || form.getAttribute('data-form') || 'unknown-form';
    const formPurpose = form.getAttribute('data-purpose') || 
                       form.getAttribute('data-form') || 
                       guessFormPurpose(form);
    
    const fields: EnhancedFormField[] = [];
    const currentValues: Record<string, any> = {};
    const validationState: Record<string, boolean> = {};
    
    // Analyze all form fields with enhanced detection including rich text editors
    const formElements = form.querySelectorAll('input, textarea, select, [contenteditable], .ProseMirror, .tiptap-editor [contenteditable], .ql-editor, .fr-element, [data-field-purpose]');
    
    formElements.forEach((element) => {
      const fieldElement = element as HTMLElement;
      const fieldName = fieldElement.getAttribute('name') || 
                       fieldElement.getAttribute('id') || 
                       fieldElement.getAttribute('data-field') ||
                       `field-${fields.length}`;
      
      // Detect field type with rich text editor support
      let fieldType = getEnhancedFieldType(fieldElement);
      
      // Extract validation rules
      const validation = extractValidationRules(fieldElement);
      
      // Get field metadata
      const metadata = extractFieldMetadata(fieldElement);
      
      // Get current value with React state awareness
      const currentValue = getFieldValueWithReactState(fieldElement);
      currentValues[fieldName] = currentValue;
      
      // Check validation state
      validationState[fieldName] = checkFieldValidity(fieldElement);
      
      console.log(`Field detected: ${fieldName} = "${currentValue.substring(0, 100)}${currentValue.length > 100 ? '...' : ''}" (type: ${fieldType}, purpose: ${metadata.fieldPurpose || 'none'}, label: "${getFieldLabel(fieldElement)}")`);
      
      fields.push({
        name: fieldName,
        type: fieldType,
        element: fieldElement,
        label: getFieldLabel(fieldElement),
        placeholder: fieldElement.getAttribute('placeholder') || '',
        required: fieldElement.hasAttribute('required'),
        value: currentValue,
        validation,
        metadata
      });
    });
    
    // Detect submit endpoint from form action or data attributes
    const submitEndpoint = form.action || form.getAttribute('data-endpoint');
    const method = form.method || 'POST';
    
    return {
      id: formId,
      purpose: formPurpose,
      fields,
      currentValues,
      validationState,
      submitEndpoint,
      method
    };
  }, []);

  // Extract page components with semantic understanding
  const extractPageComponents = useCallback((): PageComponent[] => {
    const components: PageComponent[] = [];
    
    // Detect React components by common patterns
    const componentSelectors = [
      '[data-component]',
      '[data-testid]',
      '.card',
      'table',
      '[role="list"]',
      '.chart-container',
      '.editor-container'
    ];
    
    componentSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach((element, index) => {
        const componentType = detectComponentType(element);
        const componentId = element.getAttribute('id') || 
                          element.getAttribute('data-component') ||
                          `${componentType}-${index}`;
        
        components.push({
          type: componentType,
          identifier: componentId,
          data: extractComponentData(element, componentType),
          actions: extractComponentActions(element),
          metadata: extractComponentMetadata(element)
        });
      });
    });
    
    return components;
  }, []);

  // Build workflow context from page state
  const buildWorkflowContext = useCallback((): WorkflowContext => {
    const workflow: WorkflowContext = {};
    
    // Detect multi-step forms or wizards
    const stepIndicators = document.querySelectorAll('[data-step], .step-indicator, .wizard-step');
    if (stepIndicators.length > 0) {
      workflow.totalSteps = stepIndicators.length;
      workflow.currentStep = Array.from(stepIndicators).findIndex(el => 
        el.classList.contains('active') || el.hasAttribute('data-current')
      ) + 1;
    }
    
    // Check for completion indicators
    const completedElements = document.querySelectorAll('[data-completed="true"], .completed');
    workflow.completedSteps = Array.from(completedElements).map(el => 
      el.getAttribute('data-step') || el.textContent?.trim() || ''
    );
    
    // Detect blockers or requirements
    const blockerElements = document.querySelectorAll('[data-blocked], .disabled:not(:disabled)');
    workflow.blockers = Array.from(blockerElements).map(el => 
      el.getAttribute('data-reason') || 'Unknown blocker'
    );
    
    return workflow;
  }, []);

  // Inject server-side data from page context
  const injectPageContext = useCallback((context: Partial<EnhancedPageData>) => {
    setPageData(prev => ({
      ...prev,
      ...context,
      serverData: {
        ...prev.serverData,
        ...context.serverData
      },
      metadata: {
        ...prev.metadata,
        ...context.metadata
      }
    }));
  }, []);

  // Enhanced page analysis
  const analyzePage = useCallback((): EnhancedPageData => {
    const pageType = detectPageType(pathname);
    
    // Extract enhanced page title and description
    const title = document.querySelector('h1')?.textContent ||
                 document.querySelector('[data-page-title]')?.textContent ||
                 document.title;
    
    const description = document.querySelector('[data-page-description]')?.textContent ||
                       document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                       '';
    
    // Build breadcrumbs with URLs
    const breadcrumbs = extractBreadcrumbs();
    
    // Analyze forms semantically with comprehensive detection
    const formElements = Array.from(document.querySelectorAll('form'));
    console.log(`🔍 Enhanced SAM: Found ${formElements.length} form elements on page`);
    
    formElements.forEach((form, index) => {
      const allFields = form.querySelectorAll('input, textarea, select, [contenteditable], .ProseMirror, .tiptap-editor [contenteditable], .ql-editor, .fr-element, [data-field-purpose]');
      console.log(`📋 Form ${index + 1}:`, {
        id: form.id,
        action: form.action,
        method: form.method,
        dataPurpose: form.getAttribute('data-purpose'),
        entityType: form.getAttribute('data-entity-type'),
        entityId: form.getAttribute('data-entity-id'),
        fieldsCount: allFields.length,
        fieldTypes: Array.from(allFields).map(field => {
          const fieldElement = field as HTMLElement;
          return {
            name: fieldElement.getAttribute('name') || fieldElement.getAttribute('id') || 'unknown',
            type: getEnhancedFieldType(fieldElement),
            purpose: fieldElement.getAttribute('data-field-purpose'),
            value: getFieldValueWithReactState(fieldElement)?.substring(0, 100) || ''
          };
        })
      });
    });
    
    const forms = formElements.map(analyzeFormSemantically);
    
    // Extract page components
    const components = extractPageComponents();
    
    // Build workflow context
    const workflow = buildWorkflowContext();
    
    // Extract available actions
    const availableActions = extractAvailableActions();
    
    // Build metadata
    const metadata = {
      lastUpdated: new Date(),
      capabilities: detectPageCapabilities(pageType, components, forms),
      relatedPages: extractRelatedPages()
    };
    
    return {
      title,
      description,
      pageType,
      breadcrumbs,
      forms,
      components,
      serverData: {}, // This will be injected by page components
      workflow,
      availableActions,
      metadata
    };
  }, [pathname, detectPageType, analyzeFormSemantically, extractPageComponents, buildWorkflowContext]);

  // Refresh page data
  const refreshPageData = useCallback(() => {
    const newData = analyzePage();
    setPageData(prev => ({
      ...newData,
      serverData: prev.serverData // Preserve server data
    }));
    setIsReady(true);
  }, [analyzePage]);

  // Enhanced form population with validation
  const populateForm = useCallback(async (
    formId: string, 
    data: Record<string, any>,
    validate: boolean = true
  ): Promise<boolean> => {
    console.log('🔄 populateForm called with:', { formId, data, validate });
    console.log('📋 Available forms:', pageData.forms.map(f => ({ id: f.id, purpose: f.purpose, fields: f.fields.map(field => ({ name: field.name, type: field.type, purpose: field.metadata?.fieldPurpose })) })));
    
    // First, check for form metadata elements for forms that might not be visible
    const formMetadata = document.querySelector(`[data-sam-form-metadata="${formId}"], [data-form-id="${formId}"], [data-form-purpose="${formId}"]`);
    if (formMetadata) {
      console.log('📊 Found form metadata:', {
        formId: formMetadata.getAttribute('data-form-id'),
        purpose: formMetadata.getAttribute('data-form-purpose'),
        isEditing: formMetadata.getAttribute('data-is-editing')
      });
      
      // Dispatch event to trigger form edit mode and population
      window.dispatchEvent(new CustomEvent('sam-populate-form', {
        detail: { formId, data }
      }));
      
      // Wait a bit for the form to become available
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Refresh page data to detect the newly rendered form
      refreshPageData();
      
      // Wait for refresh to complete
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const form = pageData.forms.find(f => f.id === formId || f.purpose === formId);
    if (!form) {
      console.error('❌ Form not found:', formId);
      console.log('Available forms:', pageData.forms.map(f => ({ id: f.id, purpose: f.purpose })));
      
      // Try alternate approach if form metadata was found
      if (formMetadata) {
        console.log('🔄 Attempting alternate population method via metadata');
        return true; // Assume success since we dispatched the event
      }
      
      return false;
    }

    console.log('✅ Form found:', form);
    console.log('📋 Form fields:', form.fields.map(f => ({ name: f.name, type: f.type, purpose: f.metadata?.fieldPurpose, currentValue: f.value?.substring(0, 100) })));

    try {
      for (const field of form.fields) {
        // Try to match by field name, purpose, or alternative mappings
        let value = data[field.name];
        if (value === undefined && field.metadata?.fieldPurpose) {
          value = data[field.metadata.fieldPurpose];
        }
        if (value === undefined) {
          // Try common field mappings
          const commonMappings: Record<string, string[]> = {
            'title': ['courseTitle', 'name'],
            'description': ['courseDescription', 'content'],
            'whatYouWillLearn': ['learningObjectives', 'objectives', 'outcomes'],
            'price': ['coursePrice', 'amount'],
            'categoryId': ['category']
          };
          
          const possibleKeys = commonMappings[field.name] || [];
          for (const key of possibleKeys) {
            if (data[key] !== undefined) {
              value = data[key];
              break;
            }
          }
        }
        
        if (value !== undefined) {
          console.log(`🔄 Populating field ${field.name} (purpose: ${field.metadata?.fieldPurpose}) with value:`, typeof value === 'string' ? value.substring(0, 100) : value);
          await setFieldValueEnhanced(field, value);
          
          // Update internal state
          form.currentValues[field.name] = value;
          
          if (validate) {
            form.validationState[field.name] = validateFieldValue(field, value);
          }
        } else {
          console.log(`⚠️ No value found for field ${field.name} (purpose: ${field.metadata?.fieldPurpose})`);
        }
      }
      
      // Trigger form change event for React Hook Form
      const formElement = document.querySelector(`#${formId}`) as HTMLFormElement;
      if (formElement) {
        formElement.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Form change event triggered');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error populating form:', error);
      return false;
    }
  }, [pageData.forms, refreshPageData]);

  // Validate form
  const validateForm = useCallback(async (formId: string): Promise<{
    valid: boolean;
    errors: Record<string, string>;
  }> => {
    const form = pageData.forms.find(f => f.id === formId || f.purpose === formId);
    if (!form) return { valid: false, errors: { form: 'Form not found' } };

    const errors: Record<string, string> = {};
    let valid = true;

    for (const field of form.fields) {
      const value = form.currentValues[field.name];
      const isValid = validateFieldValue(field, value);
      
      if (!isValid) {
        valid = false;
        errors[field.name] = getFieldValidationError(field, value);
      }
    }

    return { valid, errors };
  }, [pageData.forms]);

  // Interact with page components
  const interactWithComponent = useCallback(async (
    componentId: string,
    action: string,
    params?: any
  ): Promise<boolean> => {
    const component = pageData.components.find(c => c.identifier === componentId);
    if (!component) return false;

    const actionDef = component.actions.find(a => a.name === action);
    if (!actionDef) return false;

    try {
      if (actionDef.handler) {
        await actionDef.handler();
      } else {
        // Handle generic actions
        switch (actionDef.type) {
          case 'navigate':
            router.push(params.url);
            break;
          case 'api-call':
            await fetch(params.endpoint, {
              method: params.method || 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params.data)
            });
            break;
          case 'state-change':
            // Trigger React state change via custom event
            window.dispatchEvent(new CustomEvent('sam-state-change', {
              detail: { componentId, action, params }
            }));
            break;
        }
      }
      return true;
    } catch (error) {
      console.error('Component interaction error:', error);
      return false;
    }
  }, [pageData.components, router]);

  // Navigate workflow
  const navigateWorkflow = useCallback(async (
    direction: 'next' | 'previous' | 'specific',
    step?: string
  ): Promise<boolean> => {
    // Implementation depends on specific workflow system
    window.dispatchEvent(new CustomEvent('sam-workflow-navigate', {
      detail: { direction, step }
    }));
    return true;
  }, []);

  // Auto-refresh on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshPageData();
    }, 500); // Faster refresh for better UX

    return () => clearTimeout(timer);
  }, [pathname, refreshPageData]);

  // Additional refresh for forms after page load
  useEffect(() => {
    const intervals = [500, 1000, 2000, 3000, 5000]; // More frequent initial refreshes
    
    const timers = intervals.map(delay => 
      setTimeout(() => {
        console.log(`🔄 Enhanced SAM: Refreshing form data after ${delay}ms`);
        refreshPageData();
      }, delay)
    );

    // Also set up a MutationObserver to detect dynamically added forms
    const observer = new MutationObserver((mutations) => {
      let shouldRefresh = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const element = node as Element;
              if (element.tagName === 'FORM' || element.querySelector('form')) {
                shouldRefresh = true;
              }
            }
          });
        }
      });
      
      if (shouldRefresh) {
        console.log('🔄 Enhanced SAM: New form detected, refreshing page data');
        refreshPageData();
      }
    });

    // Start observing after a short delay to ensure page is loaded
    setTimeout(() => {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }, 100);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      observer.disconnect();
    };
  }, [pathname, refreshPageData]);

  // Listen for custom events from React components
  useEffect(() => {
    const handleContextUpdate = (event: CustomEvent) => {
      console.log('📥 Received sam-context-update event:', event.detail);
      injectPageContext(event.detail);
    };

    window.addEventListener('sam-context-update', handleContextUpdate as EventListener);
    
    return () => {
      window.removeEventListener('sam-context-update', handleContextUpdate as EventListener);
    };
  }, [injectPageContext]);

  // Expose enhanced API globally
  useEffect(() => {
    (window as any).enhancedSam = {
      injectContext: injectPageContext,
      getPageData: () => pageData,
      refreshData: refreshPageData
    };

    return () => {
      delete (window as any).enhancedSam;
    };
  }, [injectPageContext, pageData, refreshPageData]);

  return (
    <EnhancedSamContext.Provider value={{
      pageData,
      refreshPageData,
      populateForm,
      submitForm: async (formId: string, additionalData?: Record<string, any>) => {
        // Enhanced submit implementation
        const form = pageData.forms.find(f => f.id === formId);
        if (!form) return false;
        
        const validation = await validateForm(formId);
        if (!validation.valid) {
          console.error('Form validation failed:', validation.errors);
          return false;
        }
        
        // Merge form data with additional data
        const submitData = { ...form.currentValues, ...additionalData };
        
        // Submit via endpoint if available
        if (form.submitEndpoint) {
          try {
            const response = await fetch(form.submitEndpoint, {
              method: form.method || 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(submitData)
            });
            return response.ok;
          } catch (error) {
            console.error('Form submission error:', error);
            return false;
          }
        }
        
        // Fallback to DOM submission
        const formElement = document.getElementById(formId) as HTMLFormElement;
        if (formElement) {
          formElement.submit();
          return true;
        }
        
        return false;
      },
      validateForm,
      interactWithComponent,
      getComponentData: (componentId: string) => {
        const component = pageData.components.find(c => c.identifier === componentId);
        return component?.data;
      },
      navigateWorkflow,
      getWorkflowStatus: () => pageData.workflow,
      refreshServerData: async () => {
        // This would be implemented by specific pages
        window.dispatchEvent(new CustomEvent('sam-refresh-server-data'));
      },
      updateServerData: async (updates: any) => {
        window.dispatchEvent(new CustomEvent('sam-update-server-data', {
          detail: updates
        }));
        return true;
      },
      injectPageContext,
      isReady
    }}>
      {children}
    </EnhancedSamContext.Provider>
  );
}

export function useEnhancedSam() {
  const context = useContext(EnhancedSamContext);
  if (!context) {
    throw new Error('useEnhancedSam must be used within EnhancedSamProvider');
  }
  return context;
}

// Helper functions

function guessFormPurpose(form: HTMLFormElement): string {
  const formId = form.id?.toLowerCase() || '';
  const formClass = form.className?.toLowerCase() || '';
  const formAction = form.action?.toLowerCase() || '';
  
  // Common patterns
  if (formId.includes('title') || formClass.includes('title')) return 'update-title';
  if (formId.includes('description')) return 'update-description';
  if (formId.includes('create')) return 'create-entity';
  if (formId.includes('chapter')) return 'manage-chapter';
  if (formId.includes('learning')) return 'learning-objectives';
  if (formAction.includes('/api/')) {
    const apiPath = formAction.split('/api/')[1];
    return apiPath.replace(/\//g, '-');
  }
  
  return 'general-form';
}

function getEnhancedFieldType(element: HTMLElement): EnhancedFormField['type'] {
  // Check for rich text editors
  if (element.classList.contains('ProseMirror') || 
      element.closest('.tiptap-editor') || 
      element.hasAttribute('contenteditable')) {
    return 'rich-text';
  }
  
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'textarea') return 'textarea';
  if (tagName === 'select') return 'select';
  
  if (tagName === 'input') {
    const type = element.getAttribute('type')?.toLowerCase();
    switch (type) {
      case 'checkbox': return 'checkbox';
      case 'radio': return 'radio';
      case 'file': return 'file';
      case 'date': return 'date';
      case 'number': return 'number';
      default: return 'input';
    }
  }
  
  return 'input';
}

function extractValidationRules(element: HTMLElement): EnhancedFormField['validation'] {
  const validation: EnhancedFormField['validation'] = {};
  
  // HTML5 validation attributes
  if (element.hasAttribute('pattern')) {
    validation.pattern = element.getAttribute('pattern') || undefined;
  }
  if (element.hasAttribute('minlength')) {
    validation.minLength = parseInt(element.getAttribute('minlength') || '0');
  }
  if (element.hasAttribute('maxlength')) {
    validation.maxLength = parseInt(element.getAttribute('maxlength') || '0');
  }
  if (element.hasAttribute('min')) {
    validation.min = parseFloat(element.getAttribute('min') || '0');
  }
  if (element.hasAttribute('max')) {
    validation.max = parseFloat(element.getAttribute('max') || '0');
  }
  
  return validation;
}

function extractFieldMetadata(element: HTMLElement): EnhancedFormField['metadata'] {
  const metadata: EnhancedFormField['metadata'] = {};
  
  // Extract data attributes
  const purpose = element.getAttribute('data-purpose') || 
                 element.getAttribute('data-field-type');
  if (purpose) metadata.fieldPurpose = purpose;
  
  const dataType = element.getAttribute('data-type') || 
                  element.getAttribute('data-content-type');
  if (dataType) metadata.dataType = dataType;
  
  const relatedTo = element.getAttribute('data-related-to') || 
                   element.getAttribute('data-entity-id');
  if (relatedTo) metadata.relatedTo = relatedTo;
  
  return metadata;
}

function getFieldValueWithReactState(element: HTMLElement): string {
  try {
    // Handle TipTap/ProseMirror editors first
    if (element.classList.contains('ProseMirror') || element.closest('.tiptap-editor')) {
      const proseMirror = element.classList.contains('ProseMirror') ? element : element.querySelector('.ProseMirror');
      if (proseMirror) {
        const content = proseMirror.innerHTML || proseMirror.textContent || '';
        console.log('Rich text editor value:', content.substring(0, 100));
        return content;
      }
    }
    
    // Handle elements with data-field-purpose attribute (TipTap editors)
    if (element.hasAttribute('data-field-purpose')) {
      const tiptapEditor = element.querySelector('.tiptap-editor .ProseMirror');
      if (tiptapEditor) {
        const content = tiptapEditor.innerHTML || tiptapEditor.textContent || '';
        console.log('TipTap editor value:', content.substring(0, 100));
        return content;
      }
    }
    
    // Handle contenteditable elements
    if (element.hasAttribute('contenteditable')) {
      const content = element.innerHTML || element.textContent || '';
      console.log('Contenteditable value:', content.substring(0, 100));
      return content;
    }
    
    // Try multiple React Fiber approaches
    const reactKeys = Object.keys(element).filter(key => 
      key.startsWith('__reactInternalInstance') || 
      key.startsWith('__reactFiber') ||
      key.startsWith('__reactInternalFiber') ||
      key.startsWith('__react')
    );
    
    for (const key of reactKeys) {
      const reactData = (element as any)[key];
      if (reactData?.memoizedProps?.value !== undefined) {
        console.log('React memoized value:', reactData.memoizedProps.value);
        return String(reactData.memoizedProps.value);
      }
      if (reactData?.pendingProps?.value !== undefined) {
        console.log('React pending value:', reactData.pendingProps.value);
        return String(reactData.pendingProps.value);
      }
      if (reactData?.return?.memoizedProps?.value !== undefined) {
        console.log('React return value:', reactData.return.memoizedProps.value);
        return String(reactData.return.memoizedProps.value);
      }
    }
    
    // Handle form inputs
    const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    
    if (input.tagName === 'INPUT') {
      const inputElement = input as HTMLInputElement;
      if (inputElement.type === 'checkbox' || inputElement.type === 'radio') {
        const value = inputElement.checked ? 'true' : 'false';
        console.log('Checkbox/Radio value:', value);
        return value;
      }
      console.log('Input value:', inputElement.value);
      return inputElement.value || '';
    }
    
    if (input.tagName === 'TEXTAREA') {
      const value = (input as HTMLTextAreaElement).value || '';
      console.log('Textarea value:', value.substring(0, 100));
      return value;
    }
    
    if (input.tagName === 'SELECT') {
      const selectElement = input as HTMLSelectElement;
      const value = selectElement.value || '';
      console.log('Select value:', value);
      return value;
    }
    
    // Fallback to attribute or text content
    const fallbackValue = element.getAttribute('value') || element.textContent || '';
    console.log('Fallback value:', fallbackValue.substring(0, 100));
    return fallbackValue;
    
  } catch (error) {
    console.warn('Error getting field value:', error);
    return '';
  }
}

function checkFieldValidity(element: HTMLElement): boolean {
  const input = element as HTMLInputElement;
  
  // HTML5 validation
  if ('checkValidity' in input) {
    return input.checkValidity();
  }
  
  // Basic validation
  if (input.hasAttribute('required') && !input.value) {
    return false;
  }
  
  return true;
}

function detectComponentType(element: Element): PageComponent['type'] {
  if (element.tagName === 'TABLE') return 'table';
  if (element.tagName === 'FORM') return 'form';
  if (element.classList.contains('chart')) return 'chart';
  if (element.classList.contains('editor')) return 'editor';
  if (element.getAttribute('role') === 'list') return 'list';
  return 'card';
}

function extractComponentData(element: Element, type: PageComponent['type']): any {
  switch (type) {
    case 'table':
      return extractTableData(element as HTMLTableElement);
    case 'list':
      return extractListData(element);
    case 'card':
      return extractCardData(element);
    default:
      return { content: element.textContent?.trim() };
  }
}

function extractComponentActions(element: Element): PageComponent['actions'] {
  const actions: PageComponent['actions'] = [];
  
  // Find buttons within component
  element.querySelectorAll('button').forEach(button => {
    actions.push({
      name: button.textContent?.trim() || 'Action',
      type: button.getAttribute('type') === 'submit' ? 'submit' : 'state-change',
      handler: () => button.click()
    });
  });
  
  // Find links
  element.querySelectorAll('a[href]').forEach(link => {
    actions.push({
      name: link.textContent?.trim() || 'Link',
      type: 'navigate'
    });
  });
  
  return actions;
}

function extractComponentMetadata(element: Element): any {
  const metadata: any = {};
  
  // Extract all data attributes
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('data-')) {
      metadata[attr.name.substring(5)] = attr.value;
    }
  });
  
  return metadata;
}

function extractBreadcrumbs(): Array<{ label: string; url: string }> {
  const breadcrumbs: Array<{ label: string; url: string }> = [];
  
  // Look for breadcrumb navigation
  const breadcrumbNav = document.querySelector('nav[aria-label="breadcrumb"], .breadcrumb');
  if (breadcrumbNav) {
    breadcrumbNav.querySelectorAll('a').forEach(link => {
      breadcrumbs.push({
        label: link.textContent?.trim() || '',
        url: link.getAttribute('href') || ''
      });
    });
  }
  
  return breadcrumbs;
}

function extractAvailableActions(): EnhancedPageData['availableActions'] {
  const actions: EnhancedPageData['availableActions'] = [];
  
  // Find all action buttons
  document.querySelectorAll('button[data-action], .action-button').forEach((button, index) => {
    const buttonEl = button as HTMLButtonElement;
    actions.push({
      id: button.id || `action-${index}`,
      label: buttonEl.textContent?.trim() || 'Action',
      type: button.getAttribute('data-action-type') || 'button',
      enabled: !buttonEl.disabled,
      reason: buttonEl.disabled ? buttonEl.getAttribute('data-disabled-reason') : undefined,
      handler: () => buttonEl.click()
    });
  });
  
  return actions;
}

function detectPageCapabilities(
  pageType: EnhancedPageData['pageType'],
  components: PageComponent[],
  forms: any[]
): string[] {
  const capabilities: string[] = [];
  
  // Page type capabilities
  switch (pageType) {
    case 'create':
      capabilities.push('content-generation', 'form-assistance');
      break;
    case 'edit':
      capabilities.push('content-improvement', 'form-population');
      break;
    case 'analytics':
      capabilities.push('data-analysis', 'insights-generation');
      break;
    case 'list':
      capabilities.push('filtering', 'bulk-operations');
      break;
    case 'detail':
      capabilities.push('navigation', 'action-execution');
      break;
  }
  
  // Component-based capabilities
  if (components.some(c => c.type === 'table')) {
    capabilities.push('data-export', 'sorting');
  }
  if (components.some(c => c.type === 'chart')) {
    capabilities.push('visualization-analysis');
  }
  if (forms.length > 0) {
    capabilities.push('form-filling', 'validation');
  }
  
  return [...new Set(capabilities)];
}

function extractRelatedPages(): Array<{ label: string; url: string }> {
  const related: Array<{ label: string; url: string }> = [];
  
  // Look for related links sections
  const relatedSections = document.querySelectorAll('[data-related], .related-links');
  relatedSections.forEach(section => {
    section.querySelectorAll('a').forEach(link => {
      related.push({
        label: link.textContent?.trim() || '',
        url: link.getAttribute('href') || ''
      });
    });
  });
  
  return related;
}

function validateFieldValue(field: EnhancedFormField, value: any): boolean {
  // Required validation
  if (field.required && !value) return false;
  
  // Type-specific validation
  if (field.validation) {
    if (field.validation.pattern) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(String(value))) return false;
    }
    
    if (field.type === 'number' || field.type === 'date') {
      const numValue = parseFloat(value);
      if (field.validation.min !== undefined && numValue < field.validation.min) return false;
      if (field.validation.max !== undefined && numValue > field.validation.max) return false;
    }
    
    if (typeof value === 'string') {
      if (field.validation.minLength && value.length < field.validation.minLength) return false;
      if (field.validation.maxLength && value.length > field.validation.maxLength) return false;
    }
  }
  
  return true;
}

function getFieldValidationError(field: EnhancedFormField, value: any): string {
  if (field.required && !value) {
    return `${field.label || field.name} is required`;
  }
  
  if (field.validation) {
    if (field.validation.pattern && !new RegExp(field.validation.pattern).test(String(value))) {
      return `${field.label || field.name} format is invalid`;
    }
    
    if (field.validation.minLength && String(value).length < field.validation.minLength) {
      return `${field.label || field.name} must be at least ${field.validation.minLength} characters`;
    }
    
    if (field.validation.maxLength && String(value).length > field.validation.maxLength) {
      return `${field.label || field.name} must be no more than ${field.validation.maxLength} characters`;
    }
  }
  
  return 'Invalid value';
}

async function setFieldValueEnhanced(field: EnhancedFormField, value: any): Promise<void> {
  const element = field.element;
  
  console.log(`Setting field value: ${field.name} = "${value}" (type: ${field.type})`);
  
  try {
    // Handle rich text editors (TipTap/ProseMirror)
    if (field.type === 'rich-text') {
      const proseMirror = element.querySelector('.ProseMirror') || 
                         (element.classList.contains('ProseMirror') ? element : null) ||
                         element.closest('.tiptap-editor')?.querySelector('.ProseMirror');
      
      if (proseMirror) {
        // Clear and set content
        proseMirror.innerHTML = String(value);
        
        // Trigger TipTap events
        proseMirror.dispatchEvent(new Event('input', { bubbles: true }));
        proseMirror.dispatchEvent(new Event('change', { bubbles: true }));
        proseMirror.dispatchEvent(new Event('blur', { bubbles: true }));
        
        // Try to trigger React Hook Form updates
        const form = element.closest('form');
        if (form) {
          // Look for hidden input with same name
          const hiddenInput = form.querySelector(`input[name="${field.name}"]`) as HTMLInputElement;
          if (hiddenInput) {
            hiddenInput.value = String(value);
            hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // Trigger form change event
          form.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        console.log('Rich text editor updated successfully');
        return;
      }
    }
    
    // Handle contenteditable elements
    if (element.hasAttribute('contenteditable')) {
      element.innerHTML = String(value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));
      console.log('Contenteditable updated successfully');
      return;
    }
    
    // Handle standard form inputs
    const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    
    // Special handling for React controlled components
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      input.constructor.prototype,
      'value'
    )?.set;
    
    if (input.tagName === 'INPUT') {
      const inputElement = input as HTMLInputElement;
      
      if (inputElement.type === 'checkbox' || inputElement.type === 'radio') {
        inputElement.checked = Boolean(value);
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`Checkbox/Radio updated: ${field.name} = ${inputElement.checked}`);
      } else if (inputElement.type === 'file') {
        console.warn('Cannot programmatically set file input value for security reasons');
      } else {
        // Use React-compatible value setting
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(inputElement, String(value));
        } else {
          inputElement.value = String(value);
        }
        
        // Trigger React events
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        inputElement.dispatchEvent(new Event('blur', { bubbles: true }));
        console.log(`Input updated: ${field.name} = "${inputElement.value}"`);
      }
    } else if (input.tagName === 'TEXTAREA') {
      const textareaElement = input as HTMLTextAreaElement;
      
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(textareaElement, String(value));
      } else {
        textareaElement.value = String(value);
      }
      
      textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
      textareaElement.dispatchEvent(new Event('change', { bubbles: true }));
      textareaElement.dispatchEvent(new Event('blur', { bubbles: true }));
      console.log(`Textarea updated: ${field.name} = "${textareaElement.value}"`);
      
    } else if (input.tagName === 'SELECT') {
      const selectElement = input as HTMLSelectElement;
      selectElement.value = String(value);
      selectElement.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`Select updated: ${field.name} = "${selectElement.value}"`);
    }
    
    // Additional delay for React state propagation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Trigger focus/blur cycle to ensure React Hook Form detects the change
    element.focus();
    await new Promise(resolve => setTimeout(resolve, 50));
    element.blur();
    
  } catch (error) {
    console.error(`Error setting field value for ${field.name}:`, error);
    throw error;
  }
}

function extractTableData(table: HTMLTableElement): any {
  const headers: string[] = [];
  const rows: any[] = [];
  
  // Extract headers
  table.querySelectorAll('thead th').forEach(th => {
    headers.push(th.textContent?.trim() || '');
  });
  
  // Extract rows
  table.querySelectorAll('tbody tr').forEach(tr => {
    const row: any = {};
    tr.querySelectorAll('td').forEach((td, index) => {
      const header = headers[index] || `col-${index}`;
      row[header] = td.textContent?.trim() || '';
    });
    rows.push(row);
  });
  
  return { headers, rows, count: rows.length };
}

function extractListData(list: Element): any {
  const items: any[] = [];
  
  list.querySelectorAll('li, [role="listitem"]').forEach(item => {
    const data: any = {
      text: item.textContent?.trim(),
      html: item.innerHTML
    };
    
    // Extract any data attributes
    Array.from(item.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        data[attr.name.substring(5)] = attr.value;
      }
    });
    
    items.push(data);
  });
  
  return { items, count: items.length };
}

function extractCardData(card: Element): any {
  const data: any = {
    title: card.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim(),
    content: card.querySelector('p')?.textContent?.trim(),
    fullText: card.textContent?.trim()
  };
  
  // Extract data attributes
  Array.from(card.attributes).forEach(attr => {
    if (attr.name.startsWith('data-')) {
      data[attr.name.substring(5)] = attr.value;
    }
  });
  
  return data;
}

function getFieldLabel(fieldElement: HTMLElement): string {
  // Check for associated label
  const fieldId = fieldElement.getAttribute('id');
  if (fieldId) {
    const label = document.querySelector(`label[for="${fieldId}"]`);
    if (label?.textContent) {
      return label.textContent.trim();
    }
  }
  
  // Check for parent label
  const parentLabel = fieldElement.closest('label');
  if (parentLabel?.textContent) {
    return parentLabel.textContent.replace(fieldElement.textContent || '', '').trim();
  }
  
  // Check for previous sibling label
  let sibling = fieldElement.previousElementSibling;
  while (sibling) {
    if (sibling.tagName === 'LABEL' && sibling.textContent) {
      return sibling.textContent.trim();
    }
    sibling = sibling.previousElementSibling;
  }
  
  // Check for aria-label
  const ariaLabel = fieldElement.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel;
  }
  
  // Check for placeholder or name as fallback
  return fieldElement.getAttribute('placeholder') || 
         fieldElement.getAttribute('name') || 
         fieldElement.getAttribute('data-field') ||
         'Unknown Field';
}