/**
 * @sam-ai/react - useSAMForm Hook
 * Hook for form synchronization with SAM
 */
import type { UseSAMFormReturn, FormSyncOptions } from '../types';
/**
 * Hook for SAM form synchronization
 *
 * @example
 * ```tsx
 * function FormComponent() {
 *   const formRef = useRef<HTMLFormElement>(null);
 *   const { fields, syncFormToSAM, getFieldSuggestions } = useSAMForm();
 *
 *   useEffect(() => {
 *     if (formRef.current) {
 *       syncFormToSAM(formRef.current);
 *     }
 *   }, []);
 *
 *   return (
 *     <form ref={formRef}>
 *       <input name="title" placeholder="Course Title" />
 *       <textarea name="description" placeholder="Description" />
 *     </form>
 *   );
 * }
 * ```
 */
export declare function useSAMForm(): UseSAMFormReturn;
/**
 * Hook for auto-syncing a form with SAM
 */
export declare function useSAMFormSync(options: FormSyncOptions): void;
//# sourceMappingURL=useSAMForm.d.ts.map