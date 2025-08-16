"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { logger } from '@/lib/logger';

// Mock data for available platforms to integrate with
const availablePlatforms = [
  {
    id: "twitter",
    name: "Twitter / X",
    icon: Twitter,
    description: "Connect your Twitter account to share and manage content.",
    color: "bg-blue-500 hover:bg-blue-600",
    textColor: "text-white", 
  },
  {
    id: "facebook-social",
    name: "Facebook",
    icon: Facebook,
    description: "Share posts and insights from your Facebook page.",
    color: "bg-blue-600 hover:bg-blue-700",
    textColor: "text-white",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    description: "Connect to your Instagram to view engagement metrics.",
    color: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
    textColor: "text-white",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    description: "Share professional content on your LinkedIn profile.",
    color: "bg-blue-700 hover:bg-blue-800",
    textColor: "text-white",
  },
];

export function SocialIntegration() {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<string[]>([]);

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    
    try {
      // For Facebook, use the real OAuth flow
      if (platformId === "facebook-social") {
        // Redirect to the Facebook OAuth connect endpoint
        window.location.href = "/api/auth/facebook/connect";
        return;
      }
      
      // For other platforms, keep the mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock API call to save the connection
      await axios.post("/api/social/connect", { platform: platformId });
      
      setConnected(prev => [...prev, platformId]);
      
      toast({
        title: "Connected successfully",
        description: `Your ${platformId.replace('-social', '')} account has been connected.`,
      });
    } catch (error: any) {
      logger.error("Failed to connect:", error);
      toast({
        title: "Connection failed",
        description: "There was an error connecting your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (platformId !== "facebook-social") {
        setConnecting(null);
      }
    }
  };

  const handleDisconnect = async (platformId: string) => {
    setConnecting(platformId);
    
    try {
      // Mock API call to remove the connection
      await axios.delete(`/api/social/connect?platform=${platformId}`);
      
      setConnected(prev => prev.filter(id => id !== platformId));
      
      toast({
        title: "Disconnected successfully",
        description: `Your ${platformId} account has been disconnected.`,
      });
    } catch (error: any) {
      logger.error("Failed to disconnect:", error);
      toast({
        title: "Disconnection failed",
        description: "There was an error disconnecting your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Social Media Integration</h2>
        <p className="text-muted-foreground">
          Connect your social media accounts to manage them all in one place.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {availablePlatforms.map((platform) => (
          <Card key={platform.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <platform.icon className="h-5 w-5" />
                  {platform.name}
                </CardTitle>
                {connected.includes(platform.id) && (
                  <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Connected
                  </span>
                )}
              </div>
              <CardDescription>{platform.description}</CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              {!connected.includes(platform.id) ? (
                <Button 
                  className={`${platform.color} ${platform.textColor} w-full`}
                  onClick={() => handleConnect(platform.id)}
                  disabled={connecting === platform.id}
                >
                  {connecting === platform.id ? "Connecting..." : "Connect"}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleDisconnect(platform.id)}
                  disabled={connecting === platform.id}
                >
                  {connecting === platform.id ? "Disconnecting..." : "Disconnect"}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 