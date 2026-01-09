/* eslint-disable @typescript-eslint/no-explicit-any */
// src/context/NotificationContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

const API_BASE = "https://boocozmo-api.onrender.com";

// Types - using NotificationItem to avoid conflict with browser's Notification API
export type NotificationItem = {
  id: string;
  chatId: number;
  senderEmail: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  offerId?: number;
  offerTitle?: string;
  type?: 'message' | 'wishlist' | 'nearby'; // Notification type
};

type NotificationContextType = {
  unreadCount: number;
  notifications: NotificationItem[];
  socket: Socket | null;
  isConnected: boolean;
  markAsRead: (notificationId: string) => void;
  markChatAsRead: (chatId: number) => Promise<void>;
  clearNotifications: () => void;
  refreshUnreadCount: () => Promise<void>;
  showWishlistNotification: (bookTitle: string, ownerName: string, offerId: number) => void;
  showNearbyNotification: (bookTitle: string, ownerName: string, distance: string, offerId: number) => void;
};

// Default values for when context is not available
const defaultContext: NotificationContextType = {
  unreadCount: 0,
  notifications: [],
  socket: null,
  isConnected: false,
  markAsRead: () => {},
  markChatAsRead: async () => {},
  clearNotifications: () => {},
  refreshUnreadCount: async () => {},
  showWishlistNotification: () => {},
  showNearbyNotification: () => {},
};

// Notification throttle settings
const NOTIFICATION_THROTTLE_MS = 5000; // Minimum 5 seconds between notifications
let lastNotificationTime = 0;

const NotificationContext = createContext<NotificationContextType>(defaultContext);

// Hook for consuming the context - now safe to use even outside provider
export const useNotifications = () => {
  return useContext(NotificationContext);
};

// Request browser notification permission
const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("Browser doesn't support notifications");
    return false;
  }
  
  if (Notification.permission === "granted") {
    return true;
  }
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  
  return false;
};

// Show browser notification with throttling
const showBrowserNotification = (title: string, body: string, tag: string = "boocozmo-message", onClick?: () => void) => {
  const now = Date.now();
  
  // Throttle notifications - don't show more than 1 every 5 seconds
  if (now - lastNotificationTime < NOTIFICATION_THROTTLE_MS) {
    console.log("Notification throttled");
    return;
  }
  
  lastNotificationTime = now;
  
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/vite.svg",
      badge: "/vite.svg",
      tag, // Use tag to prevent duplicate notifications
      requireInteraction: false,
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
      onClick?.();
    };
    
    // Auto-close after 4 seconds
    setTimeout(() => notification.close(), 4000);
  }
};

type Props = {
  children: React.ReactNode;
  currentUser: { email: string; name: string; token: string } | null;
};

export const NotificationProvider: React.FC<Props> = ({ children, currentUser }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Load cached unread count from localStorage
  useEffect(() => {
    const cachedCount = localStorage.getItem("boocozmo_unread_count");
    if (cachedCount) {
      setUnreadCount(parseInt(cachedCount, 10));
    }
    
    const cachedNotifications = localStorage.getItem("boocozmo_notifications");
    if (cachedNotifications) {
      try {
        const parsed = JSON.parse(cachedNotifications);
        setNotifications(parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })));
      } catch (e) {
        console.error("Failed to parse cached notifications:", e);
      }
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem("boocozmo_unread_count", unreadCount.toString());
  }, [unreadCount]);

  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem("boocozmo_notifications", JSON.stringify(notifications.slice(0, 50)));
    }
  }, [notifications]);

  // Fetch unread count from API
  const refreshUnreadCount = useCallback(async () => {
    if (!currentUser?.token) return;
    
    try {
      const response = await fetch(`${API_BASE}/unread-count`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const count = data.unreadCount ?? data.count ?? 0;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [currentUser?.token]);

  // Mark specific notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  }, []);

  // Mark all messages in a chat as read
  const markChatAsRead = useCallback(async (chatId: number) => {
    if (!currentUser?.token) return;
    
    try {
      const response = await fetch(`${API_BASE}/mark-chat-read/${chatId}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        // Update local notifications
        setNotifications(prev => 
          prev.map(n => n.chatId === chatId ? { ...n, isRead: true } : n)
        );
        
        // Refresh count from server
        await refreshUnreadCount();
      }
    } catch (error) {
      console.error("Failed to mark chat as read:", error);
    }
  }, [currentUser?.token, refreshUnreadCount]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem("boocozmo_notifications");
  }, []);

  // Show wishlist match notification
  const showWishlistNotification = useCallback((bookTitle: string, ownerName: string, offerId: number) => {
    const newNotification: NotificationItem = {
      id: `wishlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId: 0,
      senderEmail: "",
      senderName: ownerName,
      message: `"${bookTitle}" from your wishlist is now available!`,
      timestamp: new Date(),
      isRead: false,
      offerId,
      offerTitle: bookTitle,
      type: 'wishlist'
    };

    setNotifications(prev => {
      // Don't add duplicate wishlist notifications for same offer
      if (prev.some(n => n.type === 'wishlist' && n.offerId === offerId)) {
        return prev;
      }
      return [newNotification, ...prev.slice(0, 29)]; // Keep max 30
    });

    // Show browser notification
    if (document.hidden || !document.hasFocus()) {
      showBrowserNotification(
        `✨ Wishlist Match!`,
        `"${bookTitle}" is now available from ${ownerName}`,
        `wishlist-${offerId}`,
        () => {
          window.dispatchEvent(new CustomEvent("navigate-to-offer", { 
            detail: { offerId } 
          }));
        }
      );
    }
  }, []);

  // Show nearby offer notification
  const showNearbyNotification = useCallback((bookTitle: string, ownerName: string, distance: string, offerId: number) => {
    const newNotification: NotificationItem = {
      id: `nearby-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId: 0,
      senderEmail: "",
      senderName: ownerName,
      message: `"${bookTitle}" is available ${distance}!`,
      timestamp: new Date(),
      isRead: false,
      offerId,
      offerTitle: bookTitle,
      type: 'nearby'
    };

    setNotifications(prev => {
      // Don't add duplicate nearby notifications for same offer
      if (prev.some(n => n.type === 'nearby' && n.offerId === offerId)) {
        return prev;
      }
      return [newNotification, ...prev.slice(0, 29)]; // Keep max 30
    });

    // Show browser notification
    if (document.hidden || !document.hasFocus()) {
      showBrowserNotification(
        `📍 Book Nearby!`,
        `"${bookTitle}" is available ${distance} from ${ownerName}`,
        `nearby-${offerId}`,
        () => {
          window.dispatchEvent(new CustomEvent("navigate-to-offer", { 
            detail: { offerId } 
          }));
        }
      );
    }
  }, []);

  // Socket.IO connection management
  useEffect(() => {
    if (!currentUser?.email || !currentUser?.token) {
      // Disconnect if no user
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Request notification permission
    requestNotificationPermission();

    // Fetch initial unread count
    refreshUnreadCount();

    // Create socket connection
    const socket = io(API_BASE, {
      transports: ["websocket", "polling"],
      auth: {
        token: currentUser.token,
        userEmail: currentUser.email
      },
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      // Join user's personal room
      socket.emit("join_user_room", currentUser.email);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.log("Max reconnection attempts reached");
      }
    });

    // Listen for new notifications
    socket.on("new_notification", (data: any) => {
      console.log("New notification received:", data);
      
      const chatId = data.chatId || data.chat_id;
      const senderEmail = data.senderEmail || data.sender_email;
      
      const newNotification: NotificationItem = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        chatId,
        senderEmail,
        senderName: data.senderName || data.sender_name || "Someone",
        message: data.message || data.content || "New message",
        timestamp: new Date(),
        isRead: false,
        offerId: data.offerId || data.offer_id,
        offerTitle: data.offerTitle || data.offer_title,
        type: 'message'
      };

      // Add to notifications list - avoid duplicates from same sender in short time
      setNotifications(prev => {
        const recentFromSameSender = prev.find(n => 
          n.type === 'message' && 
          n.senderEmail === senderEmail && 
          n.chatId === chatId &&
          (Date.now() - new Date(n.timestamp).getTime()) < 10000 // Within 10 seconds
        );
        if (recentFromSameSender) {
          // Update existing notification instead of adding new
          return prev.map(n => n.id === recentFromSameSender.id 
            ? { ...n, message: newNotification.message, timestamp: new Date() }
            : n
          );
        }
        return [newNotification, ...prev.slice(0, 29)]; // Keep max 30
      });
      
      // Increment unread count
      setUnreadCount(prev => prev + 1);

      // Show browser notification if app is not focused (with throttling)
      if (document.hidden || !document.hasFocus()) {
        showBrowserNotification(
          `New message from ${newNotification.senderName}`,
          newNotification.message.substring(0, 100),
          `chat-${chatId}`,
          () => {
            window.dispatchEvent(new CustomEvent("navigate-to-chat", { 
              detail: { chatId } 
            }));
          }
        );
      }
    });

    // Listen for unread count updates
    socket.on("unread_count_update", (data: any) => {
      const count = data.unreadCount ?? data.count ?? data;
      if (typeof count === "number") {
        setUnreadCount(count);
      }
    });

    // Listen for messages_read event (when someone reads your messages)
    socket.on("messages_read", (data: any) => {
      console.log("Messages read:", data);
      // Optionally refresh count
      refreshUnreadCount();
    });

    // Cleanup on unmount
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("new_notification");
      socket.off("unread_count_update");
      socket.off("messages_read");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser?.email, currentUser?.token, refreshUnreadCount]);

  // Periodic refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && currentUser?.token) {
        refreshUnreadCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [currentUser?.token, refreshUnreadCount]);

  // Online/offline handling
  useEffect(() => {
    const handleOnline = () => {
      if (currentUser?.token) {
        refreshUnreadCount();
        // Reconnect socket if needed
        if (socketRef.current && !socketRef.current.connected) {
          socketRef.current.connect();
        }
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [currentUser?.token, refreshUnreadCount]);

  const value: NotificationContextType = {
    unreadCount,
    notifications,
    socket: socketRef.current,
    isConnected,
    markAsRead,
    markChatAsRead,
    clearNotifications,
    refreshUnreadCount,
    showWishlistNotification,
    showNearbyNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
