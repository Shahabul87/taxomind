"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  BookOpen,
  Video,
  Music,
  FileText,
  Star,
  Heart,
  ExternalLink,
  Clock
} from "lucide-react";

interface ContentManagerProps {
  userId: string;
}

export function ContentManager({ userId }: ContentManagerProps) {
  const [isAddingContent, setIsAddingContent] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Content Library</h2>
          <p className="text-slate-400">Organize and track your favorite content</p>
        </div>
        
        <Dialog open={isAddingContent} onOpenChange={setIsAddingContent}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add Content</DialogTitle>
              <DialogDescription className="text-slate-400">
                Add a new piece of content to your library
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Content title"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Input
                  placeholder="URL"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsAddingContent(false)}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  Add Content
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingContent(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">Content Library Coming Soon</h3>
          <p className="text-slate-400">
            This comprehensive content management system will help you organize and track your favorite content across all platforms.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 