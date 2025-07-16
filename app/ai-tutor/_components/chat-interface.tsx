"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Send, 
  Mic, 
  Image as ImageIcon,
  FileText,
  Code,
  Bot,
  StopCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";
import { prismLight } from "@/components/markdown/prism";
import { PrismAsync as SyntaxHighlighter } from 'react-syntax-highlighter';

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
}

interface ChatInterfaceProps {
  subject: string;
  learningStyle: string;
}

export const ChatInterface = ({
  subject,
  learningStyle
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        content: `Hello! I'm your AI tutor${subject ? ` for ${subject}` : ''}. How can I help you today?`,
        role: "assistant",
        timestamp: new Date()
      }]);
    }
  }, [subject, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessageToAI = async (chatMessages: Message[]) => {
    try {
      const response = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          subject,
          learningStyle
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        id: data.id || Date.now().toString(),
        content: data.content,
        role: "assistant" as const,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error calling AI tutor API:', error);
      toast({
        title: "Error",
        description: "Failed to get a response from the AI tutor. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const aiMessage = await sendMessageToAI(updatedMessages);
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Error is already handled in sendMessageToAI
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Render message content with markdown support
  const renderMessageContent = (content: string) => {
    return (
      <ReactMarkdown
        components={{
          code({node, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <SyntaxHighlighter
                style={prismLight as any}
                language={match[1]}
                PreTag="div"
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-[calc(100vh-16rem)]",
      "bg-white/50 dark:bg-gray-800/50",
      "border border-gray-200 dark:border-gray-700",
      "rounded-xl overflow-hidden"
    )}>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mb-4 max-w-[85%]",
              message.role === "user" ? "ml-auto" : "mr-auto"
            )}
          >
            <div className={cn(
              "rounded-lg p-4",
              message.role === "user"
                ? "bg-purple-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100",
              "prose prose-sm dark:prose-invert max-w-none"  
            )}>
              {renderMessageContent(message.content)}
            </div>
            <div className={cn(
              "text-xs mt-1",
              "text-gray-500 dark:text-gray-400",
              message.role === "user" ? "text-right" : "text-left"
            )}>
              {message.timestamp.toLocaleTimeString()}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 my-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI tutor is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white/50 dark:bg-gray-800/50">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your question..."
            className={cn(
              "min-h-[60px] max-h-[200px]",
              "bg-white dark:bg-gray-800",
              "border-gray-200 dark:border-gray-700",
              "text-gray-900 dark:text-gray-100",
              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
              "resize-none"
            )}
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!isRecording) {
                  toast({
                    title: "Voice input",
                    description: "Voice input is not yet implemented.",
                    variant: "default"
                  });
                }
                setIsRecording(!isRecording);
              }}
              className={cn(
                "border-gray-200 dark:border-gray-700",
                isRecording && "text-red-500 dark:text-red-400"
              )}
            >
              {isRecording ? (
                <StopCircle className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 dark:text-gray-400"
            onClick={() => {
              toast({
                title: "Feature not available",
                description: "Image upload is coming soon!",
                variant: "default"
              });
            }}
          >
            <ImageIcon className="w-4 h-4 mr-1" />
            Image
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 dark:text-gray-400"
            onClick={() => {
              toast({
                title: "Feature not available",
                description: "File upload is coming soon!",
                variant: "default"
              });
            }}
          >
            <FileText className="w-4 h-4 mr-1" />
            File
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 dark:text-gray-400"
            onClick={() => {
              const codeExample = "```python\nprint('Hello, world!')\n```";
              setInput(prev => prev + (prev.length ? "\n\n" : "") + codeExample);
            }}
          >
            <Code className="w-4 h-4 mr-1" />
            Code
          </Button>
        </div>
      </div>
    </div>
  );
};