"use client";

import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { SettingsSchema } from "@/schemas";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Phone, Camera, Book } from "lucide-react";
import { AvatarUpload } from "./avatar-upload";

interface ProfileTabProps {
  form: UseFormReturn<z.infer<typeof SettingsSchema>>;
  isPending: boolean;
  currentImage: string | null;
}

export const ProfileTab = ({ form, isPending, currentImage }: ProfileTabProps) => {
  const handleUploadComplete = (url: string) => {
    form.setValue('image', url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Profile Picture */}
      <div className={cn(
        "p-6 rounded-xl",
        "bg-white/60 dark:bg-slate-800/60",
        "backdrop-blur-sm",
        "border border-slate-200/30 dark:border-slate-700/30",
        "shadow-lg"
      )}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Profile Picture
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Upload or change your profile picture
            </p>
          </div>
        </div>

        <AvatarUpload
          currentImage={currentImage}
          onUploadComplete={handleUploadComplete}
        />
      </div>

      {/* Contact Information */}
      <div className={cn(
        "p-6 rounded-xl",
        "bg-white/60 dark:bg-slate-800/60",
        "backdrop-blur-sm",
        "border border-slate-200/30 dark:border-slate-700/30",
        "shadow-lg"
      )}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Contact Information
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Add or update your contact details
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 dark:text-slate-300">
                  Phone Number
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="+1 (555) 123-4567"
                    type="tel"
                    disabled={isPending}
                    className={cn(
                      "bg-white/50 dark:bg-slate-900/50",
                      "border-slate-200/50 dark:border-slate-700/50",
                      "text-slate-900 dark:text-slate-100"
                    )}
                  />
                </FormControl>
                <FormDescription className="text-xs text-slate-500">
                  Include country code (e.g., +1 for US)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Learning Preferences */}
      <div className={cn(
        "p-6 rounded-xl",
        "bg-white/60 dark:bg-slate-800/60",
        "backdrop-blur-sm",
        "border border-slate-200/30 dark:border-slate-700/30",
        "shadow-lg"
      )}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
            <Book className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Learning Preferences
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Customize your learning experience
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="learningStyle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 dark:text-slate-300">
                  Preferred Learning Style
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white dark:bg-slate-900/50">
                      <SelectValue placeholder="Select your learning style" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="VISUAL">
                      <div className="flex flex-col">
                        <span className="font-medium">Visual</span>
                        <span className="text-xs text-slate-500">Learn best with images, diagrams, and videos</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="AUDITORY">
                      <div className="flex flex-col">
                        <span className="font-medium">Auditory</span>
                        <span className="text-xs text-slate-500">Learn best through listening and discussion</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="KINESTHETIC">
                      <div className="flex flex-col">
                        <span className="font-medium">Kinesthetic</span>
                        <span className="text-xs text-slate-500">Learn best through hands-on practice</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="READING_WRITING">
                      <div className="flex flex-col">
                        <span className="font-medium">Reading/Writing</span>
                        <span className="text-xs text-slate-500">Learn best through reading and note-taking</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs text-slate-500">
                  SAM AI will personalize content based on your learning style
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> Not sure about your learning style? Take our quick assessment to discover how you learn best!
            </p>
            <Button
              type="button"
              variant="link"
              className="text-blue-600 dark:text-blue-400 p-0 h-auto mt-2"
            >
              Take Learning Style Assessment →
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
