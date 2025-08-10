"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Pencil, PlusCircle, CheckCircle2, Lightbulb, GraduationCap, ChevronDown, ChevronUp, Trash2, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logger } from '@/lib/logger';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WhatYouWillLearnFormProps {
  initialData: {
    whatYouWillLearn: string[];
  };
  courseId: string;
}

type LearningObjective = {
  value: string;
  id: string;
  isEditing?: boolean;
  isNew?: boolean;
  isSaving?: boolean;
};

type FormValues = {
  whatYouWillLearn: LearningObjective[];
};

const formSchema = z.object({
  whatYouWillLearn: z.array(
    z.object({
      value: z.string().min(1, "Learning objective is required"),
      id: z.string(),
      isEditing: z.boolean().optional(),
      isNew: z.boolean().optional(),
      isSaving: z.boolean().optional(),
    })
  ).optional(),
});

// Example objectives to suggest to the user
const SUGGESTED_OBJECTIVES = [
  "Master the fundamentals of the subject",
  "Build real-world projects with practical applications",
  "Learn industry-standard best practices",
  "Understand key theoretical concepts and their applications",
  "Develop problem-solving skills in this domain",
  "Gain practical experience through hands-on exercises",
  "Apply advanced techniques to solve complex problems"
];

export const WhatYouWillLearnForm = ({
  initialData,
  courseId,
}: WhatYouWillLearnFormProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [pendingSamData, setPendingSamData] = useState<{ 
    learningObjectives?: string[]; 
    whatYouWillLearn?: string[]; 
    objectives?: string[] 
  } | null>(null);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      whatYouWillLearn: initialData.whatYouWillLearn?.map((obj, index) => ({
        value: obj,
        id: `objective-${index}`,
        isEditing: false,
        isNew: false,
        isSaving: false
      })) || [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "whatYouWillLearn",
  });

  const { isSubmitting, isValid } = form.formState;

  // Listen for SAM form population events
  useEffect(() => {
    const handleSamFormPopulation = (event: CustomEvent) => {

      if (event.detail?.formId === 'learning-objectives-form' || 
          event.detail?.formId === 'learning-objectives' ||
          event.detail?.formId === 'what-you-will-learn-form' ||
          event.detail?.formId === 'what-you-will-learn' ||
          event.detail?.formId === 'objectives-form') {

        // Store the data to be populated
        if (event.detail?.data?.learningObjectives || 
            event.detail?.data?.whatYouWillLearn || 
            event.detail?.data?.objectives) {
          setPendingSamData(event.detail.data);
        }
      }
    };

    window.addEventListener('sam-populate-form', handleSamFormPopulation as EventListener);
    
    return () => {
      window.removeEventListener('sam-populate-form', handleSamFormPopulation as EventListener);
    };
  }, []);

  // Handle pending SAM data when ready
  useEffect(() => {
    if (pendingSamData) {
      const objectives = pendingSamData.learningObjectives || 
                       pendingSamData.whatYouWillLearn || 
                       pendingSamData.objectives;
      
      if (objectives && Array.isArray(objectives)) {

        // Clear existing objectives
        const currentLength = fields.length;
        for (let i = currentLength - 1; i >= 0; i--) {
          remove(i);
        }
        
        // Add new objectives
        objectives.forEach((objective, index) => {
          append({
            value: objective,
            id: `objective-${Date.now()}-${index}`,
            isEditing: false,
            isNew: true,
            isSaving: false
          });
        });
        
        // Dispatch success event
        window.dispatchEvent(new CustomEvent('sam-form-populated', {
          detail: {
            formId: 'learning-objectives-form',
            success: true,
            count: objectives.length
          }
        }));
        
        toast.success(`Added ${objectives.length} learning objectives from SAM`);
        
        // Clear pending data
        setPendingSamData(null);
      }
    }
  }, [pendingSamData, fields.length, remove, append]);

  // Add a new objective
  const handleAddObjective = () => {
    const newObjective = { 
      value: "", 
      id: `objective-new-${Date.now()}`,
      isEditing: true,
      isNew: true
    };
    append(newObjective);
    setIsAdding(true);
  };

  // Save a specific objective
  const saveObjective = async (index: number) => {
    const objective = form.getValues(`whatYouWillLearn.${index}`);
    
    if (!objective.value || objective.value.trim() === "") {
      toast.error("Learning objective cannot be empty");
      return;
    }
    
    // Update the objective state to show loading
    update(index, {
      ...objective,
      isSaving: true
    });
    
    try {
      if (objective.isNew) {
        // Create new objective
        await axios.post(`/api/courses/${courseId}/what-you-will-learn`, {
          value: objective.value
        });
        toast.success("Learning objective added");
      } else {
        // Update existing objective - use index for the API endpoint
        await axios.patch(`/api/courses/${courseId}/what-you-will-learn/${index}`, {
          value: objective.value
        });
        toast.success("Learning objective updated");
      }
      
      // Update the state to reflect changes
      update(index, {
        ...objective,
        isEditing: false,
        isNew: false,
        isSaving: false
      });
      
      if (objective.isNew) {
        setIsAdding(false);
      }
      
      router.refresh();
    } catch (error) {
      logger.error("Save error:", error);
      toast.error("Something went wrong");
      // Revert the state
      update(index, {
        ...objective,
        isSaving: false
      });
    }
  };

  // Delete a specific objective
  const deleteObjective = async (index: number) => {
    const objective = form.getValues(`whatYouWillLearn.${index}`);
    
    // If it's a new unsaved objective, just remove it from the form
    if (objective.isNew) {
      remove(index);
      setIsAdding(false);
      return;
    }
    
    // Show loading state
    setGlobalLoading(true);
    
    try {
      // The API expects an index, not an ID, so we pass the index directly
      await axios.delete(`/api/courses/${courseId}/what-you-will-learn/${index}`);
      toast.success("Learning objective deleted");
      remove(index);
      router.refresh();
    } catch (error) {
      logger.error("Delete error:", error);
      toast.error("Something went wrong");
    } finally {
      setGlobalLoading(false);
    }
  };

  // Toggle edit mode for a specific objective
  const toggleEditObjective = (index: number) => {
    const objective = form.getValues(`whatYouWillLearn.${index}`);
    update(index, {
      ...objective,
      isEditing: !objective.isEditing
    });
  };

  // Add a suggested objective
  const addSuggestion = (suggestion: string) => {
    const newObjective = { 
      value: suggestion, 
      id: `objective-new-${Date.now()}`,
      isEditing: false,
      isNew: true,
      isSaving: true
    };
    
    append(newObjective);
    
    // Immediately save it
    (async () => {
      try {
        await axios.post(`/api/courses/${courseId}/what-you-will-learn`, {
          value: suggestion
        });
        toast.success("Learning objective added");
        router.refresh();
        
        // Update field array with the saved state
        const lastIndex = form.getValues("whatYouWillLearn").length - 1;
        update(lastIndex, {
          ...newObjective,
          isNew: false,
          isSaving: false
        });
      } catch (error) {
        logger.error("Add suggestion error:", error);
        toast.error("Something went wrong");
        // Remove if failed
        const lastIndex = form.getValues("whatYouWillLearn").length - 1;
        remove(lastIndex);
      }
    })();
  };

  // Reorder an objective (move up or down)
  const reorderObjective = async (index: number, direction: 'up' | 'down') => {
    setGlobalLoading(true);
    
    const allObjectives = form.getValues("whatYouWillLearn");
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= allObjectives.length) {
      setGlobalLoading(false);
      return;
    }
    
    try {
      await axios.patch(`/api/courses/${courseId}/what-you-will-learn/reorder`, {
        fromIndex: index,
        toIndex: newIndex
      });
      
      toast.success("Learning objectives reordered");
      router.refresh();
    } catch (error) {
      logger.error("Reorder error:", error);
      toast.error("Failed to reorder objectives");
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div className="mt-6 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Hidden metadata for SAM to detect the form */}
      <div 
        data-sam-form-metadata="learning-objectives"
        data-form-id="learning-objectives-form"
        data-form-purpose="learning-objectives"
        data-form-alternate-id="what-you-will-learn-form"
        data-form-type="array"
        data-entity-type="course"
        data-entity-id={courseId}
        data-current-value={JSON.stringify(initialData?.whatYouWillLearn || [])}
        data-field-name="whatYouWillLearn"
        data-field-type="array"
        data-array-item-type="string"
        style={{ display: 'none' }}
      />
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800 p-5">
        <div className="font-medium flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6" />
            <h3 className="text-xl font-semibold">Learning Objectives</h3>
          </div>
          <Button 
            onClick={handleAddObjective}
            variant="ghost" 
            className="text-white hover:bg-white/20 hover:text-white"
            disabled={isAdding || globalLoading}
          >
            {isAdding ? (
              <>Adding...</>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Objective
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className={cn("p-5", globalLoading && "opacity-60 pointer-events-none")}>
        {!fields.length ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Lightbulb className="h-14 w-14 text-amber-500 mb-3" />
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              No learning objectives defined yet
            </p>
            <Button 
              className="mt-5 bg-gradient-to-r from-indigo-500 to-purple-600 
                        hover:from-indigo-600 hover:to-purple-700 text-white text-base px-5 py-2 h-auto"
              onClick={handleAddObjective}
              disabled={isAdding}
            >
              Add your first objective
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <div className="space-y-5">
              {fields.map((field, index) => {
                const isEditing = field.isEditing;
                const isSaving = field.isSaving;
                const isNew = field.isNew;
                
                return (
                  <div 
                    key={field.id} 
                    className={cn(
                      "rounded-lg overflow-hidden border",
                      isEditing 
                        ? "border-indigo-300 dark:border-indigo-700 shadow-sm" 
                        : "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-between px-4 py-2",
                      isEditing
                        ? "bg-indigo-50 dark:bg-indigo-900/30"
                        : "bg-gray-50 dark:bg-gray-700/50"
                    )}>
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center 
                                      rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 
                                      dark:text-indigo-300 font-medium text-sm mr-2">
                          {index + 1}
                        </div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-200">
                          {isNew ? "New Objective" : "Learning Objective"}
                        </h4>
                      </div>
                      <div className="flex gap-1">
                        {!isEditing ? (
                          <>
                            <Button
                              type="button"
                              onClick={() => reorderObjective(index, 'up')}
                              variant="ghost"
                              size="sm"
                              disabled={index === 0 || globalLoading}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              onClick={() => reorderObjective(index, 'down')}
                              variant="ghost"
                              size="sm"
                              disabled={index === fields.length - 1 || globalLoading}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              onClick={() => toggleEditObjective(index)}
                              variant="ghost"
                              size="sm"
                              disabled={globalLoading}
                              className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => saveObjective(index)}
                            variant="ghost"
                            size="sm"
                            disabled={isSaving}
                            className="h-8 text-green-600 dark:text-green-400 px-2"
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          type="button"
                          onClick={() => deleteObjective(index)}
                          variant="ghost"
                          size="sm"
                          disabled={isSaving || globalLoading}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`whatYouWillLearn.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="m-0 p-0">
                          <FormControl>
                            {isEditing ? (
                              <div className="p-4 bg-white dark:bg-gray-800">
                                <textarea
                                  {...field}
                                  placeholder="Enter a learning objective..."
                                  disabled={isSaving}
                                  className="w-full min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 rounded-md 
                                          text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-800 focus:ring-2 
                                          focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none"
                                />
                              </div>
                            ) : (
                              <div className="p-4 bg-white dark:bg-gray-800">
                                <p 
                                  className="text-gray-800 dark:text-gray-100 text-base"
                                  dangerouslySetInnerHTML={{ __html: field.value }}
                                />
                              </div>
                            )}
                          </FormControl>
                          <FormMessage className="px-4 py-2 text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>
                );
              })}
            </div>
            
            <div className="space-y-4 mt-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200
                          border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 h-10 px-4
                          dark:hover:bg-indigo-900/50 text-sm font-medium"
                  onClick={handleAddObjective}
                  disabled={isAdding || globalLoading}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add objective
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200
                          border-amber-200 dark:border-amber-700 hover:bg-amber-100 h-10 px-4
                          dark:hover:bg-amber-900/50 text-sm font-medium"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  disabled={globalLoading}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {showSuggestions ? "Hide suggestions" : "Get suggestions"}
                </Button>
              </div>
              
              {showSuggestions && (
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 
                              rounded-lg p-4 mt-2">
                  <h4 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-3">
                    Suggested learning objectives
                  </h4>
                  <div className="space-y-2">
                    {SUGGESTED_OBJECTIVES.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => addSuggestion(suggestion)}
                        disabled={globalLoading}
                        className="w-full text-left text-sm px-4 py-3 rounded-md bg-white 
                                dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-600
                                text-gray-800 dark:text-gray-200 
                                transition-colors flex items-center gap-2 border border-gray-200 
                                dark:border-gray-600 disabled:opacity-50"
                      >
                        <PlusCircle className="h-4 w-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Form>
        )}
      </div>
    </div>
  );
};
