import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { ExplanationFormFields } from "./explanation-form-fields";
import { ExplanationSubmitButton } from "./explanation-submit-button";
import { logger } from '@/lib/logger';

const formSchema = z.object({
  heading: z.string().min(1, { message: "Heading is required" }),
  code: z.string().min(1, { message: "Code is required" }),
  explanation: z.string().min(1, { message: "Explanation is required" })
    .transform((str) => str.trim()) // Remove extra whitespace
    .refine((str) => str !== '<p><br></p>', { // Check if content is not empty
      message: "Explanation is required"
    }),
});

interface ExplanationFormProps {
  onSubmit: (values: any) => void;
  isSubmitting: boolean;
  initialData?: {
    heading: string;
    code: string;
    explanation: string;
  };
}

export const ExplanationForm = ({ 
  onSubmit, 
  isSubmitting,
  initialData 
}: ExplanationFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      heading: "",
      code: "",
      explanation: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onSubmit(values);
      
      // On successful submission, reset the form and clear localStorage
      form.reset({
        heading: "",
        code: "",
        explanation: "",
      });
      
      // Clear localStorage
      localStorage.removeItem('explanation-code-blocks');
      localStorage.removeItem('explanation-heading');
      
      // Dispatch a custom event to notify ExplanationFormFields to reset
      window.dispatchEvent(new CustomEvent('resetExplanationForm'));
      
      toast.success("Explanation form reset successfully!");
      
    } catch (error) {
      logger.error("Form submission error:", error);
      // Don't reset on error - let user see their data
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <ExplanationFormFields form={form} isSubmitting={isSubmitting} />
        <ExplanationSubmitButton isSubmitting={isSubmitting} isValid={form.formState.isValid} />
      </form>
    </Form>
  );
}; 