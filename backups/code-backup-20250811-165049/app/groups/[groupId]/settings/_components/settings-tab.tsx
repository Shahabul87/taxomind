"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GeneralSettings } from "./general-settings";
import { PrivacySettings } from "./privacy-settings";
import { MemberSettings } from "./member-settings";
import { RulesSettings } from "./rules-settings";
import { DangerSettings } from "./danger-settings";
import { AlertTriangle, Globe, Lock, MessageSquare, Settings, Shield, Trash, Users } from "lucide-react";

interface SettingsTabProps {
  group: any;
  currentUser: any;
  isCreator: boolean;
}

export function SettingsTab({ group, currentUser, isCreator }: SettingsTabProps) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <Tabs defaultValue="general" onValueChange={setActiveTab} className="w-full">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto scrollbar-hide">
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger 
              value="general" 
              className={`px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:border-indigo-500 dark:data-[state=active]:text-indigo-400`}
            >
              <Settings className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger 
              value="privacy" 
              className={`px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:border-indigo-500 dark:data-[state=active]:text-indigo-400`}
            >
              <Lock className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger 
              value="members" 
              className={`px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:border-indigo-500 dark:data-[state=active]:text-indigo-400`}
            >
              <Users className="w-4 h-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger 
              value="rules" 
              className={`px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:border-indigo-500 dark:data-[state=active]:text-indigo-400`}
            >
              <Shield className="w-4 h-4 mr-2" />
              Rules
            </TabsTrigger>
            {isCreator && (
              <TabsTrigger 
                value="danger" 
                className={`px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-600 dark:data-[state=active]:border-red-500 dark:data-[state=active]:text-red-400`}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Danger Zone
              </TabsTrigger>
            )}
          </TabsList>
        </div>
      </div>

      <div className="p-6">
        <TabsContent value="general" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <GeneralSettings group={group} currentUser={currentUser} isCreator={isCreator} />
        </TabsContent>

        <TabsContent value="privacy" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <PrivacySettings group={group} currentUser={currentUser} isCreator={isCreator} />
        </TabsContent>

        <TabsContent value="members" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <MemberSettings group={group} currentUser={currentUser} isCreator={isCreator} />
        </TabsContent>

        <TabsContent value="rules" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <RulesSettings group={group} currentUser={currentUser} isCreator={isCreator} />
        </TabsContent>

        {isCreator && (
          <TabsContent value="danger" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <DangerSettings group={group} currentUser={currentUser} isCreator={isCreator} />
          </TabsContent>
        )}
      </div>
    </Tabs>
  );
} 