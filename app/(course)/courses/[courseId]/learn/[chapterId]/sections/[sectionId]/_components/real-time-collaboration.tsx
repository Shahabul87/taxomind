"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';
import { 
  Users, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Share2, 
  MessageCircle, 
  FileText, 
  Pen, 
  Hand, 
  UserPlus, 
  Settings, 
  X,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Monitor,
  MonitorOff,
  Volume2,
  VolumeX,
  Camera,
  Phone,
  PhoneOff,
  Minimize2,
  Maximize2,
  UserCheck,
  Clock,
  Activity,
  Zap,
  Brain,
  Target,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";

// Collaboration interfaces
interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  role: 'student' | 'teacher' | 'mentor' | 'observer';
  joinedAt: Date;
  lastActivity: Date;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  currentFocus?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: 'text' | 'file' | 'drawing' | 'question' | 'answer' | 'system';
  timestamp: Date;
  reactions?: { emoji: string; users: string[] }[];
  isPrivate?: boolean;
  replyTo?: string;
}

interface StudySession {
  id: string;
  title: string;
  description: string;
  hostId: string;
  courseId: string;
  chapterId: string;
  sectionId: string;
  startTime: Date;
  endTime?: Date;
  participants: CollaborationUser[];
  isActive: boolean;
  sessionType: 'study-group' | 'tutoring' | 'discussion' | 'presentation' | 'workshop';
  maxParticipants: number;
  isPublic: boolean;
  tags: string[];
}

interface WhiteboardStroke {
  id: string;
  userId: string;
  path: string;
  color: string;
  width: number;
  timestamp: Date;
}

interface BreakoutRoom {
  id: string;
  name: string;
  participants: CollaborationUser[];
  topic?: string;
  timeLimit?: number;
  createdAt: Date;
}

interface RealTimeCollaborationProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  className?: string;
}

export function RealTimeCollaboration({
  courseId,
  chapterId,
  sectionId,
  userId,
  userName,
  userAvatar,
  className
}: RealTimeCollaborationProps) {
  // State management
  const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "participants" | "whiteboard" | "rooms" | "session">("chat");
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [participants, setParticipants] = useState<CollaborationUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [whiteboardStrokes, setWhiteboardStrokes] = useState<WhiteboardStroke[]>([]);
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#000000");
  const [drawingWidth, setDrawingWidth] = useState(3);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Initialize collaboration session
  const initializeCollaboration = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check for existing session
      const { data: sessionData } = await axios.get(`/api/collaboration/session`, {
        params: { courseId, chapterId, sectionId }
      });

      if (sessionData.session) {
        setCurrentSession(sessionData.session);
        setParticipants(sessionData.participants || []);
      } else {
        // Create new session
        const { data: newSession } = await axios.post(`/api/collaboration/session`, {
          courseId,
          chapterId,
          sectionId,
          title: `Study Session - Section ${sectionId}`,
          sessionType: 'study-group'
        });
        setCurrentSession(newSession);
      }

      // Initialize WebSocket connection
      connectWebSocket();
      
    } catch (error) {
      logger.error('Error initializing collaboration:', error);
      toast.error('Failed to initialize collaboration session');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, chapterId, sectionId, connectWebSocket]);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    
    // In a real implementation, this would connect to your WebSocket server
    // For now, we'll simulate the connection
    setTimeout(() => {
      setConnectionStatus('connected');
      // Note: System message will be added via a separate effect
    }, 1000);

    // Simulate initial participants
    const mockParticipants: CollaborationUser[] = [
      {
        id: userId,
        name: userName,
        avatar: userAvatar,
        status: 'online',
        role: 'student',
        joinedAt: new Date(),
        lastActivity: new Date(),
        isVideoEnabled: false,
        isAudioEnabled: false,
        isScreenSharing: false
      },
      {
        id: 'user-2',
        name: 'Sarah Chen',
        avatar: '/avatars/sarah.jpg',
        status: 'online',
        role: 'student',
        joinedAt: new Date(Date.now() - 300000),
        lastActivity: new Date(),
        isVideoEnabled: true,
        isAudioEnabled: true,
        isScreenSharing: false
      },
      {
        id: 'user-3',
        name: 'Dr. Johnson',
        avatar: '/avatars/teacher.jpg',
        status: 'online',
        role: 'teacher',
        joinedAt: new Date(Date.now() - 600000),
        lastActivity: new Date(),
        isVideoEnabled: true,
        isAudioEnabled: true,
        isScreenSharing: false
      }
    ];

    setParticipants(mockParticipants);
  }, [userId, userName, userAvatar]);

  // Add system message
  const addSystemMessage = useCallback((content: string) => {
    const systemMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      userId: 'system',
      userName: 'System',
      content,
      type: 'system',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, systemMessage]);
  }, []);

  // Send chat message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId,
      userName,
      userAvatar,
      content: newMessage,
      type: 'text',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage("");

    // Scroll to bottom
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);

    // In a real implementation, send to WebSocket server
    try {
      await axios.post('/api/collaboration/message', {
        sessionId: currentSession?.id,
        message
      });
    } catch (error) {
      logger.error('Error sending message:', error);
    }
  }, [newMessage, userId, userName, userAvatar, currentSession?.id]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      if (!isVideoEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      }
      setIsVideoEnabled(!isVideoEnabled);
      
      // Update participant status
      setParticipants(prev => prev.map(p => 
        p.id === userId ? { ...p, isVideoEnabled: !isVideoEnabled } : p
      ));
      
      addSystemMessage(`${userName} ${!isVideoEnabled ? 'enabled' : 'disabled'} video`);
    } catch (error) {
      logger.error('Error toggling video:', error);
      toast.error('Failed to access camera');
    }
  }, [isVideoEnabled, userId, userName, addSystemMessage]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    try {
      setIsAudioEnabled(!isAudioEnabled);
      
      // Update participant status
      setParticipants(prev => prev.map(p => 
        p.id === userId ? { ...p, isAudioEnabled: !isAudioEnabled } : p
      ));
      
      addSystemMessage(`${userName} ${!isAudioEnabled ? 'unmuted' : 'muted'} microphone`);
    } catch (error) {
      logger.error('Error toggling audio:', error);
      toast.error('Failed to access microphone');
    }
  }, [isAudioEnabled, userId, userName, addSystemMessage]);

  // Start screen sharing
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        await navigator.mediaDevices.getDisplayMedia({ video: true });
        addSystemMessage(`${userName} started screen sharing`);
      } else {
        addSystemMessage(`${userName} stopped screen sharing`);
      }
      setIsScreenSharing(!isScreenSharing);
      
      // Update participant status
      setParticipants(prev => prev.map(p => 
        p.id === userId ? { ...p, isScreenSharing: !isScreenSharing } : p
      ));
    } catch (error) {
      logger.error('Error toggling screen share:', error);
      toast.error('Failed to start screen sharing');
    }
  }, [isScreenSharing, userId, userName, addSystemMessage]);

  // Create breakout room
  const createBreakoutRoom = useCallback(async () => {
    const roomName = `Room ${breakoutRooms.length + 1}`;
    const newRoom: BreakoutRoom = {
      id: `room-${Date.now()}`,
      name: roomName,
      participants: [],
      topic: `Discussion Topic ${breakoutRooms.length + 1}`,
      timeLimit: 15,
      createdAt: new Date()
    };

    setBreakoutRooms(prev => [...prev, newRoom]);
    addSystemMessage(`Created breakout room: ${roomName}`);

    try {
      await axios.post('/api/collaboration/breakout-room', {
        sessionId: currentSession?.id,
        room: newRoom
      });
    } catch (error) {
      logger.error('Error creating breakout room:', error);
    }
  }, [breakoutRooms.length, currentSession?.id, addSystemMessage]);

  // Join breakout room
  const joinBreakoutRoom = useCallback(async (roomId: string) => {
    const currentUser = participants.find(p => p.id === userId);
    if (!currentUser) return;

    setBreakoutRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, participants: [...room.participants, currentUser] }
        : { ...room, participants: room.participants.filter(p => p.id !== userId) }
    ));

    const room = breakoutRooms.find(r => r.id === roomId);
    addSystemMessage(`${userName} joined ${room?.name}`);
  }, [participants, userId, userName, breakoutRooms, addSystemMessage]);

  // Initialize on mount
  useEffect(() => {
    if (isCollaborationOpen && !currentSession) {
      initializeCollaboration();
    }
  }, [isCollaborationOpen, currentSession, initializeCollaboration]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && activeTab === 'chat') {
        e.preventDefault();
        sendMessage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeTab, sendMessage]);

  return (
    <>
      {/* Collaboration Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCollaborationOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-50",
          "bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm",
          "border-purple-200 dark:border-purple-800",
          "hover:bg-purple-50 dark:hover:bg-purple-900/50",
          "shadow-lg hover:shadow-xl transition-all duration-200",
          className
        )}
      >
        <Users className="h-4 w-4 mr-2" />
        Collaborate
        {participants.length > 1 && (
          <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
            {participants.length}
          </Badge>
        )}
      </Button>

      {/* Collaboration Panel */}
      <AnimatePresence>
        {isCollaborationOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Live Collaboration
                </h3>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                )} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollaborationOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Media Controls */}
            <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50">
              <Button
                variant={isVideoEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleVideo}
                disabled={isLoading}
              >
                {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button
                variant={isAudioEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleAudio}
                disabled={isLoading}
              >
                {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button
                variant={isScreenSharing ? "default" : "outline"}
                size="sm"
                onClick={toggleScreenShare}
                disabled={isLoading}
              >
                {isScreenSharing ? <Monitor className="h-4 w-4" /> : <MonitorOff className="h-4 w-4" />}
              </Button>
            </div>

            {/* Video Preview */}
            {isVideoEnabled && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-lg object-cover"
                />
              </div>
            )}

            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-5 mx-3 mt-3">
                <TabsTrigger value="chat" className="text-xs">
                  <MessageCircle className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger value="participants" className="text-xs">
                  <Users className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger value="whiteboard" className="text-xs">
                  <Pen className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger value="rooms" className="text-xs">
                  <Hand className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger value="session" className="text-xs">
                  <Settings className="h-3 w-3" />
                </TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col mt-3 mx-3">
                <ScrollArea className="flex-1 pr-3">
                  <div className="space-y-3">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2",
                          message.type === 'system' && "justify-center"
                        )}
                      >
                        {message.type !== 'system' && (
                          <Avatar className="h-6 w-6 mt-1">
                            <AvatarImage src={message.userAvatar} alt={message.userName} />
                            <AvatarFallback className="text-xs">
                              {message.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn(
                          "flex-1",
                          message.type === 'system' && "text-center"
                        )}>
                          {message.type !== 'system' && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {message.userName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {message.timestamp.toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          )}
                          <div className={cn(
                            "text-sm",
                            message.type === 'system' 
                              ? "text-xs text-gray-500 italic bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full inline-block"
                              : "text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg"
                          )}>
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatScrollRef} />
                  </div>
                </ScrollArea>
                
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="min-h-[60px] resize-none"
                    disabled={connectionStatus !== 'connected'}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || connectionStatus !== 'connected'}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Participants Tab */}
              <TabsContent value="participants" className="flex-1 mt-3 mx-3">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Participants ({participants.length})
                      </span>
                      <Button variant="ghost" size="sm">
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={participant.avatar} alt={participant.name} />
                            <AvatarFallback className="text-xs">
                              {participant.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900",
                            participant.status === 'online' ? 'bg-green-500' :
                            participant.status === 'busy' ? 'bg-red-500' :
                            participant.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                          )} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {participant.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {participant.role}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {participant.isVideoEnabled && (
                              <Video className="h-3 w-3 text-green-600" />
                            )}
                            {participant.isAudioEnabled && (
                              <Mic className="h-3 w-3 text-green-600" />
                            )}
                            {participant.isScreenSharing && (
                              <Monitor className="h-3 w-3 text-blue-600" />
                            )}
                          </div>
                        </div>
                        
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Whiteboard Tab */}
              <TabsContent value="whiteboard" className="flex-1 mt-3 mx-3">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Shared Whiteboard
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={drawingColor}
                        onChange={(e) => setDrawingColor(e.target.value)}
                        className="w-6 h-6 rounded border-0"
                      />
                      <Slider
                        value={[drawingWidth]}
                        onValueChange={(value) => setDrawingWidth(value[0])}
                        max={10}
                        min={1}
                        step={1}
                        className="w-20"
                      />
                    </div>
                  </div>
                  
                  <canvas
                    ref={canvasRef}
                    className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 cursor-crosshair"
                    onMouseDown={() => setIsDrawing(true)}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                  />
                  
                  <div className="flex items-center justify-between mt-2">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Breakout Rooms Tab */}
              <TabsContent value="rooms" className="flex-1 mt-3 mx-3">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Breakout Rooms
                    </span>
                    <Button variant="outline" size="sm" onClick={createBreakoutRoom}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <ScrollArea className="flex-1">
                    <div className="space-y-2">
                      {breakoutRooms.map((room) => (
                        <Card key={room.id} className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{room.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {room.participants.length} members
                            </Badge>
                          </div>
                          {room.topic && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              {room.topic}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex -space-x-1">
                              {room.participants.slice(0, 3).map((participant) => (
                                <Avatar key={participant.id} className="h-5 w-5 border border-white">
                                  <AvatarImage src={participant.avatar} alt={participant.name} />
                                  <AvatarFallback className="text-xs">
                                    {participant.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {room.participants.length > 3 && (
                                <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 border border-white flex items-center justify-center">
                                  <span className="text-xs font-medium">+{room.participants.length - 3}</span>
                                </div>
                              )}
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => joinBreakoutRoom(room.id)}
                            >
                              Join
                            </Button>
                          </div>
                        </Card>
                      ))}
                      
                      {breakoutRooms.length === 0 && (
                        <div className="text-center py-8">
                          <Hand className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">No breakout rooms yet</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={createBreakoutRoom}
                          >
                            Create First Room
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Session Settings Tab */}
              <TabsContent value="session" className="flex-1 mt-3 mx-3">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Session Info</h4>
                      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>
                            {currentSession && new Date().getTime() - currentSession.startTime.getTime() > 0
                              ? Math.floor((new Date().getTime() - currentSession.startTime.getTime()) / 60000) + ' min'
                              : '0 min'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Participants:</span>
                          <span>{participants.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Session Type:</span>
                          <span className="capitalize">{currentSession?.sessionType || 'study-group'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Quick Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Auto-join voice</Label>
                          <Switch size="sm" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Show typing indicators</Label>
                          <Switch size="sm" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Enable reactions</Label>
                          <Switch size="sm" defaultChecked />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Session Analytics</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          <span className="text-xs">Active participation: 85%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-500" />
                          <span className="text-xs">Learning focus: High</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-500" />
                          <span className="text-xs">Goals achieved: 3/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}