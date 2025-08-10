"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Link as LinkIcon, Plus, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { logger } from '@/lib/logger';

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

const PLATFORM_SUGGESTIONS = [
  "Twitter", "Instagram", "LinkedIn", "Facebook", 
  "YouTube", "TikTok", "Pinterest", "GitHub", 
  "Behance", "Dribbble", "Medium", "Substack", "Twitch"
];

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  platform: z.string().min(1, "Please enter a platform name"),
});

interface ProfileLinkFormProps {
  userId: string;
}

export const ProfileLinkForm = ({ userId }: ProfileLinkFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      platform: "",
    },
  });

  const { isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await axios.post(`/api/users/${userId}/profile-links`, values);
      toast.success("Profile link added successfully");
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
      logger.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectPlatform = (platform: string) => {
    form.setValue("platform", platform);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl p-6 mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/90 via-slate-900 to-slate-950"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/20 rounded-full filter blur-3xl"></div>
      <div className="absolute -top-1 -left-1 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full opacity-70 blur-xl"></div>
      
      {/* Form header */}
      <div className="relative mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg mr-4">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">
              Add New Social Link
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Connect your digital presence across platforms
            </p>
          </div>
        </div>
      </div>
      
      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="relative space-y-6">
          {/* Platform field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-purple-300">Platform</label>
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
                      className="text-white font-medium bg-white/5 backdrop-blur-lg border-purple-500/30 focus-visible:ring-purple-500 focus-visible:border-purple-500/50 rounded-xl h-12 pl-4"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            
            {/* Platform suggestions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {PLATFORM_SUGGESTIONS.map((platform) => (
                <motion.button
                  key={platform}
                  type="button"
                  onClick={() => selectPlatform(platform)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs transition-all duration-200",
                    "border border-purple-500/20 backdrop-blur-md shadow-sm",
                    form.watch("platform") === platform 
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-md" 
                      : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {platform}
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* URL field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-purple-300">URL</label>
              <span className="text-xs text-gray-400">Include https://</span>
            </div>
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <LinkIcon className="h-5 w-5 text-purple-400" />
                    </div>
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        placeholder="e.g., https://twitter.com/yourprofile"
                        className="pl-10 text-white font-medium bg-white/5 backdrop-blur-lg border-purple-500/30 focus-visible:ring-purple-500 focus-visible:border-purple-500/50 rounded-xl h-12"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </div>
          
          {/* Submit button */}
          <div>
            <Button 
              disabled={!isValid || isSubmitting} 
              type="submit"
              className={cn(
                "w-full h-12 rounded-xl relative overflow-hidden group",
                "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
                "border-0 text-white font-medium",
                "transition-all duration-300 ease-out",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "after:absolute after:inset-0 after:bg-[length:400%_400%] after:bg-gradient-to-r after:from-purple-600/0 after:via-white/30 after:to-purple-600/0 after:animate-shimmer after:opacity-0 group-hover:after:opacity-100"
              )}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating...</>
              ) : (
                <div className="flex items-center justify-center">
                  <span>Add Link</span>
                  <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
};

export default ProfileLinkForm;
