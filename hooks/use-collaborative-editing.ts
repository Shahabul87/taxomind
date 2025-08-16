import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import io, { Socket } from 'socket.io-client';
import { toast } from 'sonner';

export interface CollaborativeSession {
  sessionId: string;
  roomId: string;
  participants: CollaborativeUser[];
  isConnected: boolean;
  userPermissions: string[];
  userRole: string;
}

export interface CollaborativeUser {
  id: string;
  name: string;
  image?: string;
  cursorColor: string;
  isTyping: boolean;
  cursor?: {
    position: number;
    line?: number;
    column?: number;
    selection?: { start: number; end: number; };
  };
}

export interface CollaborativeOperation {
  id: string;
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
  userId: string;
  timestamp: Date;
  clientId: string;
  revision: number;
}

export interface CollaborativeComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  position: number;
  line?: number;
  column?: number;
  type: 'COMMENT' | 'SUGGESTION' | 'QUESTION' | 'ISSUE';
  status: 'ACTIVE' | 'RESOLVED' | 'DELETED';
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

interface UseCollaborativeEditingProps {
  contentType: string;
  contentId: string;
  onOperationReceived?: (operation: CollaborativeOperation) => void;
  onCursorUpdate?: (userId: string, cursor: any) => void;
  onCommentAdded?: (comment: CollaborativeComment) => void;
  onCommentResolved?: (commentId: string) => void;
  onUserJoined?: (user: CollaborativeUser) => void;
  onUserLeft?: (userId: string) => void;
  onError?: (error: string) => void;
}

export function useCollaborativeEditing({
  contentType,
  contentId,
  onOperationReceived,
  onCursorUpdate,
  onCommentAdded,
  onCommentResolved,
  onUserJoined,
  onUserLeft,
  onError,
}: UseCollaborativeEditingProps) {
  const { data: session } = useSession();
  const [collaborativeSession, setCollaborativeSession] = useState<CollaborativeSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [comments, setComments] = useState<CollaborativeComment[]>([]);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const operationQueueRef = useRef<CollaborativeOperation[]>([]);

  // Initialize collaborative session
  const initializeSession = useCallback(async () => {
    if (!session?.user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if collaborative editing is already enabled
      const response = await fetch(
        `/api/collaborative/initialize?contentType=${contentType}&contentId=${contentId}`
      );
      
      let sessionData;
      
      if (response.ok) {
        const data = await response.json();
        if (data.enabled) {
          sessionData = data;
        } else {
          // Enable collaborative editing
          const enableResponse = await fetch('/api/collaborative/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contentType, contentId }),
          });
          
          if (!enableResponse.ok) {
            throw new Error('Failed to enable collaborative editing');
          }
          
          sessionData = await enableResponse.json();
        }
      } else {
        throw new Error('Failed to check collaborative session');
      }

      // Connect to WebSocket
      const socket = io('/collaborative', {
        auth: {
          token: 'user-token', // In real implementation, get from session
        },
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      // Handle connection events
      socket.on('connect', () => {
        console.log('Connected to collaborative server');
        
        // Join the session
        socket.emit('join-session', {
          sessionId: sessionData.sessionId,
          contentType,
          contentId,
        });
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from collaborative server');
        setCollaborativeSession(prev => prev ? { ...prev, isConnected: false } : null);
        
        // Attempt to reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          socket.connect();
        }, 3000);
      });

      // Handle session events
      socket.on('session-joined', (data) => {
        setCollaborativeSession({
          sessionId: data.sessionId,
          roomId: data.roomId,
          participants: data.participants || [],
          isConnected: true,
          userPermissions: data.userPermissions || [],
          userRole: data.userRole || 'VIEWER',
        });
        
        toast.success('Joined collaborative session');
      });

      socket.on('user-joined', (data) => {
        setCollaborativeSession(prev => prev ? {
          ...prev,
          participants: [...prev.participants, data.user],
        } : null);
        
        onUserJoined?.(data.user);
        toast.info(`${data.user.name} joined the session`);
      });

      socket.on('user-left', (data) => {
        setCollaborativeSession(prev => prev ? {
          ...prev,
          participants: prev.participants.filter(p => p.id !== data.userId),
        } : null);
        
        onUserLeft?.(data.userId);
      });

      // Handle document operations
      socket.on('document-operation', (data) => {
        const operation: CollaborativeOperation = {
          ...data.operation,
          timestamp: new Date(data.timestamp),
        };
        
        onOperationReceived?.(operation);
      });

      // Handle cursor updates
      socket.on('cursor-update', (data) => {
        setCollaborativeSession(prev => {
          if (!prev) return null;
          
          const updatedParticipants = prev.participants.map(p => 
            p.id === data.userId 
              ? { 
                  ...p, 
                  isTyping: data.isTyping,
                  cursor: {
                    position: data.position,
                    line: data.line,
                    column: data.column,
                    selection: data.selection,
                  }
                }
              : p
          );
          
          return { ...prev, participants: updatedParticipants };
        });
        
        onCursorUpdate?.(data.userId, data);
      });

      // Handle typing indicators
      socket.on('typing-status-changed', (data) => {
        setTypingUsers(prev => {
          if (data.isTyping) {
            return prev.includes(data.userId) ? prev : [...prev, data.userId];
          } else {
            return prev.filter(id => id !== data.userId);
          }
        });
      });

      // Handle comments
      socket.on('comment-added', (data) => {
        const comment: CollaborativeComment = {
          ...data.comment,
          createdAt: new Date(data.comment.createdAt),
          updatedAt: new Date(data.comment.updatedAt),
          resolvedAt: data.comment.resolvedAt ? new Date(data.comment.resolvedAt) : undefined,
        };
        
        setComments(prev => [...prev, comment]);
        onCommentAdded?.(comment);
        toast.success('New comment added');
      });

      socket.on('comment-resolved', (data) => {
        setComments(prev => 
          prev.map(comment => 
            comment.id === data.commentId 
              ? { ...comment, status: 'RESOLVED' as const, resolvedAt: new Date() }
              : comment
          )
        );
        
        onCommentResolved?.(data.commentId);
        toast.success('Comment resolved');
      });

      // Handle errors
      socket.on('error', (data) => {
        const errorMessage = data.message || 'Unknown error occurred';
        setError(errorMessage);
        onError?.(errorMessage);
        toast.error(errorMessage);
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initialize collaborative editing';
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user, contentType, contentId, onOperationReceived, onCursorUpdate, onCommentAdded, onCommentResolved, onUserJoined, onUserLeft, onError]);

  // Send document operation
  const sendOperation = useCallback((operation: Omit<CollaborativeOperation, 'userId' | 'timestamp' | 'clientId'>) => {
    if (!socketRef.current || !collaborativeSession || !session?.user) return;

    const fullOperation: CollaborativeOperation = {
      ...operation,
      userId: session.user.id!,
      timestamp: new Date(),
      clientId: socketRef.current.id || 'unknown',
    };

    socketRef.current.emit('document-operation', {
      sessionId: collaborativeSession.sessionId,
      operation: fullOperation,
    });
  }, [collaborativeSession, session?.user]);

  // Update cursor position
  const updateCursor = useCallback((cursor: {
    position: number;
    line?: number;
    column?: number;
    selection?: { start: number; end: number; };
    isTyping?: boolean;
  }) => {
    if (!socketRef.current || !collaborativeSession) return;

    socketRef.current.emit('cursor-update', {
      sessionId: collaborativeSession.sessionId,
      ...cursor,
    });
  }, [collaborativeSession]);

  // Add comment
  const addComment = useCallback((comment: {
    content: string;
    position: number;
    line?: number;
    column?: number;
    type?: 'COMMENT' | 'SUGGESTION' | 'QUESTION' | 'ISSUE';
    parentId?: string;
  }) => {
    if (!socketRef.current || !collaborativeSession) return;

    socketRef.current.emit('add-comment', {
      sessionId: collaborativeSession.sessionId,
      ...comment,
    });
  }, [collaborativeSession]);

  // Resolve comment
  const resolveComment = useCallback((commentId: string) => {
    if (!socketRef.current || !collaborativeSession) return;

    socketRef.current.emit('resolve-comment', {
      sessionId: collaborativeSession.sessionId,
      commentId,
    });
  }, [collaborativeSession]);

  // Request lock
  const requestLock = useCallback((lockType: 'SOFT' | 'HARD' | 'SECTION', section?: string) => {
    if (!socketRef.current || !collaborativeSession) return;

    socketRef.current.emit('request-lock', {
      sessionId: collaborativeSession.sessionId,
      lockType,
      section,
    });
  }, [collaborativeSession]);

  // Release lock
  const releaseLock = useCallback((section?: string) => {
    if (!socketRef.current || !collaborativeSession) return;

    socketRef.current.emit('release-lock', {
      sessionId: collaborativeSession.sessionId,
      section,
    });
  }, [collaborativeSession]);

  // Disconnect from session
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setCollaborativeSession(null);
    setTypingUsers([]);
    setComments([]);
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (session?.user && contentType && contentId) {
      initializeSession();
    }

    return () => {
      disconnect();
    };
  }, [session?.user, contentType, contentId, initializeSession, disconnect]);

  // Check permissions
  const hasPermission = useCallback((permission: string) => {
    return collaborativeSession?.userPermissions.includes(permission) || false;
  }, [collaborativeSession?.userPermissions]);

  const canEdit = hasPermission('WRITE');
  const canComment = hasPermission('COMMENT');
  const canModerate = hasPermission('MODERATE');
  const isAdmin = hasPermission('ADMIN');

  return {
    // State
    collaborativeSession,
    isLoading,
    error,
    typingUsers,
    comments,
    
    // Permissions
    canEdit,
    canComment,
    canModerate,
    isAdmin,
    hasPermission,
    
    // Actions
    sendOperation,
    updateCursor,
    addComment,
    resolveComment,
    requestLock,
    releaseLock,
    disconnect,
    
    // Utilities
    isConnected: collaborativeSession?.isConnected || false,
    participantCount: collaborativeSession?.participants.length || 0,
  };
}