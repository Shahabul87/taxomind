"use client";

import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Users, Lock, Globe, UserPlus, Image as ImageIcon, 
  Camera, Sparkles, Upload, X, Plus, Hash, FileText, 
  Book, Calendar, Megaphone, Check, MapPin, School
} from "lucide-react";
import { z } from "zod";
import Image from 'next/image';
import { FileUpload } from "@/components/file-upload";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Please provide a meaningful description (minimum 10 characters)"),
  imageUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  category: z.string(),
  categoryId: z.string().optional(),
  privacy: z.enum(["public", "private", "invite-only"]),
  isPrivate: z.boolean().default(false),
  rules: z.array(z.string()),
  tags: z.array(z.string()),
  courseId: z.string().optional(),
  location: z.string().optional(),
  isOnline: z.boolean().default(false),
  meetUrl: z.string().optional(),
  allowJoinRequests: z.boolean().default(true),
  autoApproveMembers: z.boolean().default(false),
});

interface CreateGroupFormProps {
  userId: string | undefined;
  enrolledCourses: any[];
  categories?: any[];
  courses?: any[];
}

export const CreateGroupForm = ({ userId, enrolledCourses, categories = [], courses = [] }: CreateGroupFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState("basics");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      coverImageUrl: "",
      category: "general",
      categoryId: "",
      privacy: "public",
      isPrivate: false,
      rules: [],
      tags: [],
      courseId: "none",
      location: "",
      isOnline: false,
      meetUrl: "",
      allowJoinRequests: true,
      autoApproveMembers: false,
    },
  });

  if (!userId) return null;  // Early return if no userId

  const addTag = () => {
    if (newTag && newTag.trim() !== "" && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      form.setValue("tags", updatedTags);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    form.setValue("tags", updatedTags);
  };

  const addRule = () => {
    if (newRule && newRule.trim() !== "" && !rules.includes(newRule.trim())) {
      const updatedRules = [...rules, newRule.trim()];
      setRules(updatedRules);
      form.setValue("rules", updatedRules);
      setNewRule("");
    }
  };

  const removeRule = (ruleToRemove: string) => {
    const updatedRules = rules.filter(rule => rule !== ruleToRemove);
    setRules(updatedRules);
    form.setValue("rules", updatedRules);
  };

  const handlePrivacyChange = (value: string) => {
    form.setValue("privacy", value as "public" | "private" | "invite-only");
    
    // Update isPrivate field based on privacy setting
    if (value === "public") {
      form.setValue("isPrivate", false);
    } else {
      form.setValue("isPrivate", true);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Filter out "none" courseId and convert to null
      const payload = {
        ...values,
        courseId: values.courseId === "none" ? null : values.courseId,
      };

      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error:", errorData);
        throw new Error("Failed to create group");
      }

      const group = await response.json();
      toast.success("Group created successfully!");
      router.push(`/groups/${group.id}`);
    } catch (error: any) {
      console.error("Group creation error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 sm:px-6 py-6 sm:py-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(white,transparent)] bg-grid-pattern"></div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 relative z-10 leading-tight">Create Your Study Community</h1>
        <p className="text-white/80 max-w-2xl relative z-10 text-sm sm:text-base leading-relaxed">
          Design a collaborative space where knowledge flourishes and connections thrive
        </p>
      </div>

      <Tabs defaultValue="basics" className="w-full" onValueChange={setCurrentTab}>
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <TabsList className="w-full grid grid-cols-4 mb-4 sm:mb-6 min-w-[600px] sm:min-w-0">
            <TabsTrigger value="basics" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-900 dark:data-[state=active]:bg-violet-900/20 dark:data-[state=active]:text-violet-300 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Basics</span>
              <span className="xs:hidden">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-900 dark:data-[state=active]:bg-violet-900/20 dark:data-[state=active]:text-violet-300 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5">
              <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Appearance</span>
              <span className="sm:hidden">Image</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-900 dark:data-[state=active]:bg-violet-900/20 dark:data-[state=active]:text-violet-300 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Privacy & Rules</span>
              <span className="sm:hidden">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="course" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-900 dark:data-[state=active]:bg-violet-900/20 dark:data-[state=active]:text-violet-300 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5">
              <Book className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Course
            </TabsTrigger>
          </TabsList>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
            <TabsContent value="basics" className="space-y-4 sm:space-y-6 mt-0">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 dark:text-gray-100 font-semibold text-sm sm:text-base flex items-center gap-2">
                        <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        Group Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter a descriptive name for your group"
                          disabled={isSubmitting}
                          className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus-visible:ring-violet-500 focus-visible:border-violet-500 h-10 sm:h-11 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                      </FormControl>
                      <FormDescription className="text-violet-600/70 dark:text-violet-400/70 text-xs sm:text-sm font-medium">
                        Choose a name that clearly describes your group&apos;s purpose
                      </FormDescription>
                      <FormMessage className="text-red-500 dark:text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 dark:text-gray-100 font-semibold text-sm sm:text-base flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe what your group is about, its goals, and who should join..."
                          disabled={isSubmitting}
                          className="resize-none min-h-[100px] sm:min-h-[120px] bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription className="text-indigo-600/70 dark:text-indigo-400/70 text-xs sm:text-sm font-medium">
                        This description will help potential members understand your group&apos;s purpose and activities
                      </FormDescription>
                      <FormMessage className="text-red-500 dark:text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 p-4 sm:p-5 rounded-lg border border-purple-100 dark:border-purple-900/30">
                  <FormLabel className="text-gray-800 dark:text-gray-100 font-semibold block text-sm sm:text-base flex items-center gap-2">
                    <Hash className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Add Tags
                  </FormLabel>
                  <FormDescription className="text-purple-700/80 dark:text-purple-300/80 text-xs sm:text-sm font-medium">
                    Add keywords that represent your group&apos;s topics and interests
                  </FormDescription>
                  
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      disabled={isSubmitting}
                      className="bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500 focus-visible:border-purple-500 flex-1 h-10 sm:h-11 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTag}
                      disabled={isSubmitting}
                      className="border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 h-10 sm:h-11 px-3 sm:px-4 font-medium"
                    >
                      <Plus className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Add</span>
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="py-1.5 px-3 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 dark:from-purple-900/40 dark:to-indigo-900/40 dark:text-purple-200 group flex items-center border border-purple-200 dark:border-purple-800 shadow-sm"
                      >
                        <Hash className="w-3 h-3 mr-1.5 text-purple-600 dark:text-purple-400" />
                        <span className="font-medium">{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 focus:outline-none transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {tags.length === 0 && (
                      <p className="text-sm text-purple-600/60 dark:text-purple-400/60 italic">No tags added yet</p>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 dark:text-gray-100 font-semibold text-sm sm:text-base flex items-center gap-2">
                        <Book className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Category
                      </FormLabel>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800 focus:ring-blue-500 focus:border-blue-500 h-10 sm:h-11 text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                          <SelectItem value="general" className="text-gray-900 dark:text-gray-100">General</SelectItem>
                          <SelectItem value="technology" className="text-gray-900 dark:text-gray-100">Technology</SelectItem>
                          <SelectItem value="programming" className="text-gray-900 dark:text-gray-100">Programming</SelectItem>
                          <SelectItem value="data-science" className="text-gray-900 dark:text-gray-100">Data Science</SelectItem>
                          <SelectItem value="mathematics" className="text-gray-900 dark:text-gray-100">Mathematics</SelectItem>
                          <SelectItem value="science" className="text-gray-900 dark:text-gray-100">Science</SelectItem>
                          <SelectItem value="language" className="text-gray-900 dark:text-gray-100">Languages</SelectItem>
                          <SelectItem value="humanities" className="text-gray-900 dark:text-gray-100">Humanities</SelectItem>
                          <SelectItem value="business" className="text-gray-900 dark:text-gray-100">Business</SelectItem>
                          <SelectItem value="gaming" className="text-gray-900 dark:text-gray-100">Gaming</SelectItem>
                          <SelectItem value="art" className="text-gray-900 dark:text-gray-100">Art & Design</SelectItem>
                          <SelectItem value="music" className="text-gray-900 dark:text-gray-100">Music</SelectItem>
                          <SelectItem value="health" className="text-gray-900 dark:text-gray-100">Health & Medicine</SelectItem>
                          <SelectItem value="other" className="text-gray-900 dark:text-gray-100">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-blue-600/70 dark:text-blue-400/70 text-xs sm:text-sm font-medium">
                        Choose a category that best represents your group&apos;s focus
                      </FormDescription>
                      <FormMessage className="text-red-500 dark:text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-800 dark:text-gray-100 font-semibold text-sm sm:text-base flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          Location (Optional)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              placeholder="e.g., New York, Online, etc."
                              disabled={isSubmitting}
                              className="bg-white dark:bg-gray-900 border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 pl-9 h-10 sm:h-11 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            />
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                          </div>
                        </FormControl>
                        <FormDescription className="text-emerald-600/70 dark:text-emerald-400/70 text-xs sm:text-sm font-medium">
                          Where your group primarily meets or is based
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isOnline"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border border-cyan-200 dark:border-cyan-800 p-3 sm:p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20">
                        <div className="space-y-0.5 flex-1">
                          <FormLabel className="text-gray-800 dark:text-gray-100 font-semibold text-sm sm:text-base flex items-center gap-2">
                            <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            Online Community
                          </FormLabel>
                          <FormDescription className="text-cyan-700/80 dark:text-cyan-300/80 text-xs sm:text-sm font-medium">
                            Primarily meets in virtual spaces
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                            className="data-[state=checked]:bg-cyan-600"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4 sm:space-y-6 mt-0">
              <div className="grid grid-cols-1 gap-6 sm:gap-8">
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 p-4 sm:p-6 rounded-lg border border-pink-100 dark:border-pink-900/30">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    Group Profile Image
                  </h3>
                  <p className="text-xs sm:text-sm text-pink-700/80 dark:text-pink-300/80 mb-4 font-medium">
                    This image will be displayed as your group&apos;s avatar
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex flex-col items-center">
                            <div className="mb-4 relative group">
                              <div className={cn(
                                "w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center overflow-hidden border-2",
                                field.value 
                                  ? "border-violet-300 dark:border-violet-700" 
                                  : "border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                              )}>
                                {field.value ? (
                                  <Image
                                    src={field.value}
                                    alt="Group profile"
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                                )}
                              </div>
                              
                              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity cursor-pointer">
                                <FileUpload
                                  endpoint="groupImage"
                                  onChange={(url) => {
                                    if (url) {
                                      field.onChange(url);
                                    }
                                  }}
                                >
                                  <div className="flex flex-col items-center justify-center cursor-pointer p-2">
                                    <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    <span className="text-[10px] sm:text-xs text-white mt-1">
                                      {field.value ? "Change" : "Upload"}
                                    </span>
                                  </div>
                                </FileUpload>
                              </div>
                            </div>
                            
                            {field.value && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => field.onChange("")}
                                className="text-red-500 hover:text-red-600 text-xs flex items-center h-8 sm:h-9"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Remove Image
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 dark:text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 sm:p-6 rounded-lg border border-amber-100 dark:border-amber-900/30">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    Group Cover Image
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-700/80 dark:text-amber-300/80 mb-4 font-medium">
                    This image will appear at the top of your group page
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="coverImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex flex-col">
                            <div className="mb-4 relative group">
                              <div className={cn(
                                "w-full h-40 sm:h-48 rounded-lg flex items-center justify-center overflow-hidden border-2",
                                field.value 
                                  ? "border-violet-300 dark:border-violet-700" 
                                  : "border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                              )}>
                                {field.value ? (
                                  <Image
                                    src={field.value}
                                    alt="Group cover"
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center text-gray-400 px-4">
                                    <ImageIcon className="h-8 w-8 sm:h-12 sm:w-12 mb-2" />
                                    <span className="text-xs sm:text-sm text-center">No cover image uploaded</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity cursor-pointer">
                                <FileUpload
                                  endpoint="groupCover"
                                  onChange={(url) => {
                                    if (url) {
                                      field.onChange(url);
                                    }
                                  }}
                                >
                                  <div className="flex flex-col items-center justify-center cursor-pointer p-2">
                                    <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    <span className="text-xs sm:text-sm text-white mt-1 text-center">
                                      {field.value ? "Change Cover" : "Upload Cover"}
                                    </span>
                                  </div>
                                </FileUpload>
                              </div>
                            </div>
                            
                            {field.value && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => field.onChange("")}
                                className="text-red-500 hover:text-red-600 text-xs self-end flex items-center h-8 sm:h-9"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Remove Cover
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 dark:text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-indigo-950/30 p-4 sm:p-5 rounded-lg border border-violet-200 dark:border-violet-800/40 shadow-sm">
                  <div className="flex items-start">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600 dark:text-violet-400 mr-3 sm:mr-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-violet-900 dark:text-violet-200 mb-1">Pro Tip</h3>
                      <p className="text-xs sm:text-sm text-violet-800/90 dark:text-violet-300/90 mt-1 leading-relaxed font-medium">
                        High-quality images help your group stand out and attract more members. Use images that 
                        represent your group&apos;s theme, purpose, or community spirit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 sm:space-y-6 mt-0">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    Privacy Settings
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700/80 dark:text-slate-300/80 mb-4 font-medium">
                    Control who can join your group and view its content
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <Card className={cn(
                      "border rounded-lg overflow-hidden cursor-pointer transition-all active:scale-[0.98]",
                      form.watch("privacy") === "public"
                        ? "border-violet-500 ring-1 ring-violet-500 dark:border-violet-500 dark:ring-violet-500"
                        : "border-gray-200 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800"
                    )} 
                    onClick={() => handlePrivacyChange("public")}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                          <Globe className={cn(
                            "h-7 w-7 sm:h-8 sm:w-8 p-1.5 rounded-full",
                            form.watch("privacy") === "public"
                              ? "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          )} />
                          {form.watch("privacy") === "public" && (
                            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
                          )}
                        </div>
                        <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-1">Public</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          Anyone can find and join your group. All content is visible to non-members.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className={cn(
                      "border rounded-lg overflow-hidden cursor-pointer transition-all active:scale-[0.98]",
                      form.watch("privacy") === "private"
                        ? "border-violet-500 ring-1 ring-violet-500 dark:border-violet-500 dark:ring-violet-500"
                        : "border-gray-200 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800"
                    )} 
                    onClick={() => handlePrivacyChange("private")}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                          <Lock className={cn(
                            "h-7 w-7 sm:h-8 sm:w-8 p-1.5 rounded-full",
                            form.watch("privacy") === "private"
                              ? "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          )} />
                          {form.watch("privacy") === "private" && (
                            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
                          )}
                        </div>
                        <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-1">Private</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          Visible in search but only members can view content. Users must request to join.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className={cn(
                      "border rounded-lg overflow-hidden cursor-pointer transition-all active:scale-[0.98]",
                      form.watch("privacy") === "invite-only"
                        ? "border-violet-500 ring-1 ring-violet-500 dark:border-violet-500 dark:ring-violet-500"
                        : "border-gray-200 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800"
                    )} 
                    onClick={() => handlePrivacyChange("invite-only")}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                          <UserPlus className={cn(
                            "h-7 w-7 sm:h-8 sm:w-8 p-1.5 rounded-full",
                            form.watch("privacy") === "invite-only"
                              ? "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          )} />
                          {form.watch("privacy") === "invite-only" && (
                            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
                          )}
                        </div>
                        <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-1">Invite Only</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          Hidden from search. New members can only join by invitation from existing members.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {form.watch("privacy") !== "invite-only" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="allowJoinRequests"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 rounded-md border border-teal-200 dark:border-teal-800 p-3 sm:p-4 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting}
                              className="data-[state=checked]:bg-teal-600"
                            />
                          </FormControl>
                          <div className="space-y-1 flex-1">
                            <FormLabel className="text-gray-800 dark:text-gray-100 font-semibold text-sm sm:text-base flex items-center gap-2">
                              <UserPlus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              Allow Join Requests
                            </FormLabel>
                            <FormDescription className="text-teal-700/80 dark:text-teal-300/80 text-xs sm:text-sm font-medium">
                              Let users request to join your group
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="autoApproveMembers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 rounded-md border border-emerald-200 dark:border-emerald-800 p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting || !form.watch("allowJoinRequests")}
                              className="data-[state=checked]:bg-emerald-600"
                            />
                          </FormControl>
                          <div className="space-y-1 flex-1">
                            <FormLabel className={cn(
                              "font-semibold text-sm sm:text-base flex items-center gap-2",
                              form.watch("allowJoinRequests") 
                                ? "text-gray-800 dark:text-gray-100" 
                                : "text-gray-400 dark:text-gray-500"
                            )}>
                              <Check className={cn(
                                "w-4 h-4",
                                form.watch("allowJoinRequests")
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-gray-400 dark:text-gray-500"
                              )} />
                              Auto-Approve Members
                            </FormLabel>
                            <FormDescription className={cn(
                              "text-xs sm:text-sm font-medium",
                              form.watch("allowJoinRequests") 
                                ? "text-emerald-700/80 dark:text-emerald-300/80" 
                                : "text-gray-400 dark:text-gray-500"
                            )}>
                              Automatically approve all join requests
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <Separator className="my-2" />

                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 p-4 sm:p-5 rounded-lg border border-orange-100 dark:border-orange-900/30">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    Group Rules
                  </h3>
                  <p className="text-xs sm:text-sm text-orange-700/80 dark:text-orange-300/80 mb-4 font-medium">
                    Set clear guidelines for members to follow
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newRule}
                        onChange={(e) => setNewRule(e.target.value)}
                        placeholder="Add a rule..."
                        disabled={isSubmitting}
                        className="bg-white dark:bg-gray-900 border-orange-200 dark:border-orange-800 focus-visible:ring-orange-500 focus-visible:border-orange-500 flex-1 h-10 sm:h-11 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addRule();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addRule}
                        disabled={isSubmitting}
                        className="border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40 h-10 sm:h-11 px-3 sm:px-4 font-medium"
                      >
                        <Plus className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Add</span>
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {rules.length > 0 ? (
                        rules.map((rule, index) => (
                          <div 
                            key={index} 
                            className="flex items-start group p-3 bg-white dark:bg-gray-900 rounded-md border border-orange-200 dark:border-orange-800 shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="mr-3 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 text-orange-700 dark:text-orange-300 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-xs font-bold border border-orange-200 dark:border-orange-800">
                              {index + 1}
                            </div>
                            <div className="flex-1 text-gray-800 dark:text-gray-100 text-sm font-medium leading-relaxed">
                              {rule}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeRule(rule)}
                              className="opacity-0 group-hover:opacity-100 text-orange-500 hover:text-red-600 dark:text-orange-400 dark:hover:text-red-400 focus:outline-none transition-opacity ml-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 bg-white dark:bg-gray-900 rounded-md border border-dashed border-orange-200 dark:border-orange-800">
                          <p className="text-orange-600/70 dark:text-orange-400/70 text-sm font-medium italic">
                            No rules added yet. Good rules help maintain a positive community.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="course" className="space-y-4 sm:space-y-6 mt-0">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-4 sm:p-5 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <School className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Connect to Course
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-700/80 dark:text-blue-300/80 mb-4 font-medium">
                    Optionally link this group to one of your enrolled courses
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          disabled={isSubmitting}
                          onValueChange={field.onChange}
                          defaultValue={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800 focus:ring-blue-500 focus:border-blue-500 h-10 sm:h-11 text-gray-900 dark:text-gray-100">
                              <SelectValue placeholder="Select a course (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                            <SelectItem value="none">
                              <span className="text-gray-500 dark:text-gray-400">Not connected to any course</span>
                            </SelectItem>
                            
                            {enrolledCourses.length > 0 ? (
                              enrolledCourses.map((course) => (
                                <SelectItem key={course.id} value={course.id} className="text-gray-900 dark:text-gray-100">
                                  <div className="flex items-center">
                                    {course.imageUrl ? (
                                      <div className="w-6 h-6 mr-2 rounded overflow-hidden flex-shrink-0">
                                        <Image 
                                          src={course.imageUrl}
                                          alt={course.title}
                                          width={24}
                                          height={24}
                                          className="object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <School className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                                    )}
                                    <span className="truncate max-w-[200px] font-medium">{course.title}</span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-4 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  You&apos;re not enrolled in any courses
                                </p>
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-blue-600/70 dark:text-blue-400/70 text-xs sm:text-sm font-medium mt-2">
                          Linking to a course helps classmates find your study group
                        </FormDescription>
                        <FormMessage className="text-red-500 dark:text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("courseId") && form.watch("courseId") !== "none" && (
                  <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30 p-4 sm:p-5 rounded-lg border border-blue-200 dark:border-blue-800/40 shadow-sm">
                    <div className="flex">
                      <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 mr-3 sm:mr-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-blue-900 dark:text-blue-200 mb-2">Course Connection Benefits</h3>
                        <ul className="text-xs sm:text-sm text-blue-800/90 dark:text-blue-300/90 mt-2 space-y-2 list-none">
                          <li className="flex items-start">
                            <Check className="w-4 h-4 mr-2 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="font-medium">Your group will be highlighted for others taking the same course</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="w-4 h-4 mr-2 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="font-medium">Course materials and resources can be easily shared</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="w-4 h-4 mr-2 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="font-medium">Students from the same course can find your group more easily</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-4">
                    <Calendar className="w-5 h-5 text-violet-500 dark:text-violet-400 mr-2" />
                    <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Group Creation Timeline</h3>
                  </div>
                  
                  <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-6">
                    <li className="ml-6">
                      <div className="absolute -left-3 mt-1.5 h-6 w-6 rounded-full border border-white dark:border-gray-900 bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <Check className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Create Your Group</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Fill in the details and customize settings
                      </p>
                    </li>
                    
                    <li className="ml-6">
                      <div className="absolute -left-3 mt-1.5 h-6 w-6 rounded-full border border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="h-3 w-3 rounded-full bg-gray-400 dark:bg-gray-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Invite Members</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Share your group with classmates and friends
                      </p>
                    </li>
                    
                    <li className="ml-6">
                      <div className="absolute -left-3 mt-1.5 h-6 w-6 rounded-full border border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="h-3 w-3 rounded-full bg-gray-400 dark:bg-gray-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Start Discussions</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Create topics and share resources with your community
                      </p>
                    </li>
                  </ol>
                </div>
              </div>
            </TabsContent>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-10 sm:h-11"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 h-10 sm:h-11 font-semibold"
              >
                {isSubmitting ? "Creating..." : "Create Study Group"}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </motion.div>
  );
}; 