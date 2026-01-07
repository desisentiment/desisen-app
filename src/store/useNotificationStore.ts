import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  generateBusinessNotifications: (businessId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      markAsRead: (id: string) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
          );
          const unreadCount = updatedNotifications.filter((n) => !n.read).length;
          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
          unreadCount: 0,
        }));
      },

      deleteNotification: (id: string) => {
        set((state) => {
          const updatedNotifications = state.notifications.filter(
            (notification) => notification.id !== id
          );
          const unreadCount = updatedNotifications.filter((n) => !n.read).length;
          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });
      },

      generateBusinessNotifications: (_businessId: string) => {
        // Generate some sample notifications for the business
        const sampleNotifications: Omit<Notification, 'id' | 'createdAt' | 'read'>[] = [
          {
            type: 'info',
            title: 'New Invoice Created',
            message: `Invoice #${Math.floor(Math.random() * 1000)} has been created successfully.`,
          },
          {
            type: 'warning',
            title: 'Low Stock Alert',
            message: 'Some items are running low on stock. Please check your inventory.',
          },
          {
            type: 'success',
            title: 'Payment Received',
            message: 'A payment has been received from a customer.',
          },
        ];

        const newNotifications: Notification[] = sampleNotifications.map((notif) => ({
          ...notif,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          read: false,
        }));

        set((state) => {
          const updatedNotifications = [...newNotifications, ...state.notifications];
          const unreadCount = updatedNotifications.filter((n) => !n.read).length;
          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });
      },

      addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          read: false,
        };

        set((state) => {
          const updatedNotifications = [newNotification, ...state.notifications];
          const unreadCount = updatedNotifications.filter((n) => !n.read).length;
          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    }
  )
);
