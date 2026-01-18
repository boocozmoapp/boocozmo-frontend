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
    return;
  }
  
  lastNotificationTime = now;
  
  if (Notification.permission === "granted") {
    try {
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
    } catch (e) {
      console.error("Browser notification failed", e);
    }
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
  const maxReconnectAttempts = 3; // Reduced retry attempts to avoid spamming

  // Load cached data strictly
  useEffect(() => {
    // We do NOT want to load dummy data. Only load if explicitly set.
    const cachedNotifications = localStorage.getItem("boocozmo_notifications");
    if (cachedNotifications) {
      try {
        const parsed = JSON.parse(cachedNotifications);
        if (Array.isArray(parsed) && parsed.length > 0) {
           const validDefaults = parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
           setNotifications(validDefaults);
           
           // Recalculate unread count based on actual local items to avoid sync drift
           const localUnread = validDefaults.filter(n => !n.isRead).length;
           setUnreadCount(localUnread);
        }
      } catch (e) {
        console.error("Failed to parse cached notifications:", e);
        // If error, clear it to prevent issues
        localStorage.removeItem("boocozmo_notifications");
      }
    }
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    // Only save recent 50
    const toSave = notifications.slice(0, 50);
    localStorage.setItem("boocozmo_notifications", JSON.stringify(toSave));
    
    // Strict calc
    const count = notifications.filter(n => !n.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  // Fetch unread count from API
  const refreshUnreadCount = useCallback(async () => {
    if (!currentUser?.token) return;
    
    try {
      // NOTE: We primarily rely on the local notification list for the badge to ensure
      // immediate UI updates, but we fetch from server to stay in sync.
      const response = await fetch(`${API_BASE}/unread-messages`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        // If server returns count, trust it for the badge
        if (typeof data.count === 'number') {
           setUnreadCount(data.count);
        }
      } else {
        // Fallback: if route fails (e.g. 404), manually fetch chats and count unread
        // This handles the case where the backend endpoint might be missing temporary
        const chatRest = await fetch(`${API_BASE}/chats?user=${encodeURIComponent(currentUser.email)}`, {
          headers: { "Authorization": `Bearer ${currentUser.token}` }
        });
        if (chatRest.ok) {
           const chats = await chatRest.json();
           const count = chats.reduce((acc: number, c: any) => {
             const isUnread = (c.user1 === currentUser.email && c.unread_user1) || 
                              (c.user2 === currentUser.email && c.unread_user2);
             return acc + (isUnread ? 1 : 0);
           }, 0);
           setUnreadCount(count);
        }
      }
    } catch (error) {
       // Silent fail
    }
  }, [currentUser?.email, currentUser?.token]);

  // Mark specific notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    // Unread count will auto-update via the useEffect above
  }, []);

  // Mark all messages in a chat as read
  const markChatAsRead = useCallback(async (chatId: number) => {
    // Optimistic update first
    setNotifications(prev => 
      prev.map(n => n.chatId === chatId ? { ...n, isRead: true } : n)
    );

    if (!currentUser?.token) return;
    
    // The backend automatically marks messages as read when we fetch them via /chat-messages/:id
    // So we don't need a separate API call here, just the local optimistic update above.
  }, [currentUser?.token]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem("boocozmo_notifications");
    setUnreadCount(0);
  }, []);

  // Internal Logic for adding notifications safely
  const addNotification = useCallback((item: NotificationItem) => {
    setNotifications(prev => {
       // Avoid duplicates
       if (prev.some(n => n.id === item.id)) return prev;
       
       // Avoid "spam" duplicates (same content/type within 5 seconds)
       const recentDup = prev.find(n => 
          n.type === item.type && 
          n.message === item.message &&
          (Date.now() - new Date(n.timestamp).getTime() < 5000)
       );
       if (recentDup) return prev;

       return [item, ...prev];
    });
  }, []);

  // Show wishlist match notification
  const showWishlistNotification = useCallback((bookTitle: string, ownerName: string, offerId: number) => {
    const newItem: NotificationItem = {
      id: `wishlist-${offerId}`, // Stable ID to prevent dupes
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
    
    addNotification(newItem);

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
  }, [addNotification]);

  // Show nearby offer notification
  const showNearbyNotification = useCallback((bookTitle: string, ownerName: string, distance: string, offerId: number) => {
    const newItem: NotificationItem = {
      id: `nearby-${offerId}`,
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

    addNotification(newItem);

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
  }, [addNotification]);

    // Socket.IO connection management
    useEffect(() => {
      if (!currentUser?.email || !currentUser?.token) {
        return;
      }
  
      requestNotificationPermission();
  
      // Use websocket transport only to avoid polling 404s
      const socket = io(API_BASE, {
        transports: ["websocket"], 
        auth: {
          token: currentUser.token,
          userEmail: currentUser.email
        },
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 20000,
        autoConnect: true
      });
  
      socketRef.current = socket;
  
      socket.on("connect", async () => {
        console.log("Socket connected");
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Strategy: Since backend only emits to chat rooms, we must join all our chat rooms
        // to receive real-time notifications for them.
        try {
          const resp = await fetch(`${API_BASE}/chats?user=${encodeURIComponent(currentUser.email)}`, {
             headers: { "Authorization": `Bearer ${currentUser.token}` }
          });
          if (resp.ok) {
            const chats = await resp.json();
            chats.forEach((chat: any) => {
              socket.emit("join-chat", chat.id);
            });
            console.log(`Joined ${chats.length} chat rooms for notifications`);
          }
        } catch (e) {
          console.error("Failed to join chat rooms:", e);
        }
      });
  
      socket.on("disconnect", () => {
        setIsConnected(false);
      });
  
      socket.on("connect_error", (err) => {
        if (reconnectAttempts.current < 2) {
           console.log("Socket connect error, retrying...", err.message);
        }
        reconnectAttempts.current++;
      });
  
      // Listen for 'new-message' (from backend server.js)
      socket.on("new-message", (data: any) => {
        console.log("New message received via socket:", data);
        
        // Ignore own messages
        if (data.sender === currentUser.email) return;

        const chatId = data.chatId;
        
        const newItem: NotificationItem = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          chatId,
          senderEmail: data.sender || "", // Backend sends 'sender' (email)
          senderName: data.senderName || "User", // We might not get name directly, fallback
          message: data.message || "New message",
          timestamp: new Date(data.timestamp),
          isRead: false,
          type: 'message'
        };
  
        addNotification(newItem);
        setUnreadCount(prev => prev + 1); // Optimistically increment
  
        // Show browser notification if app is not focused
        if (document.hidden || !document.hasFocus()) {
          showBrowserNotification(
            `New Message`,
            newItem.message,
            `chat-${chatId}`,
            () => {
               window.dispatchEvent(new CustomEvent("navigate-to-chat", { 
                 detail: { chatId } 
               }));
            }
          );
        }
      });
  
      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }, [currentUser?.email, currentUser?.token, addNotification]);

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
