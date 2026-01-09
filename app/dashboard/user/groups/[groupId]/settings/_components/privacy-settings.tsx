"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { logger } from '@/lib/logger';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Globe, Lock, UserPlus, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PrivacySettingsProps {
  group: any;
  currentUser: any;
  isCreator: boolean;
}

const formSchema = z.object({
  privacy: z.enum(["public", "private", "invite_only"]),
  requireApproval: z.boolean(),
  autoAcceptMembers: z.boolean(),
  allowExternalSharing: z.boolean(),
  showMemberList: z.boolean(),
});

export function PrivacySettings({ group, currentUser, isCreator }: PrivacySettingsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      privacy: group.privacy || "public",
      requireApproval: group.requireApproval || false,
      autoAcceptMembers: group.autoAcceptMembers || true,
      allowExternalSharing: group.allowExternalSharing || true,
      showMemberList: group.showMemberList || true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      // Update group privacy settings
      const response = await fetch(`/api/groups/${group.id}/privacy`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update privacy settings");
      }

      toast.success("Privacy settings updated successfully");
    } catch (error: any) {
      toast.error("Something went wrong");
      logger.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Privacy Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Control who can see and join your group.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Group Privacy */}
          <FormField
            control={form.control}
            name="privacy"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Group Privacy</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <FormItem>
                      <FormControl>
                        <div className={cn(
                          "flex flex-col h-full items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4",
                          "hover:border-indigo-500 dark:hover:border-indigo-500",
                          field.value === "public" && "border-indigo-500 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                        )}>
                          <RadioGroupItem value="public" id="public" className="sr-only" />
                          <Globe className="h-8 w-8 text-indigo-500" />
                          <div className="text-center">
                            <FormLabel className="font-semibold text-base" htmlFor="public">Public</FormLabel>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Anyone can find and join the group
                            </p>
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <div className={cn(
                          "flex flex-col h-full items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4",
                          "hover:border-indigo-500 dark:hover:border-indigo-500",
                          field.value === "private" && "border-indigo-500 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                        )}>
                          <RadioGroupItem value="private" id="private" className="sr-only" />
                          <Lock className="h-8 w-8 text-indigo-500" />
                          <div className="text-center">
                            <FormLabel className="font-semibold text-base" htmlFor="private">Private</FormLabel>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Group is visible but joining requires approval
                            </p>
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <div className={cn(
                          "flex flex-col h-full items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4",
                          "hover:border-indigo-500 dark:hover:border-indigo-500",
                          field.value === "invite_only" && "border-indigo-500 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                        )}>
                          <RadioGroupItem value="invite_only" id="invite_only" className="sr-only" />
                          <UserPlus className="h-8 w-8 text-indigo-500" />
                          <div className="text-center">
                            <FormLabel className="font-semibold text-base" htmlFor="invite_only">Invite Only</FormLabel>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Only invited members can join the group
                            </p>
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Membership Approval */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 space-y-6 border border-gray-200 dark:border-gray-700">
            <FormField
              control={form.control}
              name="requireApproval"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-base">
                      Require Admin Approval
                      {field.value && (
                        <Badge variant="outline" className="ml-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-0">
                          <Shield className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </FormLabel>
                    <FormDescription>
                      New members must be approved by admins before joining the group.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autoAcceptMembers"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-base">Auto-accept Members</FormLabel>
                    <FormDescription>
                      Automatically accept new member requests (only applies if the group is public or private).
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Content Visibility */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 space-y-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Content Visibility</h3>
            
            <FormField
              control={form.control}
              name="allowExternalSharing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-base">Allow External Sharing</FormLabel>
                    <FormDescription>
                      Members can share discussions and resources outside the group.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showMemberList"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-base">Show Member List</FormLabel>
                    <FormDescription>
                      Make the member list visible to non-members.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className={cn(
                "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white",
                "shadow-md"
              )}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Privacy Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 