import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationsStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  clearError: () => void;
  
  // Optimistic updates
  optimisticMarkAsRead: (notificationId: string) => void;
  optimisticDelete: (notificationId: string) => void;
}

export const useNotifications = create<NotificationsStore>()(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastFetch: null,

      fetchNotifications: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await axios.get('/api/notifications');
          const notifications = response.data.map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          }));
          const unreadCount = notifications.filter((n: Notification) => !n.read).length;
          set({ 
            notifications, 
            unreadCount, 
            isLoading: false, 
            lastFetch: new Date(),
            error: null 
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to fetch notifications';
          console.error('Error fetching notifications:', error);
          set({ 
            isLoading: false, 
            error: errorMessage 
          });
          toast.error(errorMessage);
        }
      },

      markAsRead: async (notificationId: string) => {
        // Optimistic update
        get().optimisticMarkAsRead(notificationId);
        
        try {
          await axios.patch('/api/notifications', { notificationId });
          // Success - optimistic update was correct
        } catch (error: any) {
          // Revert optimistic update
          const notifications = get().notifications.map(notification =>
            notification.id === notificationId ? { ...notification, read: false } : notification
          );
          const unreadCount = notifications.filter(n => !n.read).length;
          set({ notifications, unreadCount });
          
          const errorMessage = error.response?.data?.error || 'Failed to mark notification as read';
          console.error('Error marking notification as read:', error);
          toast.error(errorMessage);
        }
      },

      markAllAsRead: async () => {
        const originalNotifications = get().notifications;
        
        // Optimistic update
        const updatedNotifications = originalNotifications.map(n => ({ ...n, read: true }));
        set({ notifications: updatedNotifications, unreadCount: 0 });
        
        try {
          await axios.patch('/api/notifications', { markAll: true });
          toast.success('All notifications marked as read');
        } catch (error: any) {
          // Revert optimistic update
          const unreadCount = originalNotifications.filter(n => !n.read).length;
          set({ notifications: originalNotifications, unreadCount });
          
          const errorMessage = error.response?.data?.error || 'Failed to mark all notifications as read';
          console.error('Error marking all notifications as read:', error);
          toast.error(errorMessage);
        }
      },

      deleteNotification: async (notificationId: string) => {
        // Optimistic update
        get().optimisticDelete(notificationId);
        
        try {
          await axios.delete(`/api/notifications?id=${notificationId}`);
          toast.success('Notification deleted');
        } catch (error: any) {
          // Revert - refetch notifications
          await get().fetchNotifications();
          
          const errorMessage = error.response?.data?.error || 'Failed to delete notification';
          console.error('Error deleting notification:', error);
          toast.error(errorMessage);
        }
      },

      deleteAllNotifications: async () => {
        const originalNotifications = get().notifications;
        const originalUnreadCount = get().unreadCount;
        
        // Optimistic update
        set({ notifications: [], unreadCount: 0 });
        
        try {
          await axios.delete('/api/notifications?deleteAll=true');
          toast.success('All notifications deleted');
        } catch (error: any) {
          // Revert optimistic update
          set({ notifications: originalNotifications, unreadCount: originalUnreadCount });
          
          const errorMessage = error.response?.data?.error || 'Failed to delete all notifications';
          console.error('Error deleting all notifications:', error);
          toast.error(errorMessage);
        }
      },

      refreshNotifications: async () => {
        // Force refresh without showing loading state
        try {
          const response = await axios.get('/api/notifications');
          const notifications = response.data.map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          }));
          const unreadCount = notifications.filter((n: Notification) => !n.read).length;
          set({ 
            notifications, 
            unreadCount, 
            lastFetch: new Date(),
            error: null 
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to refresh notifications';
          console.error('Error refreshing notifications:', error);
          set({ error: errorMessage });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Optimistic update helpers
      optimisticMarkAsRead: (notificationId: string) => {
        const notifications = get().notifications.map(notification =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        );
        const unreadCount = notifications.filter(n => !n.read).length;
        set({ notifications, unreadCount });
      },

      optimisticDelete: (notificationId: string) => {
        const notifications = get().notifications.filter(n => n.id !== notificationId);
        const unreadCount = notifications.filter(n => !n.read).length;
        set({ notifications, unreadCount });
      },
    }),
    {
      name: 'notifications-store',
    }
  )
); 