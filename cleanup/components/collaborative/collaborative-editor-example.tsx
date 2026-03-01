'use client';

import React, { useState, useCallback } from 'react';
import { useCollaborativeEditing } from '@/hooks/use-collaborative-editing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  MessageCircle, 
  Lock, 
  Unlock, 
  Eye, 
  Edit3,
  Crown,
  Shield,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface CollaborativeEditorProps {
  contentType: string;
  contentId: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

export function CollaborativeEditorExample({
  contentType,
  contentId,
  initialContent = '',
  onContentChange,
}: CollaborativeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [newComment, setNewComment] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const {
    collaborativeSession,
    isLoading,
    error,
    typingUsers,
    comments,
    canEdit,
    canComment,
    canModerate,
    isAdmin,
    sendOperation,
    updateCursor,
    addComment,
    resolveComment,
    requestLock,
    releaseLock,
    isConnected,
    participantCount,
  } = useCollaborativeEditing({
    contentType,
    contentId,
    onOperationReceived: (operation) => {
      // Apply operation to content
      if (operation.type === 'insert') {
        const newContent = content.slice(0, operation.position) + 
                          operation.content + 
                          content.slice(operation.position);
        setContent(newContent);
        onContentChange?.(newContent);
      } else if (operation.type === 'delete') {
        const newContent = content.slice(0, operation.position) + 
                          content.slice(operation.position + (operation.length || 0));
        setContent(newContent);
        onContentChange?.(newContent);
      }
    },
    onUserJoined: (user) => {
      console.log('User joined:', user.name);
    },
    onUserLeft: (userId) => {
      console.log('User left:', userId);
    },
    onCommentAdded: (comment) => {
      console.log('Comment added:', comment.content);
    },
    onError: (error) => {
      console.error('Collaborative error:', error);
    },
  });

  const handleContentChange = useCallback((newContent: string) => {
    if (!canEdit) {
      toast.error('You don&apos;t have permission to edit');
      return;
    }

    const oldLength = content.length;
    const newLength = newContent.length;

    if (newLength > oldLength) {
      // Insert operation
      const insertPosition = content.length;
      const insertedContent = newContent.slice(oldLength);
      
      sendOperation({
        id: `op_${Date.now()}_${Math.random()}`,
        type: 'insert',
        position: insertPosition,
        content: insertedContent,
        revision: 1,
      });
    } else if (newLength < oldLength) {
      // Delete operation
      const deletePosition = newLength;
      const deleteLength = oldLength - newLength;
      
      sendOperation({
        id: `op_${Date.now()}_${Math.random()}`,
        type: 'delete',
        position: deletePosition,
        length: deleteLength,
        revision: 1,
      });
    }

    setContent(newContent);
    onContentChange?.(newContent);
  }, [content, canEdit, sendOperation, onContentChange]);

  const handleCursorChange = useCallback((position: number) => {
    updateCursor({
      position,
      isTyping: true,
    });
  }, [updateCursor]);

  const handleAddComment = useCallback(() => {
    if (!canComment || !newComment.trim()) return;

    addComment({
      content: newComment.trim(),
      position: content.length,
      type: 'COMMENT',
    });

    setNewComment('');
  }, [canComment, newComment, content.length, addComment]);

  const handleLockToggle = useCallback(() => {
    if (!canModerate) {
      toast.error('You don&apos;t have permission to lock/unlock');
      return;
    }

    if (isLocked) {
      releaseLock();
      setIsLocked(false);
      toast.success('Content unlocked');
    } else {
      requestLock('SOFT');
      setIsLocked(true);
      toast.success('Content locked');
    }
  }, [canModerate, isLocked, requestLock, releaseLock]);

  const getRoleIcon = (permissions: string[]) => {
    if (permissions.includes('ADMIN')) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (permissions.includes('MODERATE')) return <Shield className="w-4 h-4 text-blue-500" />;
    if (permissions.includes('WRITE')) return <Edit3 className="w-4 h-4 text-green-500" />;
    return <Eye className="w-4 h-4 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Initializing collaborative editing...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Collaborative Status Bar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Collaborative Session
              {isConnected ? (
                <Badge variant="success" className="text-xs">Connected</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">Disconnected</Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {getRoleIcon(collaborativeSession?.userPermissions || [])}
              <span className="text-xs text-gray-600">
                {collaborativeSession?.userRole || 'Viewer'}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
              
              {typingUsers.length > 0 && (
                <span className="text-blue-600">
                  {typingUsers.length} user{typingUsers.length !== 1 ? 's' : ''} typing...
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {canModerate && (
                <Button
                  size="sm"
                  variant={isLocked ? "destructive" : "outline"}
                  onClick={handleLockToggle}
                  className="h-6"
                >
                  {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {isLocked ? 'Unlock' : 'Lock'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants List */}
      {collaborativeSession && collaborativeSession.participants.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Participants</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {collaborativeSession.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: participant.cursorColor }}
                  />
                  <span className="text-xs">{participant.name}</span>
                  {participant.isTyping && (
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Content Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onSelect={(e) => {
              const target = e.target as HTMLTextAreaElement;
              handleCursorChange(target.selectionStart);
            }}
            placeholder={canEdit ? "Start typing..." : "You don't have edit permissions"}
            className="min-h-[200px] resize-none"
            disabled={!canEdit || isLocked}
          />
          
          {isLocked && (
            <p className="text-xs text-orange-600 mt-2">
              Content is locked for editing
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Comments ({comments.filter(c => c.status === 'ACTIVE').length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Add new comment */}
            {canComment && (
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Add
                </Button>
              </div>
            )}

            {/* Comments list */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {comments
                .filter(comment => comment.status === 'ACTIVE')
                .map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{comment.authorName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {comment.type}
                        </Badge>
                        {canModerate && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resolveComment(comment.id)}
                            className="h-5 text-xs"
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                    <span className="text-xs text-gray-500">
                      {comment.createdAt.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              
              {comments.filter(c => c.status === 'ACTIVE').length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No comments yet
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Your Permissions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1">
            {collaborativeSession?.userPermissions.map((permission) => (
              <Badge key={permission} variant="secondary" className="text-xs">
                {permission}
              </Badge>
            ))}
            
            {(!collaborativeSession?.userPermissions || collaborativeSession.userPermissions.length === 0) && (
              <Badge variant="outline" className="text-xs">No permissions</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}