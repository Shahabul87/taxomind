"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import Image from "next/image";
import { logger } from '@/lib/logger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  testUrl?: string;
}

const ButtonWithClick = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", testUrl, ...props }, ref) => {
    
    const handleTestClick = async () => {
      if (!testUrl) return;
      
      try {

        toast.info("Fetching metadata...", {
          id: "fetching-metadata",
          duration: 3000
        });
        
        const response = await axios.get(`/api/fetch-video-metadata?url=${encodeURIComponent(testUrl)}`);

        if (response.data) {
          toast.dismiss("fetching-metadata");
          
          // Create a more detailed toast for successful fetch
          toast.success(
            <div className="space-y-2">
              <p className="font-semibold">Video Metadata Retrieved</p>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Title:</span> {response.data.title || "Not found"}</p>
                {response.data.author_name && (
                  <p><span className="font-medium">Author:</span> {response.data.author_name}</p>
                )}
                <p><span className="font-medium">Thumbnail:</span> {response.data.thumbnail_url ? "✓" : "✗"}</p>
                {response.data.is_fallback && (
                  <p className="text-yellow-500">Used fallback metadata generation</p>
                )}
              </div>
            </div>,
            {
              duration: 5000,
            }
          );
          
          // If we have a thumbnail, show it in another toast
          if (response.data.thumbnail_url) {
            toast(
              <div className="space-y-2">
                <p className="font-semibold">Thumbnail Preview</p>
                <Image 
                  src={response.data.thumbnail_url} 
                  alt="Video thumbnail" 
                  width={300}
                  height={200}
                  className="w-full h-auto rounded-md"
                />
              </div>,
              {
                duration: 5000,
              }
            );
          }
        } else {
          toast.error("No metadata returned");
        }
      } catch (error) {
        logger.error("Test fetch error:", error);
        toast.error("Error fetching metadata");
      }
    };
    
    return (
      <button
        className={cn(
          "rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        onClick={testUrl ? handleTestClick : undefined}
        ref={ref}
        {...props}
      />
    );
  }
);

ButtonWithClick.displayName = "ButtonWithClick";

export { ButtonWithClick }; 