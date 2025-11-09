"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StickyNote,
  X,
  Save,
  Download,
  Trash2,
  Plus,
  ChevronRight,
  Clock,
  Tag,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Note {
  id: string;
  content: string;
  timestamp: Date;
  sectionId: string;
  tags: string[];
}

interface QuickNotesPanelProps {
  sectionId: string;
  sectionTitle: string;
  courseId: string;
  userId: string;
}

export const QuickNotesPanel = ({
  sectionId,
  sectionTitle,
  courseId,
  userId
}: QuickNotesPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const storageKey = `quick_notes_${courseId}_${userId}`;

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotes(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })));
      } catch (error) {
        console.error("Failed to load notes:", error);
      }
    }
  }, [storageKey]);

  // Save notes to localStorage
  const saveNotes = (updatedNotes: Note[]) => {
    localStorage.setItem(storageKey, JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const addNote = () => {
    if (!currentNote.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      content: currentNote,
      timestamp: new Date(),
      sectionId,
      tags
    };

    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
    setCurrentNote("");
    setTags([]);
    toast.success("Note saved!");
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    saveNotes(updated);
    toast.success("Note deleted");
  };

  const exportNotes = () => {
    const content = notes
      .filter(n => n.sectionId === sectionId)
      .map(n => `[${n.timestamp.toLocaleString()}]\n${n.content}\nTags: ${n.tags.join(", ")}\n\n`)
      .join("---\n\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-${sectionTitle.replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Notes exported!");
  };

  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags([...tags, newTag.trim()]);
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const sectionNotes = notes.filter(n =>
    n.sectionId === sectionId &&
    (searchQuery === "" || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <motion.div
          className="fixed right-6 bottom-6 z-40"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 group relative"
          >
            <StickyNote className="w-6 h-6 group-hover:scale-110 transition-transform" />
            {sectionNotes.length > 0 && (
              <Badge className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                {sectionNotes.length}
              </Badge>
            )}
          </Button>
        </motion.div>
      )}

      {/* Notes Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-96 z-50 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-yellow-500 to-orange-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <StickyNote className="w-5 h-5" />
                  Quick Notes
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-sm text-white/90">{sectionTitle}</p>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* New Note */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
              <Textarea
                placeholder="Write a note for this section..."
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                className="min-h-[100px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey) {
                    addNote();
                  }
                }}
              />

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addTag}
                  >
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={addNote}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                  disabled={!currentNote.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Note
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={exportNotes}
                  disabled={sectionNotes.length === 0}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sectionNotes.length === 0 ? (
                <div className="text-center py-12">
                  <StickyNote className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No notes yet. Start taking notes!
                  </p>
                </div>
              ) : (
                sectionNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="w-3 h-3" />
                            {note.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-red-500"
                            onClick={() => deleteNote(note.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {note.content}
                        </p>
                        {note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer Tip */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                💡 Tip: Press <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border rounded text-xs">Cmd+Enter</kbd> to save quickly
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
