"use client";

/**
 * RubricBuilder
 *
 * AI-powered rubric creation tool for teachers to build assessment rubrics
 * with Bloom's Taxonomy alignment and customizable criteria.
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  FileText,
  Sparkles,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Save,
  Download,
  Copy,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Target,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Eye,
  Edit3,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface RubricBuilderProps {
  courseId?: string;
  examId?: string;
  questionId?: string;
  onSave?: (rubric: Rubric) => void;
  initialRubric?: Rubric | null;
  className?: string;
}

export interface Rubric {
  id?: string;
  title: string;
  description: string;
  totalPoints: number;
  scaleLevels: ScaleLevel[];
  criteria: RubricCriterion[];
  instructions: string[];
  bloomsAlignment?: Record<string, string[]>;
}

export interface ScaleLevel {
  name: string;
  range: string;
  description: string;
  color?: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  pointsRange: string;
  levels: {
    excellent: string;
    good: string;
    satisfactory: string;
    needsImprovement: string;
  };
  bloomsLevel?: string;
}

const DEFAULT_SCALE_LEVELS: ScaleLevel[] = [
  { name: "Excellent", range: "90-100", description: "Exceeds expectations", color: "emerald" },
  { name: "Good", range: "80-89", description: "Meets expectations", color: "blue" },
  { name: "Satisfactory", range: "70-79", description: "Approaches expectations", color: "amber" },
  { name: "Needs Improvement", range: "0-69", description: "Below expectations", color: "rose" },
];

const ASSIGNMENT_TYPES = [
  { value: "essay", label: "Essay / Written Assignment" },
  { value: "presentation", label: "Presentation" },
  { value: "project", label: "Project / Portfolio" },
  { value: "lab", label: "Lab Report" },
  { value: "discussion", label: "Discussion / Participation" },
  { value: "code", label: "Code / Programming" },
  { value: "creative", label: "Creative Work" },
  { value: "research", label: "Research Paper" },
  { value: "other", label: "Other" },
];

const BLOOMS_LEVELS = [
  { value: "REMEMBER", label: "Remember", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  { value: "UNDERSTAND", label: "Understand", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: "APPLY", label: "Apply", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: "ANALYZE", label: "Analyze", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { value: "EVALUATE", label: "Evaluate", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "CREATE", label: "Create", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

export function RubricBuilder({
  courseId,
  examId,
  questionId,
  onSave,
  initialRubric,
  className,
}: RubricBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Assignment input state
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentType, setAssignmentType] = useState("essay");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");

  // Rubric state
  const [rubric, setRubric] = useState<Rubric | null>(initialRubric || null);
  const [editingCriterion, setEditingCriterion] = useState<string | null>(null);

  const generateRubric = useCallback(async () => {
    if (!assignmentTitle.trim()) {
      toast.error("Please enter an assignment title");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/sam/ai-tutor/create-rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment: {
            title: assignmentTitle,
            type: assignmentType,
            description: assignmentDescription,
            objectives: learningObjectives,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate rubric");
      }

      const result = await response.json();

      if (result.rubric) {
        // Add IDs to criteria if not present
        const rubricWithIds: Rubric = {
          ...result.rubric,
          scaleLevels: result.rubric.scaleLevels || DEFAULT_SCALE_LEVELS,
          criteria: (result.rubric.criteria || []).map((c: RubricCriterion) => ({
            ...c,
            id: c.id || generateId(),
          })),
        };
        setRubric(rubricWithIds);
        toast.success("Rubric generated successfully!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate rubric";
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [assignmentTitle, assignmentType, assignmentDescription, learningObjectives]);

  const addCriterion = useCallback(() => {
    if (!rubric) return;

    const newCriterion: RubricCriterion = {
      id: generateId(),
      name: "New Criterion",
      description: "Description of what this criterion measures",
      weight: 20,
      pointsRange: "0-20",
      levels: {
        excellent: "Exceeds expectations",
        good: "Meets expectations",
        satisfactory: "Approaches expectations",
        needsImprovement: "Below expectations",
      },
    };

    setRubric({
      ...rubric,
      criteria: [...rubric.criteria, newCriterion],
    });
    setEditingCriterion(newCriterion.id);
  }, [rubric]);

  const updateCriterion = useCallback((id: string, updates: Partial<RubricCriterion>) => {
    if (!rubric) return;

    setRubric({
      ...rubric,
      criteria: rubric.criteria.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  }, [rubric]);

  const deleteCriterion = useCallback((id: string) => {
    if (!rubric) return;

    setRubric({
      ...rubric,
      criteria: rubric.criteria.filter((c) => c.id !== id),
    });
  }, [rubric]);

  const handleSave = useCallback(async () => {
    if (!rubric) return;

    setIsSaving(true);
    try {
      // Validate weights sum to ~100
      const totalWeight = rubric.criteria.reduce((sum, c) => sum + c.weight, 0);
      if (Math.abs(totalWeight - 100) > 5) {
        toast.warning(`Criteria weights sum to ${totalWeight}%. Consider adjusting to total 100%.`);
      }

      onSave?.(rubric);
      toast.success("Rubric saved successfully!");
      setIsOpen(false);
    } catch (err) {
      toast.error("Failed to save rubric");
    } finally {
      setIsSaving(false);
    }
  }, [rubric, onSave]);

  const exportRubric = useCallback((format: "json" | "csv") => {
    if (!rubric) return;

    if (format === "json") {
      const blob = new Blob([JSON.stringify(rubric, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${rubric.title.replace(/\s+/g, "_")}_rubric.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV format
      let csv = "Criterion,Weight,Excellent,Good,Satisfactory,Needs Improvement\n";
      rubric.criteria.forEach((c) => {
        csv += `"${c.name}",${c.weight}%,"${c.levels.excellent}","${c.levels.good}","${c.levels.satisfactory}","${c.levels.needsImprovement}"\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${rubric.title.replace(/\s+/g, "_")}_rubric.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success(`Rubric exported as ${format.toUpperCase()}`);
  }, [rubric]);

  const totalWeight = rubric?.criteria.reduce((sum, c) => sum + c.weight, 0) || 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className={cn(
            "gap-2 bg-gradient-to-r from-indigo-600 to-violet-600",
            "hover:from-indigo-500 hover:to-violet-500",
            "text-white shadow-sm",
            className
          )}
        >
          <FileText className="h-4 w-4" />
          Create Rubric
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                AI Rubric Builder
              </SheetTitle>
              <SheetDescription className="text-sm text-slate-500 dark:text-slate-400">
                Create assessment rubrics with AI assistance
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Step 1: Assignment Details */}
            {!rubric && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-indigo-500" />
                      Assignment Details
                    </CardTitle>
                    <CardDescription>
                      Describe your assignment and SAM will generate a tailored rubric
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Assignment Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Research Paper on Climate Change"
                        value={assignmentTitle}
                        onChange={(e) => setAssignmentTitle(e.target.value)}
                        className="border-slate-200 dark:border-slate-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Assignment Type</Label>
                      <Select value={assignmentType} onValueChange={setAssignmentType}>
                        <SelectTrigger className="border-slate-200 dark:border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the assignment requirements, expectations, and context..."
                        value={assignmentDescription}
                        onChange={(e) => setAssignmentDescription(e.target.value)}
                        className="min-h-[100px] border-slate-200 dark:border-slate-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="objectives">Learning Objectives</Label>
                      <Textarea
                        id="objectives"
                        placeholder="What should students learn or demonstrate? (one per line)"
                        value={learningObjectives}
                        onChange={(e) => setLearningObjectives(e.target.value)}
                        className="min-h-[80px] border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <Button
                  onClick={generateRubric}
                  disabled={isGenerating || !assignmentTitle.trim()}
                  className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Rubric...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate AI Rubric
                    </>
                  )}
                </Button>

                {error && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                    <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Rubric Editor */}
            {rubric && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Rubric Header */}
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Edit3 className="h-4 w-4 text-indigo-500" />
                        Rubric Details
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRubric(null)}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Start Over
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={rubric.title}
                        onChange={(e) => setRubric({ ...rubric, title: e.target.value })}
                        className="border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={rubric.description}
                        onChange={(e) => setRubric({ ...rubric, description: e.target.value })}
                        className="min-h-[60px] border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <Label>Total Points</Label>
                        <Input
                          type="number"
                          value={rubric.totalPoints}
                          onChange={(e) => setRubric({ ...rubric, totalPoints: parseInt(e.target.value) || 100 })}
                          className="border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="mb-2 block">Weight Distribution</Label>
                        <div className={cn(
                          "text-sm font-medium px-3 py-2 rounded-lg",
                          Math.abs(totalWeight - 100) <= 5
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                        )}>
                          {totalWeight}% / 100%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Scale Levels */}
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-indigo-500" />
                      Performance Levels
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      {rubric.scaleLevels.map((level, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "p-3 rounded-lg text-center border",
                            idx === 0 && "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
                            idx === 1 && "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
                            idx === 2 && "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
                            idx === 3 && "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800"
                          )}
                        >
                          <p className="text-xs font-medium text-slate-900 dark:text-white">
                            {level.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {level.range}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Criteria */}
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-indigo-500" />
                        Assessment Criteria
                        <Badge variant="secondary" className="ml-2">
                          {rubric.criteria.length}
                        </Badge>
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addCriterion}
                        className="gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Accordion type="single" collapsible className="space-y-2">
                      {rubric.criteria.map((criterion, idx) => (
                        <AccordionItem
                          key={criterion.id}
                          value={criterion.id}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <div className="flex items-center gap-3 flex-1">
                              <GripVertical className="h-4 w-4 text-slate-400" />
                              <span className="font-medium text-slate-900 dark:text-white">
                                {criterion.name}
                              </span>
                              <Badge variant="outline" className="ml-auto mr-2">
                                {criterion.weight}%
                              </Badge>
                              {criterion.bloomsLevel && (
                                <Badge className={cn(
                                  "text-xs",
                                  BLOOMS_LEVELS.find(b => b.value === criterion.bloomsLevel)?.color
                                )}>
                                  {criterion.bloomsLevel}
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-4">
                              {/* Criterion Details */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Criterion Name</Label>
                                  <Input
                                    value={criterion.name}
                                    onChange={(e) => updateCriterion(criterion.id, { name: e.target.value })}
                                    className="border-slate-200 dark:border-slate-700"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Weight (%)</Label>
                                  <div className="flex items-center gap-3">
                                    <Slider
                                      value={[criterion.weight]}
                                      min={5}
                                      max={50}
                                      step={5}
                                      onValueChange={([val]) => updateCriterion(criterion.id, { weight: val })}
                                      className="flex-1"
                                    />
                                    <span className="text-sm font-medium w-12 text-right">
                                      {criterion.weight}%
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={criterion.description}
                                  onChange={(e) => updateCriterion(criterion.id, { description: e.target.value })}
                                  className="min-h-[60px] border-slate-200 dark:border-slate-700"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Bloom&apos;s Level (Optional)</Label>
                                <Select
                                  value={criterion.bloomsLevel || ""}
                                  onValueChange={(val) => updateCriterion(criterion.id, { bloomsLevel: val || undefined })}
                                >
                                  <SelectTrigger className="border-slate-200 dark:border-slate-700">
                                    <SelectValue placeholder="Select level..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {BLOOMS_LEVELS.map((level) => (
                                      <SelectItem key={level.value} value={level.value}>
                                        <span className={cn("px-2 py-0.5 rounded text-xs", level.color)}>
                                          {level.label}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Level Descriptors */}
                              <div className="space-y-3">
                                <Label>Level Descriptors</Label>
                                <div className="space-y-2">
                                  {[
                                    { key: "excellent", label: "Excellent", color: "emerald" },
                                    { key: "good", label: "Good", color: "blue" },
                                    { key: "satisfactory", label: "Satisfactory", color: "amber" },
                                    { key: "needsImprovement", label: "Needs Improvement", color: "rose" },
                                  ].map(({ key, label, color }) => (
                                    <div key={key} className="flex items-start gap-2">
                                      <Badge
                                        className={cn(
                                          "mt-2 text-xs shrink-0 w-28 justify-center",
                                          `bg-${color}-100 text-${color}-700 dark:bg-${color}-900/30 dark:text-${color}-400`
                                        )}
                                      >
                                        {label}
                                      </Badge>
                                      <Textarea
                                        value={criterion.levels[key as keyof typeof criterion.levels]}
                                        onChange={(e) =>
                                          updateCriterion(criterion.id, {
                                            levels: { ...criterion.levels, [key]: e.target.value },
                                          })
                                        }
                                        className="min-h-[50px] text-sm border-slate-200 dark:border-slate-700"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Delete Button */}
                              <div className="flex justify-end pt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteCriterion(criterion.id)}
                                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete Criterion
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>

                {/* Instructions */}
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-indigo-500" />
                      Instructions for Evaluators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={rubric.instructions?.join("\n") || ""}
                      onChange={(e) =>
                        setRubric({
                          ...rubric,
                          instructions: e.target.value.split("\n").filter((l) => l.trim()),
                        })
                      }
                      placeholder="Add instructions for evaluators (one per line)"
                      className="min-h-[100px] border-slate-200 dark:border-slate-700"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        {rubric && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="gap-1"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => exportRubric("json")}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export JSON</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => exportRubric("csv")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export CSV</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex-1" />
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Rubric
            </Button>
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle>{rubric?.title || "Rubric Preview"}</DialogTitle>
              <DialogDescription>{rubric?.description}</DialogDescription>
            </DialogHeader>
            {rubric && (
              <div className="space-y-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Total Points: {rubric.totalPoints}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left p-3 font-medium">Criterion</th>
                        <th className="text-center p-3 font-medium text-emerald-600">Excellent</th>
                        <th className="text-center p-3 font-medium text-blue-600">Good</th>
                        <th className="text-center p-3 font-medium text-amber-600">Satisfactory</th>
                        <th className="text-center p-3 font-medium text-rose-600">Needs Improvement</th>
                        <th className="text-center p-3 font-medium">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rubric.criteria.map((c) => (
                        <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="p-3">
                            <div className="font-medium text-slate-900 dark:text-white">{c.name}</div>
                            <div className="text-xs text-slate-500 mt-1">{c.description}</div>
                          </td>
                          <td className="p-3 text-xs text-slate-600 dark:text-slate-400">{c.levels.excellent}</td>
                          <td className="p-3 text-xs text-slate-600 dark:text-slate-400">{c.levels.good}</td>
                          <td className="p-3 text-xs text-slate-600 dark:text-slate-400">{c.levels.satisfactory}</td>
                          <td className="p-3 text-xs text-slate-600 dark:text-slate-400">{c.levels.needsImprovement}</td>
                          <td className="p-3 text-center font-medium">{c.weight}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rubric.instructions && rubric.instructions.length > 0 && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-2">Instructions</h4>
                    <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      {rubric.instructions.map((instruction, idx) => (
                        <li key={idx}>• {instruction}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
