'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Trophy, Target, Clock, Flame, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface CreateChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ChallengeType = 'INDIVIDUAL' | 'GROUP' | 'COMPETITION' | 'COMMUNITY';

interface FormData {
  title: string;
  description: string;
  challengeType: ChallengeType;
  startsAt: string;
  endsAt: string;
  targetHours: string;
  targetSessions: string;
  targetStreak: string;
  targetQualityHours: string;
  skillName: string;
  xpReward: string;
  badgeReward: string;
  maxParticipants: string;
  isPublic: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateChallengeDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateChallengeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    challengeType: 'INDIVIDUAL',
    startsAt: '',
    endsAt: '',
    targetHours: '',
    targetSessions: '',
    targetStreak: '',
    targetQualityHours: '',
    skillName: '',
    xpReward: '100',
    badgeReward: '',
    maxParticipants: '',
    isPublic: true,
  });

  // Get default dates
  const getDefaultDates = () => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(startDate.getHours() + 1, 0, 0, 0);

    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(23, 59, 0, 0);

    return {
      startsAt: startDate.toISOString().slice(0, 16),
      endsAt: endDate.toISOString().slice(0, 16),
    };
  };

  // Initialize dates when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !formData.startsAt && !formData.endsAt) {
      const defaults = getDefaultDates();
      setFormData((prev) => ({
        ...prev,
        startsAt: defaults.startsAt,
        endsAt: defaults.endsAt,
      }));
    }
    onOpenChange(newOpen);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.startsAt || !formData.endsAt) {
      toast.error('Start and end dates are required');
      return;
    }

    // Validate at least one target
    const hasTarget =
      formData.targetHours ||
      formData.targetSessions ||
      formData.targetStreak ||
      formData.targetQualityHours;

    if (!hasTarget) {
      toast.error('At least one target must be set');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        challengeType: formData.challengeType,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
        targetHours: formData.targetHours ? parseFloat(formData.targetHours) : undefined,
        targetSessions: formData.targetSessions ? parseInt(formData.targetSessions, 10) : undefined,
        targetStreak: formData.targetStreak ? parseInt(formData.targetStreak, 10) : undefined,
        targetQualityHours: formData.targetQualityHours
          ? parseFloat(formData.targetQualityHours)
          : undefined,
        skillName: formData.skillName.trim() || undefined,
        xpReward: parseInt(formData.xpReward, 10) || 0,
        badgeReward: formData.badgeReward.trim() || undefined,
        maxParticipants: formData.maxParticipants
          ? parseInt(formData.maxParticipants, 10)
          : undefined,
        isPublic: formData.isPublic,
      };

      const response = await fetch('/api/sam/practice/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Challenge created successfully!');
        onOpenChange(false);
        onSuccess?.();

        // Reset form
        setFormData({
          title: '',
          description: '',
          challengeType: 'INDIVIDUAL',
          startsAt: '',
          endsAt: '',
          targetHours: '',
          targetSessions: '',
          targetStreak: '',
          targetQualityHours: '',
          skillName: '',
          xpReward: '100',
          badgeReward: '',
          maxParticipants: '',
          isPublic: true,
        });
      } else {
        toast.error(result.error ?? 'Failed to create challenge');
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed to create challenge');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Create Practice Challenge
          </DialogTitle>
          <DialogDescription>
            Create a challenge to motivate yourself or others to practice consistently.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., 7-Day Coding Sprint"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your challenge..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                maxLength={2000}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="challengeType">Challenge Type</Label>
                <Select
                  value={formData.challengeType}
                  onValueChange={(v) => setFormData({ ...formData, challengeType: v as ChallengeType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">
                      <span className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Individual
                      </span>
                    </SelectItem>
                    <SelectItem value="GROUP">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Group
                      </span>
                    </SelectItem>
                    <SelectItem value="COMPETITION">
                      <span className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Competition
                      </span>
                    </SelectItem>
                    <SelectItem value="COMMUNITY">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Community
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skillName">Skill (Optional)</Label>
                <Input
                  id="skillName"
                  placeholder="e.g., React, Python"
                  value={formData.skillName}
                  onChange={(e) => setFormData({ ...formData, skillName: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startsAt">Start Date *</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endsAt">End Date *</Label>
              <Input
                id="endsAt"
                type="datetime-local"
                value={formData.endsAt}
                onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
              />
            </div>
          </div>

          {/* Targets */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Targets (at least one required)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetHours" className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Total Hours
                </Label>
                <Input
                  id="targetHours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="e.g., 10"
                  value={formData.targetHours}
                  onChange={(e) => setFormData({ ...formData, targetHours: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetQualityHours" className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Quality Hours
                </Label>
                <Input
                  id="targetQualityHours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="e.g., 8"
                  value={formData.targetQualityHours}
                  onChange={(e) => setFormData({ ...formData, targetQualityHours: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetSessions" className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Sessions
                </Label>
                <Input
                  id="targetSessions"
                  type="number"
                  min="1"
                  placeholder="e.g., 7"
                  value={formData.targetSessions}
                  onChange={(e) => setFormData({ ...formData, targetSessions: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetStreak" className="flex items-center gap-2 text-sm">
                  <Flame className="h-4 w-4 text-muted-foreground" />
                  Streak Days
                </Label>
                <Input
                  id="targetStreak"
                  type="number"
                  min="1"
                  placeholder="e.g., 7"
                  value={formData.targetStreak}
                  onChange={(e) => setFormData({ ...formData, targetStreak: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Rewards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="xpReward" className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                XP Reward
              </Label>
              <Input
                id="xpReward"
                type="number"
                min="0"
                value={formData.xpReward}
                onChange={(e) => setFormData({ ...formData, xpReward: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="badgeReward">Badge Reward</Label>
              <Input
                id="badgeReward"
                placeholder="e.g., Sprint Champion"
                value={formData.badgeReward}
                onChange={(e) => setFormData({ ...formData, badgeReward: e.target.value })}
              />
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between space-x-2 pt-6">
              <Label htmlFor="isPublic" className="text-sm">
                Public Challenge
              </Label>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Challenge'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateChallengeDialog;
