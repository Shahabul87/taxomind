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
}

export const CreateGroupForm = ({ userId, enrolledCourses }: CreateGroupFormProps) => {
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
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      const group = await response.json();
      toast.success("Group created successfully!");
      router.push(`/groups/${group.id}`);
    } catch (error) {
      toast.error("Something went wrong");
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
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(white,transparent)] bg-grid-pattern"></div>
        <h1 className="text-3xl font-bold mb-2 relative z-10">Create Your Study Community</h1>
        <p className="text-white/80 max-w-2xl relative z-10">
          Design a collaborative space where knowledge flourishes and connections thrive
        </p>
      </div>

      <Tabs defaultValue="basics" className="w-full" onValueChange={setCurrentTab}>
        <div className="px-6 pt-6 border-b border-gray-200 dark:border-gray-700">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="basics" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-900 dark:data-[state=active]:bg-violet-900/20 dark:data-[state=active]:text-violet-300">
              <FileText className="w-4 h-4 mr-2" />
              Basics
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-900 dark:data-[state=active]:bg-violet-900/20 dark:data-[state=active]:text-violet-300">
              <ImageIcon className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-900 dark:data-[state=active]:bg-violet-900/20 dark:data-[state=active]:text-violet-300">
              <Lock className="w-4 h-4 mr-2" />
              Privacy & Rules
            </TabsTrigger>
            <TabsTrigger value="course" className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-900 dark:data-[state=active]:bg-violet-900/20 dark:data-[state=active]:text-violet-300">
              <Book className="w-4 h-4 mr-2" />
              Course
            </TabsTrigger>
          </TabsList>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-8 space-y-8">
            <TabsContent value="basics" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">
                        Group Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter a descriptive name for your group"
                          disabled={isSubmitting}
                          className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus-visible:ring-violet-500"
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500 dark:text-gray-400 text-sm">
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
                      <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe what your group is about, its goals, and who should join..."
                          disabled={isSubmitting}
                          className="resize-none min-h-[120px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus-visible:ring-violet-500"
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription className="text-gray-500 dark:text-gray-400 text-sm">
                        This description will help potential members understand your group&apos;s purpose and activities
                      </FormDescription>
                      <FormMessage className="text-red-500 dark:text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormLabel className="text-gray-700 dark:text-gray-200 font-medium block">
                    Add Tags
                  </FormLabel>
                  <FormDescription className="text-gray-500 dark:text-gray-400 text-sm">
                    Add keywords that represent your group&apos;s topics and interests
                  </FormDescription>
                  
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      disabled={isSubmitting}
                      className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus-visible:ring-violet-500"
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
                      className="border-gray-200 dark:border-gray-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="py-1.5 bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-300 group flex items-center"
                      >
                        <Hash className="w-3 h-3 mr-1" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-violet-500 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 focus:outline-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {tags.length === 0 && (
                      <p className="text-sm text-gray-400 dark:text-gray-500">No tags added yet</p>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">
                        Category
                      </FormLabel>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-violet-500">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="programming">Programming</SelectItem>
                          <SelectItem value="data-science">Data Science</SelectItem>
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                          <SelectItem value="language">Languages</SelectItem>
                          <SelectItem value="humanities">Humanities</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="gaming">Gaming</SelectItem>
                          <SelectItem value="art">Art & Design</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="health">Health & Medicine</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-gray-500 dark:text-gray-400 text-sm">
                        Choose a category that best represents your group&apos;s focus
                      </FormDescription>
                      <FormMessage className="text-red-500 dark:text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">
                          Location (Optional)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              placeholder="e.g., New York, Online, etc."
                              disabled={isSubmitting}
                              className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus-visible:ring-violet-500 pl-9"
                            />
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          </div>
                        </FormControl>
                        <FormDescription className="text-gray-500 dark:text-gray-400 text-sm">
                          Where your group primarily meets or is based
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isOnline"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">
                            Online Community
                          </FormLabel>
                          <FormDescription className="text-gray-500 dark:text-gray-400 text-sm">
                            Primarily meets in virtual spaces
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Group Profile Image</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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
                                "w-32 h-32 rounded-full flex items-center justify-center overflow-hidden border-2",
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
                                  <Users className="h-12 w-12 text-gray-400" />
                                )}
                              </div>
                              
                              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <FileUpload
                                  endpoint="groupImage"
                                  onChange={(url) => {
                                    if (url) {
                                      field.onChange(url);
                                    }
                                  }}
                                >
                                  <div className="flex flex-col items-center justify-center cursor-pointer">
                                    <Camera className="h-6 w-6 text-white" />
                                    <span className="text-xs text-white mt-1">
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
                                className="text-red-500 hover:text-red-600 text-xs flex items-center"
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

                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Group Cover Image</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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
                                "w-full h-48 rounded-lg flex items-center justify-center overflow-hidden border-2",
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
                                  <div className="flex flex-col items-center text-gray-400">
                                    <ImageIcon className="h-12 w-12 mb-2" />
                                    <span className="text-sm">No cover image uploaded</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <FileUpload
                                  endpoint="groupCover"
                                  onChange={(url) => {
                                    if (url) {
                                      field.onChange(url);
                                    }
                                  }}
                                >
                                  <div className="flex flex-col items-center justify-center cursor-pointer">
                                    <Upload className="h-6 w-6 text-white" />
                                    <span className="text-sm text-white mt-1">
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
                                className="text-red-500 hover:text-red-600 text-xs self-end flex items-center"
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

                <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-lg border border-violet-100 dark:border-violet-800/30">
                  <div className="flex items-start">
                    <Sparkles className="w-6 h-6 text-violet-500 dark:text-violet-400 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-violet-800 dark:text-violet-300">Pro Tip</h3>
                      <p className="text-sm text-violet-700/80 dark:text-violet-400/80 mt-1">
                        High-quality images help your group stand out and attract more members. Use images that 
                        represent your group&apos;s theme, purpose, or community spirit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Privacy Settings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Control who can join your group and view its content
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className={cn(
                      "border rounded-lg overflow-hidden cursor-pointer transition-all",
                      form.watch("privacy") === "public"
                        ? "border-violet-500 ring-1 ring-violet-500 dark:border-violet-500 dark:ring-violet-500"
                        : "border-gray-200 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800"
                    )} 
                    onClick={() => handlePrivacyChange("public")}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <Globe className={cn(
                            "h-8 w-8 p-1.5 rounded-full",
                            form.watch("privacy") === "public"
                              ? "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          )} />
                          {form.watch("privacy") === "public" && (
                            <Check className="h-5 w-5 text-violet-500" />
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Public</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Anyone can find and join your group. All content is visible to non-members.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className={cn(
                      "border rounded-lg overflow-hidden cursor-pointer transition-all",
                      form.watch("privacy") === "private"
                        ? "border-violet-500 ring-1 ring-violet-500 dark:border-violet-500 dark:ring-violet-500"
                        : "border-gray-200 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800"
                    )} 
                    onClick={() => handlePrivacyChange("private")}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <Lock className={cn(
                            "h-8 w-8 p-1.5 rounded-full",
                            form.watch("privacy") === "private"
                              ? "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          )} />
                          {form.watch("privacy") === "private" && (
                            <Check className="h-5 w-5 text-violet-500" />
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Private</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Visible in search but only members can view content. Users must request to join.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className={cn(
                      "border rounded-lg overflow-hidden cursor-pointer transition-all",
                      form.watch("privacy") === "invite-only"
                        ? "border-violet-500 ring-1 ring-violet-500 dark:border-violet-500 dark:ring-violet-500"
                        : "border-gray-200 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800"
                    )} 
                    onClick={() => handlePrivacyChange("invite-only")}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <UserPlus className={cn(
                            "h-8 w-8 p-1.5 rounded-full",
                            form.watch("privacy") === "invite-only"
                              ? "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          )} />
                          {form.watch("privacy") === "invite-only" && (
                            <Check className="h-5 w-5 text-violet-500" />
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Invite Only</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Hidden from search. New members can only join by invitation from existing members.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {form.watch("privacy") !== "invite-only" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="allowJoinRequests"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/50">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">
                              Allow Join Requests
                            </FormLabel>
                            <FormDescription className="text-gray-500 dark:text-gray-400 text-sm">
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
                        <FormItem className="flex flex-row items-start space-x-3 rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/50">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting || !form.watch("allowJoinRequests")}
                            />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className={cn(
                              "font-medium",
                              form.watch("allowJoinRequests") 
                                ? "text-gray-700 dark:text-gray-200" 
                                : "text-gray-400 dark:text-gray-500"
                            )}>
                              Auto-Approve Members
                            </FormLabel>
                            <FormDescription className={cn(
                              "text-sm",
                              form.watch("allowJoinRequests") 
                                ? "text-gray-500 dark:text-gray-400" 
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

                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Group Rules</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Set clear guidelines for members to follow
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newRule}
                        onChange={(e) => setNewRule(e.target.value)}
                        placeholder="Add a rule..."
                        disabled={isSubmitting}
                        className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus-visible:ring-violet-500"
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
                        className="border-gray-200 dark:border-gray-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {rules.length > 0 ? (
                        rules.map((rule, index) => (
                          <div 
                            key={index} 
                            className="flex items-start group p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-100 dark:border-gray-700"
                          >
                            <div className="mr-2 bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1 text-gray-700 dark:text-gray-200 text-sm">
                              {rule}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeRule(rule)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 focus:outline-none transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-dashed border-gray-200 dark:border-gray-700">
                          <p className="text-gray-400 dark:text-gray-500 text-sm">
                            No rules added yet. Good rules help maintain a positive community.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="course" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Connect to Course</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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
                            <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-violet-500">
                              <SelectValue placeholder="Select a course (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                            <SelectItem value="none">
                              <span className="text-gray-500 dark:text-gray-400">Not connected to any course</span>
                            </SelectItem>
                            
                            {enrolledCourses.length > 0 ? (
                              enrolledCourses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
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
                                      <School className="w-5 h-5 mr-2 text-violet-500 dark:text-violet-400" />
                                    )}
                                    <span className="truncate max-w-[200px]">{course.title}</span>
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
                        <FormDescription className="text-gray-500 dark:text-gray-400 text-sm">
                          Linking to a course helps classmates find your study group
                        </FormDescription>
                        <FormMessage className="text-red-500 dark:text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("courseId") && form.watch("courseId") !== "none" && (
                  <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-lg border border-violet-100 dark:border-violet-800/30">
                    <div className="flex">
                      <Megaphone className="w-5 h-5 text-violet-500 dark:text-violet-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-violet-800 dark:text-violet-300">Course Connection Benefits</h3>
                        <ul className="text-sm text-violet-700/80 dark:text-violet-400/80 mt-2 space-y-1 list-disc list-inside">
                          <li>Your group will be highlighted for others taking the same course</li>
                          <li>Course materials and resources can be easily shared</li>
                          <li>Students from the same course can find your group more easily</li>
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

            <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
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