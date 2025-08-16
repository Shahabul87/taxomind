"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, FileText, Clock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content?: string | null;
}

interface NoteContentProps {
  content: Note[];
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export const NoteContent = ({ 
  content, 
  courseId, 
  chapterId, 
  sectionId 
}: NoteContentProps) => {
  if (!content || content.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          No Notes Available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Study notes will appear here when available.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {content.map((note, index) => (
        <motion.div
          key={note.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="group hover:shadow-md transition-all duration-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {note.title}
                </CardTitle>
                <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 ml-2" />
              </div>
            </CardHeader>
            
            <CardContent>
              {note.content && (
                <div className="space-y-3">
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 line-clamp-3"
                    dangerouslySetInnerHTML={{ 
                      __html: note.content.substring(0, 150) + (note.content.length > 150 ? '...' : '') 
                    }}
                  />
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>Study Note</span>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      Notes
                    </Badge>
                  </div>
                </div>
              )}
              
              {!note.content && (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Content coming soon
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}; 