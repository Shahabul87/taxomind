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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  User,
  Camera,
  MapPin,
  Globe,
  Book,
  Twitter,
  Linkedin,
  Github,
  Link as LinkIcon,
  FileText
} from "lucide-react";
import { AvatarUpload } from "./avatar-upload";
import { ProfileLink } from "@/types/settings";

interface ProfileTabProps {
  form: UseFormReturn<z.infer<typeof SettingsSchema>>;
  isPending: boolean;
  currentImage: string | null;
  currentBio?: string | null;
  currentLocation?: string | null;
  currentWebsite?: string | null;
  profileLinks?: ProfileLink[];
  userName?: string | null;
}

export const ProfileTab = ({
  form,
  isPending,
  currentImage,
  currentBio,
  currentLocation,
  currentWebsite,
  profileLinks,
  userName
}: ProfileTabProps) => {
  const handleUploadComplete = (url: string) => {
    form.setValue('image', url);
  };

  // Helper to get social link icon
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        return <Twitter className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      case 'github':
        return <Github className="h-4 w-4" />;
      default:
        return <LinkIcon className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Profile Picture Section */}
      <div className={cn(
        "p-6 rounded-3xl",
        "bg-white/80 dark:bg-slate-800/80",
        "backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-lg"
      )}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Profile Picture
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Upload or change your profile picture
            </p>
          </div>
        </div>

        <AvatarUpload
          currentImage={currentImage}
          onUploadComplete={handleUploadComplete}
        />
      </div>

      {/* About You Section */}
      <div className={cn(
        "p-6 rounded-3xl",
        "bg-white/80 dark:bg-slate-800/80",
        "backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-lg"
      )}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
            <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              About You
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Tell others a bit about yourself
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 dark:text-slate-300">
                  Bio
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Write a short bio about yourself..."
                    disabled={isPending}
                    rows={4}
                    className={cn(
                      "bg-white/50 dark:bg-slate-900/50",
                      "border-slate-200/50 dark:border-slate-700/50",
                      "text-slate-900 dark:text-slate-100",
                      "resize-none"
                    )}
                  />
                </FormControl>
                <FormDescription className="text-xs text-slate-500 flex justify-between">
                  <span>Tell people about your background, interests, and expertise</span>
                  <span className="text-slate-400">
                    {(field.value?.length || 0)}/500
                  </span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Location & Website Section */}
      <div className={cn(
        "p-6 rounded-3xl",
        "bg-white/80 dark:bg-slate-800/80",
        "backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-lg"
      )}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Location &amp; Website
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Where you&apos;re based and your online presence
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 dark:text-slate-300">
                  Location
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      {...field}
                      placeholder="City, Country"
                      disabled={isPending}
                      className={cn(
                        "pl-10",
                        "bg-white/50 dark:bg-slate-900/50",
                        "border-slate-200/50 dark:border-slate-700/50",
                        "text-slate-900 dark:text-slate-100"
                      )}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs text-slate-500">
                  e.g., San Francisco, USA
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 dark:text-slate-300">
                  Website
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      {...field}
                      placeholder="https://yourwebsite.com"
                      disabled={isPending}
                      className={cn(
                        "pl-10",
                        "bg-white/50 dark:bg-slate-900/50",
                        "border-slate-200/50 dark:border-slate-700/50",
                        "text-slate-900 dark:text-slate-100"
                      )}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs text-slate-500">
                  Your personal or professional website
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
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
                  Include country code (e.g., +1 for US). Visibility can be controlled in Privacy settings.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Social Links Section */}
      {profileLinks && profileLinks.length > 0 && (
        <div className={cn(
          "p-6 rounded-3xl",
          "bg-white/80 dark:bg-slate-800/80",
          "backdrop-blur-sm",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-lg"
        )}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <LinkIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Social Links
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Your connected social profiles
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {profileLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50"
              >
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {getSocialIcon(link.platform)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                    {link.platform}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {link.url}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <FileText className="inline h-4 w-4 mr-1" />
              Social links are managed separately. Contact support to update your social profiles.
            </p>
          </div>
        </div>
      )}

      {/* Learning Preferences Section */}
      <div className={cn(
        "p-6 rounded-3xl",
        "bg-white/80 dark:bg-slate-800/80",
        "backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-lg"
      )}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
            <Book className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Learning Preferences
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
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

      {/* Profile Preview Info */}
      <div className={cn(
        "p-4 rounded-2xl",
        "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50",
        "border border-slate-200/50 dark:border-slate-700/50"
      )}>
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Profile Preview
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your profile is visible to other learners based on your privacy settings.
              View how others see your profile on the{' '}
              <a href="/dashboard/user/profile" className="text-blue-600 dark:text-blue-400 hover:underline">
                Profile page
              </a>.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
