import { StickyNote, Pin, Hash, Calendar, Edit3, Lightbulb, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotesContentProps {
  notes: Array<{
    id: string;
    title: string;
    content?: string | null;
    type?: string | null; // 'important', 'tip', 'warning', 'info', 'summary'
    isPinned?: boolean;
    tags?: string[];
    createdAt?: Date | null;
    updatedAt?: Date | null;
    priority?: 'low' | 'medium' | 'high' | null;
  }>;
}

export const NotesContent = ({ notes }: NotesContentProps) => {
  const formatDate = (date?: Date | null) => {
    if (!date) return "No date";
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNoteTypeConfig = (type?: string | null) => {
    switch (type?.toLowerCase()) {
      case 'important':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'bg-red-50 border-red-200 text-red-700',
          headerColor: 'bg-red-100',
          label: 'Important'
        };
      case 'tip':
        return {
          icon: <Lightbulb className="w-4 h-4" />,
          color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
          headerColor: 'bg-yellow-100',
          label: 'Tip'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'bg-orange-50 border-orange-200 text-orange-700',
          headerColor: 'bg-orange-100',
          label: 'Warning'
        };
      case 'summary':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'bg-green-50 border-green-200 text-green-700',
          headerColor: 'bg-green-100',
          label: 'Summary'
        };
      case 'info':
      default:
        return {
          icon: <StickyNote className="w-4 h-4" />,
          color: 'bg-blue-50 border-blue-200 text-blue-700',
          headerColor: 'bg-blue-100',
          label: 'Note'
        };
    }
  };

  const getPriorityColor = (priority?: 'low' | 'medium' | 'high' | null) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-slate-400';
    }
  };

  const getContentPreview = (content?: string | null) => {
    if (!content) return "No content available...";
    const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  // Sort notes: pinned first, then by priority, then by date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority || 'low'];
    const bPriority = priorityOrder[b.priority || 'low'];
    
    if (aPriority !== bPriority) return bPriority - aPriority;
    
    const aDate = new Date(a.updatedAt || a.createdAt || 0);
    const bDate = new Date(b.updatedAt || b.createdAt || 0);
    return bDate.getTime() - aDate.getTime();
  });

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <StickyNote className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Notes Available
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Study notes will appear here when available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Study Notes ({notes.length})
        </h3>
        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
          <StickyNote className="w-3 h-3 mr-1" />
          Notes
        </Badge>
      </div>

      <div className="grid gap-4">
        {sortedNotes.map((note, index) => {
          const typeConfig = getNoteTypeConfig(note.type);
          
          return (
            <Card 
              key={note.id} 
              className={`group hover:shadow-md transition-all duration-200 border-2 ${typeConfig.color} relative`}
            >
              {/* Priority Indicator */}
              {note.priority && (
                <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${getPriorityColor(note.priority)}`}></div>
              )}
              
              {/* Pin Indicator */}
              {note.isPinned && (
                <div className="absolute top-2 right-2">
                  <Pin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
              )}

              <CardHeader className={`pb-2 ${typeConfig.headerColor} -m-px rounded-t-lg`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {typeConfig.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {typeConfig.label}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Note {index + 1}
                      </span>
                    </div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                      {note.title}
                    </h4>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-3">
                {/* Note Content */}
                <div className="mb-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {getContentPreview(note.content)}
                  </p>
                </div>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs bg-white/50 dark:bg-slate-800/50">
                          <Hash className="w-2 h-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-white/50 dark:bg-slate-800/50">
                          +{note.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Note Metadata */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    {note.createdAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Created {formatDate(note.createdAt)}</span>
                      </div>
                    )}
                    {note.updatedAt && note.updatedAt !== note.createdAt && (
                      <div className="flex items-center gap-1">
                        <Edit3 className="w-3 h-3" />
                        <span>Updated {formatDate(note.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs"
                  >
                    View full note
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Notes Summary */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mt-6">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-slate-600 dark:text-slate-400">
              Total: {notes.length} notes
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Pinned: {notes.filter(n => n.isPinned).length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {notes.some(n => n.type === 'important') && (
              <div className="flex items-center gap-1 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs">Important notes</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 