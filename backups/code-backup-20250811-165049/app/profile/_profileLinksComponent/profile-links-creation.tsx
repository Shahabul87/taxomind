"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, PlusCircle, Link as LinkIcon, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { User, ProfileLink } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ProfileLinksListPage } from "./profile-links-lists";

interface ProfileLinkCreationPageProps {
  userDetails: User & { profileLinks: ProfileLink[] };
}

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  platform: z.string().min(1, "Please enter a platform name"),
});

const PLATFORM_SUGGESTIONS = [
  "Twitter", "Instagram", "LinkedIn", "Facebook", 
  "YouTube", "TikTok", "Pinterest", "GitHub", 
  "Behance", "Dribbble", "Medium", "Substack", "Twitch"
];

export const ProfileLinkCreationPage = ({ userDetails }: ProfileLinkCreationPageProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const toggleCreating = () => {
    setIsCreating((current) => !current);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      platform: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/user/profileLinks`, values);
      toast.success("Profile link added successfully");
      toggleCreating();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const onReorder = async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true);
      await axios.put(`/api/user/profileLinks/reorder`, { list: updateData });
      toast.success("Profile links reordered");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const onEdit = (id: string) => {
    router.push(`/user/profileLinks/${id}`);
  };

  const selectPlatform = (platform: string) => {
    form.setValue("platform", platform);
  };

  return (
    <div className="relative mt-6 overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl">
      {/* Decorative elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 blur-3xl"></div>
      <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 opacity-20 blur-3xl"></div>
      
      <div className="relative p-6">
        {isUpdating && (
          <div className="absolute h-full w-full bg-gray-900/50 top-0 right-0 rounded-xl flex items-center justify-center backdrop-blur-sm z-10">
            <div className="bg-white/10 p-3 rounded-full">
              <Loader2 className="animate-spin h-6 w-6 text-white" />
            </div>
          </div>
        )}
        <div className="font-medium flex items-center justify-between text-white mb-6">
          <div className="flex items-center">
            <div className="h-8 w-1 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full mr-3"></div>
            <h2 className="text-xl font-bold">Profile Links</h2>
          </div>
          <Button 
            onClick={toggleCreating} 
            variant="ghost" 
            className="hover:bg-white/10 text-white"
          >
            {isCreating ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add new profile link
              </>
            )}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="backdrop-blur-sm bg-white/10 rounded-xl p-5 mb-6 border border-white/10">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-200">Platform</label>
                        <span className="text-xs text-gray-400">Select or type a platform name</span>
                      </div>
                      <FormField
                        control={form.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                disabled={isSubmitting}
                                placeholder="e.g., Twitter, LinkedIn"
                                className="text-white font-medium bg-gray-800/80 border-gray-700 focus-visible:ring-purple-500"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <div className="mt-2 flex flex-wrap gap-2">
                        {PLATFORM_SUGGESTIONS.map((platform) => (
                          <button
                            key={platform}
                            type="button"
                            onClick={() => selectPlatform(platform)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs transition-all",
                              "bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white",
                              "border border-gray-700 hover:border-gray-600",
                              form.watch("platform") === platform && "bg-purple-600/50 border-purple-500 text-white"
                            )}
                          >
                            {platform}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-200">URL</label>
                        <span className="text-xs text-gray-400">Include https://</span>
                      </div>
                      <FormField
                        control={form.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                <LinkIcon className="h-4 w-4 text-gray-400" />
                              </div>
                              <FormControl>
                                <Input
                                  disabled={isSubmitting}
                                  placeholder="e.g., https://twitter.com/yourprofile"
                                  className="pl-10 text-white font-medium bg-gray-800/80 border-gray-700 focus-visible:ring-purple-500"
                                  {...field}
                                />
                              </FormControl>
                            </div>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        disabled={!isValid || isSubmitting} 
                        type="submit"
                        className={cn(
                          "w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
                          "border-0 text-white font-medium",
                          "transition-all duration-200 ease-in-out",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                        ) : (
                          "Add Link"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn("text-sm", !userDetails.profileLinks.length && "text-gray-400 italic")}>
          {!userDetails.profileLinks.length ? (
            <div className="text-center py-8 px-4">
              <div className="inline-flex rounded-full bg-gray-800 p-3 mb-4">
                <LinkIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="font-medium text-white mb-2">No profile links available</p>
              <p className="text-gray-400 max-w-md mx-auto">
                Add links to your social media profiles to help others connect with you across platforms.
              </p>
            </div>
          ) : (
            <>
              <ProfileLinksListPage
                onEdit={onEdit}
                onReorder={onReorder}
                items={userDetails.profileLinks || []}
              />
              <p className="text-xs mt-6 text-gray-400 flex items-center justify-center gap-2">
                <span className="inline-block w-8 h-0.5 bg-gray-700"></span>
                Drag and drop to reorder your profile links
                <span className="inline-block w-8 h-0.5 bg-gray-700"></span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileLinkCreationPage;
