'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Trophy,
  Share2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface MilestoneData {
  id: string;
  type: string;
  hours: number;
  badgeName: string;
  skillName: string;
  unlockedAt: string;
  shareCount: number;
}

interface ShareContent {
  title: string;
  text: string;
  hashtags: string[];
  url: string;
}

interface ShareMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestoneId: string;
}

type Platform = 'twitter' | 'linkedin' | 'facebook' | 'copy';

// ============================================================================
// COMPONENT
// ============================================================================

export function ShareMilestoneDialog({
  open,
  onOpenChange,
  milestoneId,
}: ShareMilestoneDialogProps) {
  const [milestone, setMilestone] = useState<MilestoneData | null>(null);
  const [shareContent, setShareContent] = useState<ShareContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchShareContent = useCallback(async () => {
    if (isFetchingRef.current || !milestoneId) return;

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/sam/practice/milestones/${milestoneId}/share`);
      const result = await response.json();

      if (result.success) {
        setMilestone(result.data.milestone);
        setShareContent(result.data.shareContent);
      }
    } catch (error) {
      console.error('Error fetching share content:', error);
      toast.error('Failed to load share content');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [milestoneId]);

  useEffect(() => {
    if (open && milestoneId) {
      fetchShareContent();
    }
  }, [open, milestoneId, fetchShareContent]);

  const handleShare = async (platform: Platform) => {
    setIsSharing(true);

    try {
      // Record the share
      const response = await fetch(`/api/sam/practice/milestones/${milestoneId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      const result = await response.json();

      if (result.success) {
        if (platform === 'copy') {
          await navigator.clipboard.writeText(result.data.shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success('Copied to clipboard!');
        } else {
          // Open share URL in new window
          window.open(result.data.shareUrl, '_blank', 'width=600,height=400');
          toast.success('Sharing...');
        }

        // Update share count
        if (milestone) {
          setMilestone({ ...milestone, shareCount: result.data.shareCount });
        }
      } else {
        toast.error(result.error ?? 'Failed to share');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    } finally {
      setIsSharing(false);
    }
  };

  const platforms: { id: Platform; name: string; icon: string; color: string }[] = [
    { id: 'twitter', name: 'Twitter / X', icon: '𝕏', color: 'bg-black hover:bg-gray-800' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'in', color: 'bg-[#0077B5] hover:bg-[#005885]' },
    { id: 'facebook', name: 'Facebook', icon: 'f', color: 'bg-[#1877F2] hover:bg-[#1459b5]' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Achievement
          </DialogTitle>
          <DialogDescription>
            Celebrate your milestone with the world!
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : milestone && shareContent ? (
          <div className="space-y-6">
            {/* Preview Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-semibold">{milestone.badgeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {milestone.hours.toLocaleString()} hours in {milestone.skillName}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{shareContent.text}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {shareContent.hashtags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Share Buttons */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Share on</p>
              <div className="grid grid-cols-3 gap-2">
                {platforms.map((platform) => (
                  <Button
                    key={platform.id}
                    className={cn('text-white font-bold', platform.color)}
                    onClick={() => handleShare(platform.id)}
                    disabled={isSharing}
                  >
                    {isSharing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span className="mr-2">{platform.icon}</span>
                        {platform.name.split(' ')[0]}
                      </>
                    )}
                  </Button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleShare('copy')}
                disabled={isSharing}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>

            {/* Stats */}
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Shared {milestone.shareCount} time{milestone.shareCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Unable to load share content
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// SHARE BUTTON COMPONENT
// ============================================================================

interface ShareButtonProps {
  milestoneId: string;
  size?: 'sm' | 'default';
  variant?: 'ghost' | 'outline' | 'default';
  className?: string;
}

export function ShareButton({
  milestoneId,
  size = 'sm',
  variant = 'ghost',
  className,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsOpen(true)}
      >
        <Share2 className="h-4 w-4" />
        {size !== 'sm' && <span className="ml-2">Share</span>}
      </Button>

      <ShareMilestoneDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        milestoneId={milestoneId}
      />
    </>
  );
}

export default ShareMilestoneDialog;
