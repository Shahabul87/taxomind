"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BecomeInstructorFormProps {
  userId: string;
}

export function BecomeInstructorForm({ userId }: BecomeInstructorFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!agreed) {
      toast.error("Please agree to the instructor terms and conditions");
      return;
    }

    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      expertise: formData.get("expertise"),
      experience: formData.get("experience"),
      bio: formData.get("bio"),
      linkedIn: formData.get("linkedIn"),
      website: formData.get("website"),
      teachingGoals: formData.get("teachingGoals"),
    };

    try {
      const response = await fetch("/api/become-instructor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit application");
      }

      toast.success("Welcome to Taxomind Instructors! You can now create courses.");
      router.push("/dashboard?tab=teaching");
      router.refresh();
    } catch (error) {
      console.error("Error becoming instructor:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="expertise">
            Area of Expertise <span className="text-red-500">*</span>
          </Label>
          <Select name="expertise" required>
            <SelectTrigger>
              <SelectValue placeholder="Select your primary expertise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="web-development">Web Development</SelectItem>
              <SelectItem value="mobile-development">Mobile Development</SelectItem>
              <SelectItem value="data-science">Data Science</SelectItem>
              <SelectItem value="machine-learning">Machine Learning</SelectItem>
              <SelectItem value="cloud-computing">Cloud Computing</SelectItem>
              <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
              <SelectItem value="ui-ux-design">UI/UX Design</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">
            Years of Experience <span className="text-red-500">*</span>
          </Label>
          <Select name="experience" required>
            <SelectTrigger>
              <SelectValue placeholder="Select years of experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-2">0-2 years</SelectItem>
              <SelectItem value="3-5">3-5 years</SelectItem>
              <SelectItem value="6-10">6-10 years</SelectItem>
              <SelectItem value="10+">10+ years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">
          Professional Bio <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="bio"
          name="bio"
          placeholder="Tell us about your professional background and experience..."
          className="min-h-[120px]"
          required
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="linkedIn">
            LinkedIn Profile (Optional)
          </Label>
          <Input
            id="linkedIn"
            name="linkedIn"
            type="url"
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">
            Personal Website (Optional)
          </Label>
          <Input
            id="website"
            name="website"
            type="url"
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="teachingGoals">
          What do you want to teach? <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="teachingGoals"
          name="teachingGoals"
          placeholder="Describe the courses you plan to create and what students will learn..."
          className="min-h-[100px]"
          required
        />
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="terms"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked as boolean)}
        />
        <div className="space-y-1">
          <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
            I agree to the{" "}
            <a href="/instructor-terms" className="text-primary hover:underline">
              Instructor Terms and Conditions
            </a>{" "}
            and understand that:
          </Label>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4">
            <li>• I will create original, high-quality content</li>
            <li>• I will respond to student questions within 48 hours</li>
            <li>• Taxomind takes a platform fee from course sales</li>
            <li>• I maintain ownership of my content</li>
          </ul>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !agreed}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting Application...
          </>
        ) : (
          "Become an Instructor"
        )}
      </Button>
    </form>
  );
}