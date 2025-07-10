"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Users, MessageCircle, History, Save, Share2, Download,
  Eye, EyeOff, Clock, CheckCircle, AlertCircle, MoreHorizontal,
  Undo, Redo, Bold, Italic, Underline, List, Quote, Code,
  Link, Image, Video, Plus, X, Send, Reply, Check
} from 'lucide-react';
import { 
  Operation, 
  Cursor, 
  CollaboratorInfo, 
  Comment, 
  DocumentState,
  realtimeEngine 
} from '@/lib/collaborative-editing/realtime-engine';
import { useAuth } from '@/lib/auth/auth-context';
import { toast } from 'sonner';

interface CollaborativeEditorProps {
  documentId: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
  className?: string;
}

interface EditorState {
  content: string;
  version: number;
  cursors: Map<string, Cursor>;
  collaborators: Map<string, CollaboratorInfo>;
  comments: Comment[];
  isConnected: boolean;
  pendingOperations: Operation[];
}

export function CollaborativeEditor({
  documentId,
  initialContent = '',
  onSave,
  onContentChange,
  readOnly = false,
  className
}: CollaborativeEditorProps) {
  const { user } = useAuth();
  const [editorState, setEditorState] = useState<EditorState>({
    content: initialContent,
    version: 0,
    cursors: new Map(),
    collaborators: new Map(),
    comments: [],
    isConnected: false,
    pendingOperations: []
  });

  const [showCollaborators, setShowCollaborators] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [selectedText, setSelectedText] = useState<{ start: number; end: number } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<number>(0);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize real-time connection
  useEffect(() => {
    if (!user) return;

    const initializeConnection = async () => {
      try {
        // Create or get document
        let document = await realtimeEngine.getDocument(documentId);
        if (!document) {
          document = await realtimeEngine.createDocument(documentId, initialContent, user.id);
        }

        // Join document
        const collaborator = await realtimeEngine.joinDocument(documentId, user.id, {
          name: user.name || 'Anonymous',
          avatar: user.image,
          permissions: {
            canEdit: !readOnly,
            canComment: true,
            canShare: true
          }
        });

        if (collaborator) {
          setEditorState(prev => ({
            ...prev,
            content: document!.content,
            version: document!.version,
            collaborators: new Map([[collaborator.id, collaborator]]),
            isConnected: true
          }));
        }

        // Set up WebSocket connection
        setupWebSocketConnection();

      } catch (error) {
        console.error('Failed to initialize collaborative editor:', error);
        toast.error('Failed to connect to collaborative editor');
      }
    };

    initializeConnection();

    return () => {
      if (user) {
        realtimeEngine.leaveDocument(documentId, user.id);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [documentId, user, initialContent, readOnly]);

  // Set up WebSocket for real-time updates
  const setupWebSocketConnection = useCallback(() => {
    if (!user) return;

    // In a real implementation, this would connect to your WebSocket server
    // For now, we'll simulate real-time events using the engine
    
    realtimeEngine.on('operationApplied', (data) => {
      if (data.documentId === documentId && data.operation.authorId !== user.id) {
        handleRemoteOperation(data.operation);
      }
    });

    realtimeEngine.on('cursorUpdated', (cursor) => {
      if (cursor.authorId !== user.id) {
        setEditorState(prev => ({
          ...prev,
          cursors: new Map(prev.cursors).set(cursor.authorId, cursor)
        }));
      }
    });

    realtimeEngine.on('userJoined', (collaborator) => {
      if (collaborator.id !== user.id) {
        setEditorState(prev => ({
          ...prev,
          collaborators: new Map(prev.collaborators).set(collaborator.id, collaborator)
        }));
        toast.success(`${collaborator.name} joined the document`);
      }
    });

    realtimeEngine.on('userLeft', ({ userId }) => {
      if (userId !== user.id) {
        setEditorState(prev => {
          const newCollaborators = new Map(prev.collaborators);
          const collaborator = newCollaborators.get(userId);
          newCollaborators.delete(userId);
          
          const newCursors = new Map(prev.cursors);
          newCursors.delete(userId);
          
          if (collaborator) {
            toast.info(`${collaborator.name} left the document`);
          }
          
          return {
            ...prev,
            collaborators: newCollaborators,
            cursors: newCursors
          };
        });
      }
    });

    realtimeEngine.on('commentAdded', (data) => {
      if (data.documentId === documentId) {
        setEditorState(prev => ({
          ...prev,
          comments: [...prev.comments, data.comment]
        }));
      }
    });

  }, [documentId, user]);

  // Handle remote operations
  const handleRemoteOperation = useCallback((operation: Operation) => {
    setEditorState(prev => {
      const newContent = applyOperationToContent(prev.content, operation);
      onContentChange?.(newContent);
      
      return {
        ...prev,
        content: newContent,
        version: prev.version + 1
      };
    });
  }, [onContentChange]);

  // Apply operation to content (simplified)
  const applyOperationToContent = (content: string, operation: Operation): string => {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position);
      
      case 'delete':
        return content.slice(0, operation.position) + 
               content.slice(operation.position + (operation.length || 0));
      
      default:
        return content;
    }
  };

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    if (!user || readOnly) return;

    const oldContent = editorState.content;
    if (oldContent === newContent) return;

    // Create operation
    const operation: Operation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: newContent.length > oldContent.length ? 'insert' : 'delete',
      position: findChangePosition(oldContent, newContent),
      content: newContent.length > oldContent.length ? 
               newContent.slice(findChangePosition(oldContent, newContent)) : undefined,
      length: newContent.length < oldContent.length ? 
              oldContent.length - newContent.length : undefined,
      authorId: user.id,
      timestamp: Date.now(),
      documentId
    };

    // Apply operation locally
    setEditorState(prev => ({
      ...prev,
      content: newContent,
      version: prev.version + 1,
      pendingOperations: [...prev.pendingOperations, operation]
    }));

    // Send to server
    realtimeEngine.applyOperation(documentId, operation);
    onContentChange?.(newContent);

  }, [editorState.content, user, readOnly, documentId, onContentChange]);

  // Find where content changed (simplified)
  const findChangePosition = (oldContent: string, newContent: string): number => {
    let i = 0;
    while (i < Math.min(oldContent.length, newContent.length) && oldContent[i] === newContent[i]) {
      i++;
    }
    return i;
  };

  // Handle cursor movement
  const handleCursorChange = useCallback(() => {
    if (!user || !editorRef.current) return;

    const position = editorRef.current.selectionStart || 0;
    const selection = editorRef.current.selectionStart !== editorRef.current.selectionEnd ? {
      start: editorRef.current.selectionStart || 0,
      end: editorRef.current.selectionEnd || 0
    } : undefined;

    cursorPositionRef.current = position;
    selectionRef.current = selection || null;

    const cursor: Cursor = {
      id: `cursor_${user.id}`,
      authorId: user.id,
      position,
      selection,
      color: '#3b82f6', // This would come from the collaborator info
      name: user.name || 'Anonymous'
    };

    realtimeEngine.updateCursor(documentId, cursor);
  }, [user, documentId]);

  // Handle text selection for comments
  const handleTextSelection = useCallback(() => {
    if (!editorRef.current) return;

    const start = editorRef.current.selectionStart || 0;
    const end = editorRef.current.selectionEnd || 0;

    if (start !== end) {
      setSelectedText({ start, end });
    } else {
      setSelectedText(null);
    }
  }, []);

  // Add comment
  const handleAddComment = useCallback(async () => {
    if (!user || !selectedText || !commentText.trim()) return;

    try {
      await realtimeEngine.addComment(documentId, {
        authorId: user.id,
        content: commentText,
        position: selectedText.start,
        highlightRange: selectedText
      });

      setCommentText('');
      setSelectedText(null);
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
      console.error(error);
    }
  }, [user, documentId, selectedText, commentText]);

  // Save document
  const handleSave = useCallback(async () => {
    try {
      await realtimeEngine.createCheckpoint(documentId, user?.id || 'anonymous', 'Manual save');
      onSave?.(editorState.content);
      toast.success('Document saved');
    } catch (error) {
      toast.error('Failed to save document');
      console.error(error);
    }
  }, [documentId, user, editorState.content, onSave]);

  // Render cursor indicators
  const renderCursorIndicators = () => {
    if (!editorRef.current) return null;

    return Array.from(editorState.cursors.values()).map(cursor => (
      <div
        key={cursor.id}
        className="absolute pointer-events-none z-10"
        style={{
          left: `${cursor.position * 8}px`, // Approximate character width
          top: '0px',
          borderLeft: `2px solid ${cursor.color}`,
          height: '1.2em'
        }}
      >
        <div
          className="absolute -top-6 left-0 px-1 py-0.5 text-xs text-white rounded"
          style={{ backgroundColor: cursor.color }}
        >
          {cursor.name}
        </div>
      </div>
    ));
  };

  // Render collaborators list
  const renderCollaborators = () => (
    <Card className="w-64">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4" />
          Collaborators ({editorState.collaborators.size})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from(editorState.collaborators.values()).map(collaborator => (
            <div key={collaborator.id} className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={collaborator.avatar} />
                <AvatarFallback>
                  {collaborator.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {collaborator.name}
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: collaborator.color }}
                  />
                  <span className="text-xs text-gray-500">
                    {collaborator.isActive ? 'Active' : 'Away'}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                {collaborator.permissions.canEdit && (
                  <Badge variant="outline" className="text-xs">Edit</Badge>
                )}
                {collaborator.permissions.canComment && (
                  <Badge variant="outline" className="text-xs">Comment</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Render comments panel
  const renderComments = () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageCircle className="h-4 w-4" />
          Comments ({editorState.comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {editorState.comments.map(comment => (
              <div key={comment.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        {comment.authorId.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-medium">Author</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(comment.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                <p className="text-sm mb-2">{comment.content}</p>
                
                {comment.highlightRange && (
                  <div className="text-xs bg-yellow-100 p-2 rounded">
                    "{editorState.content.slice(comment.highlightRange.start, comment.highlightRange.end)}"
                  </div>
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplyingTo(comment.id)}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                  
                  {!comment.isResolved && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => realtimeEngine.resolveComment(documentId, comment.id, user?.id || '')}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Resolve
                    </Button>
                  )}
                </div>
                
                {comment.replies.length > 0 && (
                  <div className="mt-2 pl-4 border-l-2 border-gray-200">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="py-2">
                        <div className="text-xs font-medium mb-1">
                          Reply Author • {new Date(reply.timestamp).toLocaleTimeString()}
                        </div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {replyingTo === comment.id && (
                  <div className="mt-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (replyText.trim() && user) {
                            realtimeEngine.replyToComment(documentId, comment.id, {
                              authorId: user.id,
                              content: replyText
                            });
                            setReplyText('');
                            setReplyingTo(null);
                          }
                        }}
                      >
                        Reply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {editorState.comments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="mx-auto h-8 w-8 mb-2" />
                <p>No comments yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className={`flex gap-4 ${className}`}>
      {/* Main Editor */}
      <div className="flex-1 space-y-4">
        {/* Toolbar */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCollaborators(!showCollaborators)}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Collaborators
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Comments
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVersionHistory(true)}
                >
                  <History className="h-4 w-4 mr-1" />
                  History
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      editorState.isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-xs text-gray-600">
                    {editorState.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card>
          <CardContent className="p-0">
            <div className="relative">
              {renderCursorIndicators()}
              <Textarea
                ref={editorRef}
                value={editorState.content}
                onChange={(e) => handleContentChange(e.target.value)}
                onSelect={handleTextSelection}
                onMouseUp={handleCursorChange}
                onKeyUp={handleCursorChange}
                readOnly={readOnly}
                className="min-h-[500px] border-0 resize-none focus-visible:ring-0"
                placeholder="Start typing..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Comment Input */}
        {selectedText && !readOnly && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Add comment to selected text:
                </div>
                <div className="text-sm bg-yellow-100 p-2 rounded">
                  "{editorState.content.slice(selectedText.start, selectedText.end)}"
                </div>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write your comment..."
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddComment}>
                    <Send className="h-3 w-3 mr-1" />
                    Add Comment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedText(null);
                      setCommentText('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar Panels */}
      <div className="flex gap-4">
        {showCollaborators && renderCollaborators()}
        {showComments && renderComments()}
      </div>
    </div>
  );
}