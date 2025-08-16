"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import axios from "axios";
import { format, addDays, isAfter, isBefore, differenceInDays } from "date-fns";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Subscription } from "@prisma/client";
import { SubscriptionCard } from "./subscription-card";
import { SubscriptionStats } from "./subscription-stats";
import { SubscriptionFilterBar } from "./subscription-filter-bar";
import { EnhancedSubscription } from "./types";
import { PlusCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { logger } from '@/lib/logger';

// Import form components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form schema with additional fields
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  platform: z.string().min(1, "Platform is required"),
  url: z.string().url("Enter a valid URL"),
  category: z.string().optional(),
  dateOfSubscription: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  endOfSubscription: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  cardUsed: z.string().min(1, "Card information is required"),
  amount: z.preprocess((value) => parseFloat(value as string), z.number().positive("Amount must be positive")),
  billingCycle: z.enum(["monthly", "quarterly", "yearly", "custom"]).default("monthly"),
  isRenewing: z.boolean().default(true),
  notes: z.string().optional(),
  notificationEnabled: z.boolean().default(true),
  notificationDays: z.array(z.number()).default([1, 3, 7]),
  notificationEmail: z.boolean().default(true),
  notificationPush: z.boolean().default(true),
});

interface EnhancedSubscriptionFormProps {
  userId: string;
  subscriptions?: Subscription[];
}

export const EnhancedSubscriptionForm = ({
  userId,
  subscriptions = [],
}: EnhancedSubscriptionFormProps) => {
  // State management
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "amount">("date");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(null);

  // Enhanced subscriptions with additional properties - simplified to avoid unneeded re-renders
  const enhancedSubscriptions: EnhancedSubscription[] = useMemo(() => {
    return subscriptions.map(sub => ({
      ...sub,
      // Add basic defaults without complex logic
      notificationEnabled: true,
      notificationDays: [1, 3, 7],
      isRenewing: true,
      billingCycle: "monthly",
    }));
  }, [subscriptions]); // Only depend on subscriptions changing

  // UI Elements
  const toggleCreating = () => {
    setIsCreating((current) => !current);
    setEditMode(false);
    form.reset({
      name: "",
      platform: "",
      url: "",
      category: "",
      dateOfSubscription: format(new Date(), "yyyy-MM-dd"),
      endOfSubscription: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      cardUsed: "",
      amount: 0,
      billingCycle: "monthly",
      isRenewing: true,
      notes: "",
      notificationEnabled: true,
      notificationDays: [1, 3, 7],
      notificationEmail: true,
      notificationPush: true,
    });
  };

  const cancelEditMode = () => {
    setEditMode(false);
    setEditingSubscriptionId(null);
    form.reset();
  };

  const router = useRouter();

  // Form setup with extended schema
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      platform: "",
      url: "",
      category: "",
      dateOfSubscription: format(new Date(), "yyyy-MM-dd"),
      endOfSubscription: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      cardUsed: "",
      amount: 0,
      billingCycle: "monthly",
      isRenewing: true,
      notes: "",
      notificationEnabled: true,
      notificationDays: [1, 3, 7],
      notificationEmail: true,
      notificationPush: true,
    },
    mode: "onChange",
  });

  const { isSubmitting, isValid } = form.formState;
  const watchedValues = form.watch();

  // Determine if form has essential fields filled
  const isFormComplete = watchedValues.name && 
    watchedValues.platform && 
    watchedValues.url && 
    watchedValues.cardUsed && 
    watchedValues.amount > 0;

  // Filter and sort subscriptions based on active tab and search query
  const filteredSubscriptions = useMemo(() => {
    let filtered = [...subscriptions];
    
    // Apply tab filter
    if (activeTab !== "all") {
      if (activeTab === "active") {
        filtered = filtered.filter(sub => 
          isAfter(new Date(sub.endOfSubscription), new Date())
        );
      } else if (activeTab === "expiring") {
        const thirtyDaysFromNow = addDays(new Date(), 30);
        filtered = filtered.filter(sub => 
          isAfter(new Date(sub.endOfSubscription), new Date()) && 
          isBefore(new Date(sub.endOfSubscription), thirtyDaysFromNow)
        );
      } else if (activeTab === "expired") {
        filtered = filtered.filter(sub => 
          isBefore(new Date(sub.endOfSubscription), new Date())
        );
      }
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sub => 
        sub.name.toLowerCase().includes(query) || 
        sub.platform.toLowerCase().includes(query) ||
        (sub.category && sub.category.toLowerCase().includes(query))
      );
    }
    
    // Apply sort
    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "amount") {
        return b.amount - a.amount;
      } else {
        // Default sort by date (newest renewal first)
        return new Date(b.endOfSubscription).getTime() - new Date(a.endOfSubscription).getTime();
      }
    });
  }, [subscriptions, activeTab, searchQuery, sortBy]);

  // Statistics
  const expiringCount = useMemo(() => {
    const thirtyDaysFromNow = addDays(new Date(), 30);
    return subscriptions.filter(sub => 
      isAfter(new Date(sub.endOfSubscription), new Date()) && 
      isBefore(new Date(sub.endOfSubscription), thirtyDaysFromNow)
    ).length;
  }, [subscriptions]);

  const expiredCount = useMemo(() => {
    return subscriptions.filter(sub => 
      isBefore(new Date(sub.endOfSubscription), new Date())
    ).length;
  }, [subscriptions]);

  // Submission handlers
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsUpdating(true);
      // Transform dates to ISO format for API
      const transformedValues = {
        ...values,
        dateOfSubscription: new Date(values.dateOfSubscription).toISOString(),
        endOfSubscription: new Date(values.endOfSubscription).toISOString(),
      };
      
      await axios.post(`/api/users/${userId}/subscriptions`, transformedValues);
      toast.success("Subscription added");
      toggleCreating();
      router.refresh();
    } catch (error) {
      logger.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onSave = async (values: z.infer<typeof formSchema>) => {
    if (!editingSubscriptionId) return;

    try {
      setIsUpdating(true);
      // Transform dates to ISO format for API
      const transformedValues = {
        ...values,
        dateOfSubscription: new Date(values.dateOfSubscription).toISOString(),
        endOfSubscription: new Date(values.endOfSubscription).toISOString(),
      };
      
      await axios.patch(`/api/users/${userId}/subscriptions/${editingSubscriptionId}`, transformedValues);
      toast.success("Subscription updated");
      setEditMode(false);
      setEditingSubscriptionId(null);
      form.reset();
      router.refresh();
    } catch (error) {
      logger.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onEdit = (id: string) => {
    const subscriptionToEdit = subscriptions.find((sub) => sub.id === id);
    if (subscriptionToEdit) {
      setEditMode(true);
      setEditingSubscriptionId(id);
      
      // Set form values from the subscription
      form.reset({
        name: subscriptionToEdit.name,
        platform: subscriptionToEdit.platform,
        url: subscriptionToEdit.url,
        category: subscriptionToEdit.category || "",
        dateOfSubscription: format(new Date(subscriptionToEdit.dateOfSubscription), "yyyy-MM-dd"),
        endOfSubscription: format(new Date(subscriptionToEdit.endOfSubscription), "yyyy-MM-dd"),
        cardUsed: subscriptionToEdit.cardUsed,
        amount: subscriptionToEdit.amount,
        billingCycle: "monthly", // Default as it's not in original data
        isRenewing: true, // Default as it's not in original data
        notes: "",
        notificationEnabled: true,
        notificationDays: [1, 3, 7],
        notificationEmail: true,
        notificationPush: true,
      });
    }
  };

  const confirmDelete = (id: string) => {
    setSubscriptionToDelete(id);
    setShowDeleteDialog(true);
  };

  const onDelete = async () => {
    if (!subscriptionToDelete) return;
    
    try {
      setIsLoading(true);
      await axios.delete(`/api/users/${userId}/subscriptions/${subscriptionToDelete}`);
      toast.success("Subscription deleted");
      setShowDeleteDialog(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
      setSubscriptionToDelete(null);
    }
  };

  const onToggleNotification = async (id: string, enabled: boolean) => {
    try {
      setIsLoading(true);
      // This would need a real API endpoint to toggle notifications
      toast.success(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error("Couldn't update notification settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Subscription Manager
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Keep track of all your subscriptions in one place
          </p>
        </div>
        
        <Button
          onClick={toggleCreating}
          className={cn(
            "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
            "text-white shadow-md hover:shadow-lg transition-all duration-200"
          )}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          {isCreating ? "Cancel" : "Add Subscription"}
        </Button>
      </div>
      
      {/* Stats Dashboard */}
      {!isCreating && !editMode && subscriptions.length > 0 && (
        <SubscriptionStats subscriptions={enhancedSubscriptions} />
      )}
      
      {/* Filters */}
      {!isCreating && !editMode && subscriptions.length > 0 && (
        <SubscriptionFilterBar
          onTabChange={setActiveTab}
          onSearchChange={setSearchQuery}
          onSortChange={setSortBy}
          totalCount={subscriptions.length}
          expiringCount={expiringCount}
          expiredCount={expiredCount}
        />
      )}
      
      {/* Creation/Edit Form */}
      {(isCreating || editMode) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-md overflow-hidden border border-gray-200/50 dark:border-gray-700/50"
        >
          {/* Form header with gradient background */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
            <h3 className="text-xl font-semibold text-white">
              {editMode ? "Edit Subscription" : "Add New Subscription"}
            </h3>
            <p className="text-purple-100 mt-1 text-sm">
              {editMode ? "Update your subscription details" : "Track a new subscription service"}
            </p>
          </div>
          
          <div className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(editMode ? onSave : onSubmit)} className="space-y-6">
                {/* Basic Details Section */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-5 border border-purple-100 dark:border-purple-900/30 shadow-sm">
                  <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-4">
                    Basic Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-indigo-700 dark:text-indigo-300">Subscription Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isSubmitting || isUpdating}
                              placeholder="e.g. Netflix Premium"
                              className="border-purple-200 dark:border-purple-900/50 focus:border-purple-500 dark:focus:border-purple-400 transition-colors bg-white/70 dark:bg-gray-900/50"
                            />
                          </FormControl>
                          <FormMessage className="text-pink-600 dark:text-pink-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-indigo-700 dark:text-indigo-300">Platform</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isSubmitting || isUpdating}
                              placeholder="e.g. Netflix"
                              className="border-purple-200 dark:border-purple-900/50 focus:border-purple-500 dark:focus:border-purple-400 transition-colors bg-white/70 dark:bg-gray-900/50"
                            />
                          </FormControl>
                          <FormMessage className="text-pink-600 dark:text-pink-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-indigo-700 dark:text-indigo-300">URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isSubmitting || isUpdating}
                              placeholder="https://www.example.com"
                              className="border-purple-200 dark:border-purple-900/50 focus:border-purple-500 dark:focus:border-purple-400 transition-colors bg-white/70 dark:bg-gray-900/50"
                            />
                          </FormControl>
                          <FormMessage className="text-pink-600 dark:text-pink-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-indigo-700 dark:text-indigo-300">Category</FormLabel>
                          <Select
                            disabled={isSubmitting || isUpdating}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-purple-200 dark:border-purple-900/50 focus:border-purple-500 dark:focus:border-purple-400 transition-colors bg-white/70 dark:bg-gray-900/50">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Streaming" className="text-red-600 dark:text-red-400">Streaming</SelectItem>
                              <SelectItem value="Music" className="text-green-600 dark:text-green-400">Music</SelectItem>
                              <SelectItem value="Gaming" className="text-blue-600 dark:text-blue-400">Gaming</SelectItem>
                              <SelectItem value="Productivity" className="text-yellow-600 dark:text-yellow-400">Productivity</SelectItem>
                              <SelectItem value="Cloud Storage" className="text-cyan-600 dark:text-cyan-400">Cloud Storage</SelectItem>
                              <SelectItem value="News" className="text-orange-600 dark:text-orange-400">News</SelectItem>
                              <SelectItem value="Learning" className="text-purple-600 dark:text-purple-400">Learning</SelectItem>
                              <SelectItem value="Other" className="text-gray-600 dark:text-gray-400">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-pink-600 dark:text-pink-400 text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Payment Details Section */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-5 border border-blue-100 dark:border-blue-900/30 shadow-sm">
                  <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-4">
                    Payment Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700 dark:text-blue-300">Amount</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              disabled={isSubmitting || isUpdating}
                              placeholder="0.00"
                              className="border-blue-200 dark:border-blue-900/50 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-white/70 dark:bg-gray-900/50"
                            />
                          </FormControl>
                          <FormMessage className="text-pink-600 dark:text-pink-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="billingCycle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700 dark:text-blue-300">Billing Cycle</FormLabel>
                          <Select
                            disabled={isSubmitting || isUpdating}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-blue-200 dark:border-blue-900/50 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-white/70 dark:bg-gray-900/50">
                                <SelectValue placeholder="Select billing cycle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-pink-600 dark:text-pink-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cardUsed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700 dark:text-blue-300">Payment Method</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isSubmitting || isUpdating}
                              placeholder="e.g. Visa **** 1234"
                              className="border-blue-200 dark:border-blue-900/50 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-white/70 dark:bg-gray-900/50"
                            />
                          </FormControl>
                          <FormMessage className="text-pink-600 dark:text-pink-400 text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Dates Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-5 border border-green-100 dark:border-green-900/30 shadow-sm">
                  <h4 className="text-sm font-medium text-green-700 dark:text-green-300 uppercase tracking-wider mb-4">
                    Subscription Dates
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dateOfSubscription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-green-700 dark:text-green-300">Start Date</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              disabled={isSubmitting || isUpdating}
                              className="border-green-200 dark:border-green-900/50 focus:border-green-500 dark:focus:border-green-400 transition-colors bg-white/70 dark:bg-gray-900/50"
                            />
                          </FormControl>
                          <FormMessage className="text-pink-600 dark:text-pink-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endOfSubscription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-green-700 dark:text-green-300">Next Renewal</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              disabled={isSubmitting || isUpdating}
                              className="border-green-200 dark:border-green-900/50 focus:border-green-500 dark:focus:border-green-400 transition-colors bg-white/70 dark:bg-gray-900/50"
                            />
                          </FormControl>
                          <FormMessage className="text-pink-600 dark:text-pink-400 text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Additional Settings Section */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-5 border border-amber-100 dark:border-amber-900/30 shadow-sm">
                  <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-4">
                    Additional Settings
                  </h4>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isRenewing"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-900/30 rounded-md border border-amber-200 dark:border-amber-900/50">
                          <div className="space-y-0.5">
                            <FormLabel className="text-amber-700 dark:text-amber-300">Auto-renewing subscription</FormLabel>
                            <p className="text-sm text-amber-600/70 dark:text-amber-400/70">
                              Does this subscription automatically renew?
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting || isUpdating}
                              className="data-[state=checked]:bg-amber-600 data-[state=checked]:dark:bg-amber-700"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notificationEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-900/30 rounded-md border border-amber-200 dark:border-amber-900/50">
                          <div className="space-y-0.5">
                            <FormLabel className="text-amber-700 dark:text-amber-300">Renewal reminders</FormLabel>
                            <p className="text-sm text-amber-600/70 dark:text-amber-400/70">
                              Get reminded before this subscription renews
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting || isUpdating}
                              className="data-[state=checked]:bg-amber-600 data-[state=checked]:dark:bg-amber-700"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  {editMode && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEditMode}
                      disabled={isSubmitting || isUpdating}
                      className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={!isFormComplete || isSubmitting || isUpdating}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    {isSubmitting || isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editMode ? "Saving..." : "Creating..."}
                      </>
                    ) : (
                      <>{editMode ? "Save Changes" : "Add Subscription"}</>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </motion.div>
      )}
      
      {/* Subscription List */}
      {!isCreating && !editMode && (
        <div className="space-y-6">
          {filteredSubscriptions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 text-center">
              {subscriptions.length === 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">No subscriptions yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Add your first subscription to start tracking your expenses.
                  </p>
                  <Button 
                    onClick={toggleCreating}
                    className="mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Subscription
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">No matching subscriptions</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try changing your search or filter settings.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSubscriptions.map((subscription) => {
                // Calculate days until renewal
                const daysUntilRenewal = differenceInDays(
                  new Date(subscription.endOfSubscription),
                  new Date()
                );
                
                // Determine renewal status
                const isExpired = daysUntilRenewal < 0;
                const isExpiringSoon = daysUntilRenewal >= 0 && daysUntilRenewal <= 7;
                
                // Determine background gradient based on status
                let bgGradient = "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20";
                let borderColor = "border-emerald-100 dark:border-emerald-800/30";
                let accentColor = "emerald";
                
                if (isExpired) {
                  bgGradient = "from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20";
                  borderColor = "border-red-100 dark:border-red-800/30";
                  accentColor = "red";
                } else if (isExpiringSoon) {
                  bgGradient = "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20";
                  borderColor = "border-amber-100 dark:border-amber-800/30";
                  accentColor = "amber";
                }
                
                // Format the amount as currency
                const formattedAmount = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(subscription.amount);
                
                return (
                  <motion.div
                    key={subscription.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-xl overflow-hidden shadow-md group hover:shadow-lg transition-all duration-300 border ${borderColor} bg-gradient-to-br ${bgGradient}`}
                  >
                    {/* Header section */}
                    <div className="px-4 py-3 flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-md overflow-hidden flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          {/* Platform icon/logo would go here */}
                          <div 
                            style={{
                              color: accentColor === 'emerald' ? '#059669' : 
                                     accentColor === 'amber' ? '#d97706' : 
                                     '#dc2626',
                            }}
                            className="font-bold text-lg"
                          >
                            {subscription.platform.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <h3 
                            style={{
                              color: accentColor === 'emerald' ? '#065f46' : 
                                     accentColor === 'amber' ? '#92400e' : 
                                     '#b91c1c',
                            }}
                            className="font-semibold text-sm truncate max-w-[130px]"
                          >
                            {subscription.name}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[130px]">
                            {subscription.platform}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div 
                          style={{
                            color: accentColor === 'emerald' ? '#065f46' : 
                                   accentColor === 'amber' ? '#92400e' : 
                                   '#b91c1c',
                          }}
                          className="font-semibold text-sm"
                        >
                          {formattedAmount}
                        </div>
                        <div className="text-xs">
                          {isExpired ? (
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              Expired
                            </span>
                          ) : isExpiringSoon ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              {daysUntilRenewal} day{daysUntilRenewal !== 1 ? "s" : ""} left
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {daysUntilRenewal} days left
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar for days until renewal */}
                    <div className="px-4 pb-3">
                      {!isExpired && (
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            style={{ 
                              width: `${Math.min(100, Math.max(0, (30 - daysUntilRenewal) / 30 * 100))}%`,
                              backgroundColor: accentColor === 'emerald' ? '#10b981' : 
                                             accentColor === 'amber' ? '#f59e0b' : 
                                             '#ef4444',
                            }}
                            className="h-full"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Details section */}
                    <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          Payment method
                        </span>
                        <span className="font-medium">
                          {subscription.cardUsed}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          Renewal date
                        </span>
                        <span className="font-medium">
                          {format(new Date(subscription.endOfSubscription), "MMM d, yyyy")}
                        </span>
                      </div>
                      {subscription.category && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            Category
                          </span>
                          <span 
                            style={{
                              backgroundColor: accentColor === 'emerald' ? 'rgba(209, 250, 229, 0.8)' : 
                                             accentColor === 'amber' ? 'rgba(254, 243, 199, 0.8)' : 
                                             'rgba(254, 226, 226, 0.8)',
                              color: accentColor === 'emerald' ? '#065f46' : 
                                    accentColor === 'amber' ? '#92400e' : 
                                    '#b91c1c',
                            }}
                            className="px-2 py-0.5 rounded-full font-medium dark:bg-opacity-30"
                          >
                            {subscription.category}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions section */}
                    <div className="px-4 py-3 bg-white/80 dark:bg-gray-800/80 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-between">
                      <a 
                        href={subscription.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: accentColor === 'emerald' ? '#059669' : 
                                accentColor === 'amber' ? '#d97706' : 
                                '#dc2626',
                        }}
                        className="text-xs flex items-center hover:underline"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        Visit site
                      </a>
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          style={{
                            borderColor: accentColor === 'emerald' ? '#a7f3d0' : 
                                       accentColor === 'amber' ? '#fcd34d' : 
                                       '#fecaca',
                            color: accentColor === 'emerald' ? '#059669' : 
                                  accentColor === 'amber' ? '#d97706' : 
                                  '#dc2626',
                          }}
                          className="h-7 px-2 hover:bg-opacity-10"
                          onClick={() => onEdit(subscription.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                          onClick={() => confirmDelete(subscription.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this subscription? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 