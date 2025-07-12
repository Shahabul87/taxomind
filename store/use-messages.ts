import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  read: boolean;
  createdAt: Date;
  senderId: string;
  recipientId: string;
  User_Message_senderIdToUser: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantImage: string | null;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

interface MessagesStore {
  messages: Message[];
  conversations: Conversation[];
  currentConversation: Message[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingConversation: boolean;
  isSending: boolean;
  error: string | null;
  lastFetch: Date | null;
  
  // Actions
  fetchMessages: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchConversation: (participantId: string) => Promise<void>;
  sendMessage: (recipientId: string, content: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: (senderId?: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
  clearError: () => void;
  clearCurrentConversation: () => void;
  
  // Optimistic updates
  optimisticSendMessage: (recipientId: string, content: string, tempId: string) => void;
  optimisticMarkAsRead: (messageId: string) => void;
  optimisticDelete: (messageId: string) => void;
}

export const useMessages = create<MessagesStore>()(
  devtools(
    (set, get) => ({
      messages: [],
      conversations: [],
      currentConversation: [],
      unreadCount: 0,
      isLoading: false,
      isLoadingConversation: false,
      isSending: false,
      error: null,
      lastFetch: null,

      fetchMessages: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await axios.get('/api/messages');
          const messages = response.data.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          }));
          const unreadCount = messages.filter((m: Message) => !m.read).length;
          set({ 
            messages, 
            unreadCount, 
            isLoading: false, 
            lastFetch: new Date(),
            error: null 
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to fetch messages';
          console.error('Error fetching messages:', error);
          set({ 
            isLoading: false, 
            error: errorMessage 
          });
          toast.error(errorMessage);
        }
      },

      fetchConversations: async () => {
        try {
          set({ isLoading: true, error: null });
          // This would need a new API endpoint to get recent conversations
          // For now, we'll derive it from messages
          const response = await axios.get('/api/messages');
          const messages = response.data.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          }));
          
          // Group messages by sender to create conversations
          const conversationMap = new Map();
          messages.forEach((message: Message) => {
            const key = message.User_Message_senderIdToUser.id;
            if (!conversationMap.has(key)) {
              conversationMap.set(key, {
                id: key,
                participantId: message.User_Message_senderIdToUser.id,
                participantName: message.User_Message_senderIdToUser.name || 'Unknown',
                participantImage: message.User_Message_senderIdToUser.image,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
                unreadCount: 0,
              });
            }
            if (!message.read) {
              conversationMap.get(key).unreadCount++;
            }
          });

          const conversations = Array.from(conversationMap.values())
            .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

          const unreadCount = messages.filter((m: Message) => !m.read).length;
          set({ 
            messages,
            conversations, 
            unreadCount, 
            isLoading: false, 
            lastFetch: new Date(),
            error: null 
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to fetch conversations';
          console.error('Error fetching conversations:', error);
          set({ 
            isLoading: false, 
            error: errorMessage 
          });
          toast.error(errorMessage);
        }
      },

      fetchConversation: async (participantId: string) => {
        try {
          set({ isLoadingConversation: true, error: null });
          // This would need a specific conversation API endpoint
          const response = await axios.get(`/api/messages?conversation=${participantId}`);
          const conversationMessages = response.data.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          }));
          set({ 
            currentConversation: conversationMessages, 
            isLoadingConversation: false,
            error: null 
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to fetch conversation';
          console.error('Error fetching conversation:', error);
          set({ 
            isLoadingConversation: false, 
            error: errorMessage 
          });
          toast.error(errorMessage);
        }
      },

      sendMessage: async (recipientId: string, content: string) => {
        const tempId = `temp_${Date.now()}`;
        
        // Optimistic update
        get().optimisticSendMessage(recipientId, content, tempId);
        
        try {
          set({ isSending: true });
          const response = await axios.post('/api/messages', {
            recipientId,
            content,
          });
          
          // Replace temporary message with real one
          const realMessage = {
            ...response.data,
            createdAt: new Date(response.data.createdAt),
          };
          
          const currentConversation = get().currentConversation.map(msg =>
            msg.id === tempId ? realMessage : msg
          );
          
          set({ 
            currentConversation, 
            isSending: false,
            error: null 
          });
          
          toast.success('Message sent');
        } catch (error: any) {
          // Remove failed message
          const currentConversation = get().currentConversation.filter(msg => msg.id !== tempId);
          set({ currentConversation, isSending: false });
          
          const errorMessage = error.response?.data?.error || 'Failed to send message';
          console.error('Error sending message:', error);
          toast.error(errorMessage);
        }
      },

      markAsRead: async (messageId: string) => {
        // Optimistic update
        get().optimisticMarkAsRead(messageId);
        
        try {
          await axios.patch('/api/messages', { messageId });
          // Success - optimistic update was correct
        } catch (error: any) {
          // Revert optimistic update
          const messages = get().messages.map(message =>
            message.id === messageId ? { ...message, read: false } : message
          );
          const unreadCount = messages.filter(m => !m.read).length;
          set({ messages, unreadCount });
          
          const errorMessage = error.response?.data?.error || 'Failed to mark message as read';
          console.error('Error marking message as read:', error);
          toast.error(errorMessage);
        }
      },

      markAllAsRead: async (senderId?: string) => {
        const originalMessages = get().messages;
        
        // Optimistic update
        const updatedMessages = originalMessages.map(m => 
          senderId ? (m.senderId === senderId ? { ...m, read: true } : m) : { ...m, read: true }
        );
        const unreadCount = updatedMessages.filter(m => !m.read).length;
        set({ messages: updatedMessages, unreadCount });
        
        try {
          await axios.patch('/api/messages', { markAll: true, senderId });
          toast.success('Messages marked as read');
        } catch (error: any) {
          // Revert optimistic update
          const unreadCount = originalMessages.filter(m => !m.read).length;
          set({ messages: originalMessages, unreadCount });
          
          const errorMessage = error.response?.data?.error || 'Failed to mark messages as read';
          console.error('Error marking messages as read:', error);
          toast.error(errorMessage);
        }
      },

      deleteMessage: async (messageId: string) => {
        // Optimistic update
        get().optimisticDelete(messageId);
        
        try {
          await axios.delete(`/api/messages?id=${messageId}`);
          toast.success('Message deleted');
        } catch (error: any) {
          // Revert - refetch messages
          await get().fetchMessages();
          
          const errorMessage = error.response?.data?.error || 'Failed to delete message';
          console.error('Error deleting message:', error);
          toast.error(errorMessage);
        }
      },

      refreshMessages: async () => {
        // Force refresh without showing loading state
        try {
          const response = await axios.get('/api/messages');
          const messages = response.data.map((m: any) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          }));
          const unreadCount = messages.filter((m: Message) => !m.read).length;
          set({ 
            messages, 
            unreadCount, 
            lastFetch: new Date(),
            error: null 
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to refresh messages';
          console.error('Error refreshing messages:', error);
          set({ error: errorMessage });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      clearCurrentConversation: () => {
        set({ currentConversation: [] });
      },

      // Optimistic update helpers
      optimisticSendMessage: (recipientId: string, content: string, tempId: string) => {
        const tempMessage: Message = {
          id: tempId,
          content,
          read: false,
          createdAt: new Date(),
          senderId: 'current-user', // This should be the current user's ID
          recipientId,
          User_Message_senderIdToUser: {
            id: 'current-user',
            name: 'You',
            image: null,
          },
        };
        
        const currentConversation = [...get().currentConversation, tempMessage];
        set({ currentConversation });
      },

      optimisticMarkAsRead: (messageId: string) => {
        const messages = get().messages.map(message =>
          message.id === messageId ? { ...message, read: true } : message
        );
        const unreadCount = messages.filter(m => !m.read).length;
        set({ messages, unreadCount });
      },

      optimisticDelete: (messageId: string) => {
        const messages = get().messages.filter(m => m.id !== messageId);
        const currentConversation = get().currentConversation.filter(m => m.id !== messageId);
        const unreadCount = messages.filter(m => !m.read).length;
        set({ messages, currentConversation, unreadCount });
      },
    }),
    {
      name: 'messages-store',
    }
  )
); 