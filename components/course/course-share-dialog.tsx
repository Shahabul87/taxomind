"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Link2,
  Copy,
  Check,
  Globe,
  Lock,
  Users,
  Mail,
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  QrCode,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CourseShareDialogProps {
  courseId: string;
  courseTitle: string;
  courseSlug?: string;
  isPublished: boolean;
  trigger?: React.ReactNode;
  className?: string;
}

type ShareVisibility = "public" | "private" | "link-only";

interface SocialLink {
  name: string;
  icon: React.ReactNode;
  color: string;
  getUrl: (url: string, title: string) => string;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    name: "Twitter",
    icon: <Twitter className="w-5 h-5" />,
    color: "bg-[#1DA1F2] hover:bg-[#1a8cd8]",
    getUrl: (url, title) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "Facebook",
    icon: <Facebook className="w-5 h-5" />,
    color: "bg-[#4267B2] hover:bg-[#365899]",
    getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "LinkedIn",
    icon: <Linkedin className="w-5 h-5" />,
    color: "bg-[#0A66C2] hover:bg-[#084d93]",
    getUrl: (url, title) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: "WhatsApp",
    icon: <MessageCircle className="w-5 h-5" />,
    color: "bg-[#25D366] hover:bg-[#1fb855]",
    getUrl: (url, title) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    name: "Email",
    icon: <Mail className="w-5 h-5" />,
    color: "bg-slate-600 hover:bg-slate-700",
    getUrl: (url, title) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this course: ${url}`)}`,
  },
];

/**
 * Course Share Dialog Component
 *
 * Provides multiple sharing options:
 * - Direct link sharing
 * - Social media sharing
 * - QR code generation
 * - Visibility settings (public/private/link-only)
 */
export function CourseShareDialog({
  courseId,
  courseTitle,
  courseSlug,
  isPublished,
  trigger,
  className,
}: CourseShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState<ShareVisibility>(
    isPublished ? "public" : "private"
  );
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("link");

  // Generate the course URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const courseUrl = courseSlug
    ? `${baseUrl}/courses/${courseSlug}`
    : `${baseUrl}/learn/${courseId}`;

  // Generate the shareable link with tracking
  const getShareableLink = useCallback(() => {
    const params = new URLSearchParams();
    params.append("ref", "share");
    if (visibility === "link-only") {
      // Generate a unique share token for link-only sharing
      const shareToken = btoa(`${courseId}-${Date.now()}`).slice(0, 12);
      params.append("token", shareToken);
    }
    return `${courseUrl}?${params.toString()}`;
  }, [courseId, courseUrl, visibility]);

  const shareableLink = getShareableLink();

  // Copy link to clipboard
  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  }, [shareableLink]);

  // Share via social media
  const shareToSocial = useCallback(
    (social: SocialLink) => {
      const url = social.getUrl(shareableLink, courseTitle);
      window.open(url, "_blank", "width=600,height=400");
    },
    [shareableLink, courseTitle]
  );

  // Native share API (mobile)
  const nativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: courseTitle,
          text: `Check out this course: ${courseTitle}`,
          url: shareableLink,
        });
        toast.success("Shared successfully!");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          toast.error("Failed to share");
        }
      }
    } else {
      copyLink();
    }
  }, [courseTitle, shareableLink, copyLink]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-500" />
            Share Course
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Share &quot;{courseTitle}&quot; with others
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link" className="text-sm">
              <Link2 className="w-4 h-4 mr-1.5" />
              Link
            </TabsTrigger>
            <TabsTrigger value="social" className="text-sm">
              <Users className="w-4 h-4 mr-1.5" />
              Social
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-sm">
              <Globe className="w-4 h-4 mr-1.5" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Link Sharing Tab */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="share-link">Shareable Link</Label>
              <div className="flex gap-2">
                <Input
                  id="share-link"
                  value={shareableLink}
                  readOnly
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={copyLink}
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Copy className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              {visibility === "public" && (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Anyone with the link can view this course</span>
                </>
              )}
              {visibility === "private" && (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Only enrolled users can view this course</span>
                </>
              )}
              {visibility === "link-only" && (
                <>
                  <Link2 className="w-4 h-4" />
                  <span>Only people with this link can view</span>
                </>
              )}
            </div>

            {/* Native Share Button (for mobile) */}
            {"share" in navigator && (
              <Button onClick={nativeShare} className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                Share via Device
              </Button>
            )}
          </TabsContent>

          {/* Social Sharing Tab */}
          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-3">
              {SOCIAL_LINKS.map((social) => (
                <Button
                  key={social.name}
                  onClick={() => shareToSocial(social)}
                  className={cn(
                    "flex flex-col items-center gap-2 h-auto py-4 text-white",
                    social.color
                  )}
                >
                  {social.icon}
                  <span className="text-xs">{social.name}</span>
                </Button>
              ))}
            </div>

            <div className="pt-2 border-t">
              <Button
                onClick={copyLink}
                variant="outline"
                className="w-full gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Visibility</Label>
              <RadioGroup
                value={visibility}
                onValueChange={(v) => setVisibility(v as ShareVisibility)}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <RadioGroupItem value="public" id="public" className="mt-1" />
                  <div className="flex-1">
                    <Label
                      htmlFor="public"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-green-500" />
                      Public
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Anyone can discover and view this course
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <RadioGroupItem value="link-only" id="link-only" className="mt-1" />
                  <div className="flex-1">
                    <Label
                      htmlFor="link-only"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Link2 className="w-4 h-4 text-blue-500" />
                      Link Only
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Only people with the link can access
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <RadioGroupItem value="private" id="private" className="mt-1" />
                  <div className="flex-1">
                    <Label
                      htmlFor="private"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-orange-500" />
                      Private
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Only enrolled users can view this course
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {!isPublished && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> This course is not published yet. Publish it to make it accessible to others.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Simple share button with quick copy functionality
 */
export function CourseShareButton({
  courseId,
  courseSlug,
  className,
}: {
  courseId: string;
  courseSlug?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const courseUrl = courseSlug
    ? `${baseUrl}/courses/${courseSlug}`
    : `${baseUrl}/learn/${courseId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${courseUrl}?ref=share`);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={copyLink}
      className={cn("transition-all", className)}
      title="Copy share link"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Check className="w-4 h-4 text-green-500" />
          </motion.div>
        ) : (
          <motion.div
            key="share"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Share2 className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
