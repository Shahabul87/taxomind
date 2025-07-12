import { db } from '@/lib/db';
import { NotificationService } from './notification-service';

export interface MessageData {
  content: string;
  senderId: string;
  recipientId: string;
  metadata?: Record<string, any>;
}

export interface ConversationData {
  participant1Id: string;
  participant2Id: string;
  page?: number;
  limit?: number;
}

/**
 * Service class for managing messages and conversations
 */
export class MessagingService {
  /**
   * Send a message between users
   */
  static async sendMessage(data: MessageData) {
    try {
      // Create the message
      const message = await db.message.create({
        data: {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: data.content,
          senderId: data.senderId,
          recipientId: data.recipientId,
          read: false,
        },
        include: {
          User_Message_senderIdToUser: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          User_Message_recipientIdToUser: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      // Create a notification for the recipient
      const senderName = message.User_Message_senderIdToUser?.name || 'Someone';
      await NotificationService.createNotification({
        title: 'New Message',
        message: `You have a new message from ${senderName}`,
        type: 'MESSAGE_RECEIVED',
        userId: data.recipientId,
        metadata: {
          messageId: message.id,
          senderId: data.senderId,
          senderName,
        },
      });

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  /**
   * Get messages for a user (received messages)
   */
  static async getUserMessages(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      senderId?: string;
    } = {}
  ) {
    try {
      const { page = 1, limit = 20, unreadOnly = false, senderId } = options;
      const skip = (page - 1) * limit;

      const where: any = { recipientId: userId };
      if (unreadOnly) where.read = false;
      if (senderId) where.senderId = senderId;

      const [messages, total] = await Promise.all([
        db.message.findMany({
          where,
          include: {
            User_Message_senderIdToUser: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        db.message.count({ where }),
      ]);

      const unreadCount = await db.message.count({
        where: { recipientId: userId, read: false },
      });

      return {
        success: true,
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        unreadCount,
      };
    } catch (error) {
      console.error('Error fetching user messages:', error);
      return { success: false, error: 'Failed to fetch messages' };
    }
  }

  /**
   * Get conversation between two users
   */
  static async getConversation(data: ConversationData) {
    try {
      const { participant1Id, participant2Id, page = 1, limit = 50 } = data;
      const skip = (page - 1) * limit;

      const messages = await db.message.findMany({
        where: {
          OR: [
            { senderId: participant1Id, recipientId: participant2Id },
            { senderId: participant2Id, recipientId: participant1Id },
          ],
        },
        include: {
          User_Message_senderIdToUser: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          User_Message_recipientIdToUser: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' }, // Ascending for conversation view
        skip,
        take: limit,
      });

      return { success: true, messages };
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return { success: false, error: 'Failed to fetch conversation' };
    }
  }

  /**
   * Mark a message as read
   */
  static async markAsRead(messageId: string, userId: string) {
    try {
      const message = await db.message.update({
        where: {
          id: messageId,
          recipientId: userId, // Ensure user can only mark their received messages as read
        },
        data: {
          read: true,
        },
      });

      return { success: true, message };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: 'Failed to mark message as read' };
    }
  }

  /**
   * Mark all messages as read for a user
   */
  static async markAllAsRead(userId: string, senderId?: string) {
    try {
      const where: any = { recipientId: userId, read: false };
      if (senderId) where.senderId = senderId;

      const result = await db.message.updateMany({
        where,
        data: {
          read: true,
        },
      });

      return { success: true, count: result.count };
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      return { success: false, error: 'Failed to mark all messages as read' };
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string, userId: string) {
    try {
      // Users can delete messages they sent or received
      const message = await db.message.findFirst({
        where: {
          id: messageId,
          OR: [
            { senderId: userId },
            { recipientId: userId },
          ],
        },
      });

      if (!message) {
        return { success: false, error: 'Message not found or access denied' };
      }

      await db.message.delete({
        where: { id: messageId },
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: 'Failed to delete message' };
    }
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId: string) {
    try {
      const count = await db.message.count({
        where: {
          recipientId: userId,
          read: false,
        },
      });

      return { success: true, count };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { success: false, error: 'Failed to get unread count' };
    }
  }

  /**
   * Get recent conversations for a user
   */
  static async getRecentConversations(userId: string, limit: number = 10) {
    try {
      // Get the most recent message with each unique conversation partner
      const recentMessages = await db.$queryRaw<any[]>`
        WITH ranked_messages AS (
          SELECT 
            m.*,
            CASE 
              WHEN m."senderId" = ${userId} THEN m."recipientId"
              ELSE m."senderId"
            END as conversation_partner_id,
            ROW_NUMBER() OVER (
              PARTITION BY CASE 
                WHEN m."senderId" = ${userId} THEN m."recipientId"
                ELSE m."senderId"
              END 
              ORDER BY m."createdAt" DESC
            ) as rn
          FROM "Message" m
          WHERE m."senderId" = ${userId} OR m."recipientId" = ${userId}
        )
        SELECT * FROM ranked_messages 
        WHERE rn = 1
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `;

      // Get user details for conversation partners
      const conversationPartnerIds = recentMessages.map(msg => msg.conversation_partner_id);
      const users = await db.user.findMany({
        where: {
          id: { in: conversationPartnerIds },
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
      });

      const userMap = new Map(users.map(user => [user.id, user]));

      const conversations = recentMessages.map(msg => ({
        ...msg,
        conversationPartner: userMap.get(msg.conversation_partner_id),
        isFromCurrentUser: msg.senderId === userId,
      }));

      return { success: true, conversations };
    } catch (error) {
      console.error('Error fetching recent conversations:', error);
      return { success: false, error: 'Failed to fetch recent conversations' };
    }
  }

  /**
   * Search messages for a user
   */
  static async searchMessages(
    userId: string,
    query: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const messages = await db.message.findMany({
        where: {
          AND: [
            {
              OR: [
                { senderId: userId },
                { recipientId: userId },
              ],
            },
            {
              content: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          User_Message_senderIdToUser: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          User_Message_recipientIdToUser: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      return { success: true, messages };
    } catch (error) {
      console.error('Error searching messages:', error);
      return { success: false, error: 'Failed to search messages' };
    }
  }

  /**
   * Block a user from sending messages
   */
  static async blockUser(blockerId: string, blockedId: string) {
    try {
      // This would require a separate BlockedUsers table
      // For now, we'll return a placeholder
      // In a real implementation, you'd create a BlockedUsers model
      
      return { success: true, message: 'User blocking feature requires BlockedUsers table implementation' };
    } catch (error) {
      console.error('Error blocking user:', error);
      return { success: false, error: 'Failed to block user' };
    }
  }

  /**
   * Check if a user is blocked
   */
  static async isBlocked(userId: string, otherUserId: string) {
    try {
      // This would check the BlockedUsers table
      // For now, return false
      return { success: true, isBlocked: false };
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
      return { success: false, error: 'Failed to check block status' };
    }
  }
}