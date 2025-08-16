"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Discussions } from "./discussions";
import { Resources } from "./resources";
import { Members } from "./members";
import { Events } from "./events";
import { cn } from "@/lib/utils";
import { MessageCircle, BookOpen, Users, Calendar } from "lucide-react";

interface GroupContentProps {
  group: any;
  currentUser: any;
  isGroupMember: boolean;
}

export const GroupContent = ({ group, currentUser, isGroupMember }: GroupContentProps) => {
  const [activeTab, setActiveTab] = useState("discussions");

  const tabs = [
    { 
      id: "discussions", 
      label: "Discussions", 
      icon: <MessageCircle className="w-4 h-4 mr-2" />,
      count: group.discussions.length
    },
    { 
      id: "resources", 
      label: "Resources", 
      icon: <BookOpen className="w-4 h-4 mr-2" />,
      count: group.resources.length
    },
    { 
      id: "members", 
      label: "Members", 
      icon: <Users className="w-4 h-4 mr-2" />,
      count: group.members.length
    },
    { 
      id: "events", 
      label: "Events", 
      icon: <Calendar className="w-4 h-4 mr-2" />,
      count: 0 // Add this when events are implemented
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
      <Tabs
        defaultValue="discussions"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <div className="border-b border-gray-200 dark:border-gray-700">
          <TabsList className="flex w-full h-auto bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "flex-1 rounded-none px-5 py-3 font-medium text-sm border-b-2 border-transparent",
                  "data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:dark:border-indigo-500",
                  "data-[state=active]:bg-transparent",
                  "transition-all duration-200"
                )}
              >
                <div className="flex items-center justify-center space-x-1">
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="ml-2 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium">
                      {tab.count}
                    </span>
                  )}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="p-4 md:p-5">
          <TabsContent value="discussions" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <Discussions 
              group={group}
              currentUser={currentUser}
              isGroupMember={isGroupMember}
            />
          </TabsContent>

          <TabsContent value="resources" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <Resources 
              group={group}
              currentUser={currentUser}
              isGroupMember={isGroupMember}
            />
          </TabsContent>

          <TabsContent value="members" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <Members 
              group={group}
              currentUser={currentUser}
              isGroupMember={isGroupMember}
            />
          </TabsContent>

          <TabsContent value="events" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <Events 
              group={group}
              currentUser={currentUser}
              isGroupMember={isGroupMember}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}; 