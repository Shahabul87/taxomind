"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';
import { 
  MessageCircle, 
  Clock, 
  User, 
  Bot, 
  ChevronDown, 
  ChevronUp, 
  Search,
  Calendar,
  Hash,
  Target,
  Lightbulb,
  MoreVertical,
  Trash2,
  Star,
  Copy,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type ConversationSummary } from '@/lib/sam-memory-engine';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ConversationHistoryProps {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  onSelectConversation?: (conversationId: string) => void;
}

export function SAMConversationHistory({ 
  courseId, 
  chapterId, 
  sectionId,
  onSelectConversation 
}: ConversationHistoryProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation summaries
  useEffect(() => {
    const loadConversations = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/sam/conversations/summaries?courseId=${courseId || ''}`);
        
        if (response.ok) {
          const data = await response.json();
          setConversations(data.data);
        }
      } catch (error: any) {
        logger.error('Error loading conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [session?.user?.id, courseId]);

  // Load messages for selected conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) {
        setMessages([]);
        return;
      }

      try {
        const response = await fetch(`/api/sam/conversations/${selectedConversation}/messages`);
        
        if (response.ok) {
          const data = await response.json();
          setMessages(data.data);
        }
      } catch (error: any) {
        logger.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [selectedConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
    conv.keyInsights.some(insight => insight.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Toggle conversation expansion
  const toggleExpansion = (conversationId: string) => {
    const newExpanded = new Set(expandedConversations);
    if (newExpanded.has(conversationId)) {
      newExpanded.delete(conversationId);
    } else {
      newExpanded.add(conversationId);
    }
    setExpandedConversations(newExpanded);
  };

  // Select conversation
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    onSelectConversation?.(conversationId);
  };

  // Copy message content
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Export conversation
  const exportConversation = (conversation: ConversationSummary) => {
    const content = `
# ${conversation.title}
Date: ${conversation.startTime.toLocaleDateString()}
Messages: ${conversation.messageCount}

## Topics
${conversation.topics.map(topic => `- ${topic}`).join('\n')}

## Key Insights
${conversation.keyInsights.map(insight => `- ${insight}`).join('\n')}

## Assistance Provided
${conversation.assistanceProvided.map(assistance => `- ${assistance}`).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sam-conversation-${conversation.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading conversation history...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="conversations" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="chat">Current Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="flex-1 flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations, topics, or insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {conversations.length === 0 ? 'No conversations yet' : 'No conversations match your search'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <Card 
                    key={conversation.id} 
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedConversation === conversation.id && "ring-2 ring-blue-500"
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1" onClick={() => handleSelectConversation(conversation.id)}>
                          <CardTitle className="text-sm font-medium">{conversation.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3" />
                            {conversation.lastActivity.toLocaleDateString()}
                            <Hash className="h-3 w-3" />
                            {conversation.messageCount} messages
                          </CardDescription>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpansion(conversation.id)}
                          >
                            {expandedConversations.has(conversation.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => exportConversation(conversation)}>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Star className="h-4 w-4 mr-2" />
                                Favorite
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>

                    {expandedConversations.has(conversation.id) && (
                      <CardContent className="pt-0 space-y-3">
                        {/* Topics */}
                        {conversation.topics.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Hash className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Topics</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {conversation.topics.map((topic, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Goals */}
                        {conversation.userGoals.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">Goals</span>
                            </div>
                            <div className="space-y-1">
                              {conversation.userGoals.slice(0, 2).map((goal, index) => (
                                <p key={index} className="text-xs text-gray-600 dark:text-gray-400">
                                  • {goal}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Key Insights */}
                        {conversation.keyInsights.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium">Key Insights</span>
                            </div>
                            <div className="space-y-1">
                              {conversation.keyInsights.slice(0, 2).map((insight, index) => (
                                <p key={index} className="text-xs text-gray-600 dark:text-gray-400">
                                  • {insight}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assistance Provided */}
                        {conversation.assistanceProvided.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Bot className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium">Assistance</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {conversation.assistanceProvided.map((assistance, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {assistance}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="chat" className="flex-1 flex flex-col">
          {selectedConversation ? (
            <div className="flex-1 flex flex-col">
              <div className="border-b pb-2 mb-4">
                <h3 className="font-medium">
                  {conversations.find(c => c.id === selectedConversation)?.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {messages.length} messages
                </p>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3 p-3 rounded-lg",
                        message.role === 'USER'
                          ? "bg-blue-50 dark:bg-blue-900/20 ml-8"
                          : "bg-gray-50 dark:bg-gray-800 mr-8"
                      )}
                    >
                      <div className="flex-shrink-0">
                        {message.role === 'USER' ? (
                          <User className="h-6 w-6 text-blue-600" />
                        ) : (
                          <Bot className="h-6 w-6 text-purple-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {message.role === 'USER' ? 'You' : 'SAM'}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyMessage(message.content)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {message.content}
                        </div>
                        
                        {message.metadata?.memoryContext && (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-700 rounded text-xs">
                            <span className="text-gray-500">Context-aware response</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Select a conversation to view messages
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}