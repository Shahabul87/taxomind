"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, UserMinus } from "lucide-react";

interface MemberSettingsProps {
  group: any;
  currentUser: any;
  isCreator: boolean;
}

export function MemberSettings({ group, currentUser, isCreator }: MemberSettingsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Group Members</h2>
        {isCreator && (
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Members
          </Button>
        )}
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="space-y-4">
        {/* This is a placeholder - you'll need to implement the actual member list */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={currentUser?.image} />
                <AvatarFallback>{currentUser?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{currentUser?.name}</p>
                <p className="text-sm text-gray-500">Creator</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 