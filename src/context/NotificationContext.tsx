/* eslint-disable @typescript-eslint/no-explicit-any */
// src/context/NotificationContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { AnimatePresence, motion } from "framer-motion";

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
  activeToast: NotificationItem | null;
  closeToast: () => void;
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
  activeToast: null,
  closeToast: () => {},
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
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const recentlyReadRef = useRef<Map<number, number>>(new Map()); // chatId -> timestamp

  // Load cached data strictly
  useEffect(() => {
    const cachedNotifications = localStorage.getItem("boocozmo_notifications");
    if (cachedNotifications) {
      try {
        const parsed = JSON.parse(cachedNotifications);
        if (Array.isArray(parsed) && parsed.length > 0) {
           const validDefaults = parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
           setNotifications(validDefaults);
           
           const localUnread = validDefaults.filter(n => !n.isRead).length;
           setUnreadCount(localUnread);
        }
      } catch (e) {
        localStorage.removeItem("boocozmo_notifications");
      }
    }
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    const toSave = notifications.slice(0, 50);
    localStorage.setItem("boocozmo_notifications", JSON.stringify(toSave));
    
    const count = notifications.filter(n => !n.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  const refreshUnreadCount = useCallback(async () => {
    if (!currentUser?.token) return;
    
    try {
      const chatResp = await fetch(`${API_BASE}/chats?user=${encodeURIComponent(currentUser.email)}`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });
      
      if (chatResp.ok) {
        const chats = await chatResp.json();
        
        // CRITICAL: Get server's TOTAL unread count
        let totalServerUnread = 0;
        chats.forEach((chat: any) => {
          totalServerUnread += parseInt(chat.unread_count) || 0;
        });

        // === FIX 1: If server says 0 unread, CLEAR everything locally ===
        if (totalServerUnread === 0) {
          setNotifications(prev => 
            prev.map(n => ({ ...n, isRead: true }))
          );
          return; // STOP HERE - don't create new notifications
        }

        // === FIX 2: Update recentlyRead cache ===
        const now = Date.now();
        recentlyReadRef.current.forEach((time, id) => {
          if (now - time > 30000) recentlyReadRef.current.delete(id);
        });

        setNotifications(prev => {
          // Start with all existing notifications marked as read
          let updated = prev.map(n => ({ ...n, isRead: true }));
          
          // Only create new notifications for chats that:
          // 1. Have unread messages on server
          // 2. Aren't in recentlyRead cache
          // 3. Don't already have a notification
          chats.forEach((chat: any) => {
            const unreadCount = parseInt(chat.unread_count) || 0;
            const chatId = Number(chat.id);
            const isRecentlyRead = recentlyReadRef.current.has(chatId);
            
            if (unreadCount > 0 && !isRecentlyRead) {
              const lastMsg = chat.last_message || {};
              const msgTime = lastMsg.created_at ? new Date(lastMsg.created_at).getTime() : Date.now();
              const msgContent = lastMsg.content || "New unread messages";
              
              const stableId = `msg-${chat.id}-${msgTime}`;
              
              // Check if we already have this exact notification
              const alreadyExists = updated.some(n => 
                n.id === stableId || 
                (Number(n.chatId) === chatId && !n.isRead)
              );
              
              if (!alreadyExists) {
                updated.unshift({
                  id: stableId,
                  chatId,
                  senderEmail: chat.other_user?.email || "",
                  senderName: chat.other_user?.name || "User",
                  message: msgContent,
                  timestamp: lastMsg.created_at ? new Date(lastMsg.created_at) : new Date(),
                  isRead: false, // This is the ONLY place we create new unread notifications
                  offerTitle: chat.offer_title || chat.title || null,
                  type: 'message'
                });
              }
            }
          });
          
          return updated.slice(0, 50);
        });
      }
    } catch (error) {
       console.error("Refresh unread sync failed:", error);
    }
  }, [currentUser?.email, currentUser?.token]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  }, []);

  const markChatAsRead = useCallback(async (chatId: number) => {
    if (!currentUser?.token) return;
    
    // Add to recently read cache with a longer timeout (5 minutes)
    recentlyReadRef.current.set(Number(chatId), Date.now());
    
    // IMMEDIATELY mark all notifications for this chat as read locally
    setNotifications(prev => 
      prev.map(n => Number(n.chatId) === Number(chatId) ? { ...n, isRead: true } : n)
    );

    try {
      await fetch(`${API_BASE}/mark-read`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ chatId })
      });
      
      // Force a refresh after 1 second to sync with server
      setTimeout(() => refreshUnreadCount(), 1000);
    } catch (e) {
      console.error("Failed to mark chat as read:", e);
    }
  }, [currentUser?.token, refreshUnreadCount]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem("boocozmo_notifications");
    setUnreadCount(0);
  }, []);

  const closeToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const addNotification = useCallback((item: NotificationItem) => {
    setNotifications(prev => {
       if (prev.some(n => n.id === item.id)) return prev;
       const recentDup = prev.find(n => 
          n.type === item.type && n.message === item.message && (Date.now() - new Date(n.timestamp).getTime() < 5000)
       );
       if (recentDup) return prev;
       return [item, ...prev];
    });
  }, []);

  const showWishlistNotification = useCallback((bookTitle: string, ownerName: string, offerId: number) => {
    const newItem: NotificationItem = {
      id: `wishlist-${offerId}`,
      chatId: 0,
      senderEmail: "",
      senderName: ownerName,
      message: `"${bookTitle}" is now available!`,
      timestamp: new Date(),
      isRead: false,
      offerId,
      offerTitle: bookTitle,
      type: 'wishlist'
    };
    addNotification(newItem);
    if (document.hidden || !document.hasFocus()) {
      showBrowserNotification(`✨ Wishlist Match!`, `"${bookTitle}" is now available from ${ownerName}`, `wishlist-${offerId}`);
    }
  }, [addNotification]);

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
    if (document.hidden || !document.hasFocus()) {
      showBrowserNotification(`📍 Book Nearby!`, `"${bookTitle}" is available ${distance} from ${ownerName}`, `nearby-${offerId}`);
    }
  }, [addNotification]);

  useEffect(() => {
    if (!currentUser?.email || !currentUser?.token) return;

    requestNotificationPermission();

    const socket = io(API_BASE, {
      transports: ["websocket"], 
      auth: { token: currentUser.token, userEmail: currentUser.email }
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      refreshUnreadCount();
      socket.emit("join_user_room", currentUser.email);
    });

    socket.on("disconnect", () => setIsConnected(false));

    const handleIncomingMessage = (data: any) => {
      const sender = data.sender || data.senderEmail || data.sender_email;
      const msgContent = data.message || data.content || "New message";
      const msgChatId = data.chatId || data.chat_id;

      if (sender?.toLowerCase() === currentUser.email.toLowerCase()) return;

      const newItem: NotificationItem = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        chatId: msgChatId,
        senderEmail: sender || "", 
        senderName: data.senderName || data.sender_name || "User",
        message: msgContent,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        isRead: false,
        type: 'message'
      };

      addNotification(newItem);
      setUnreadCount(prev => prev + 1);

      if (document.hidden || !document.hasFocus()) {
        showBrowserNotification(`Message from ${newItem.senderName}`, newItem.message);
      } else {
        const isAtThisChat = window.location.pathname.includes(`/chat/${msgChatId}`);
        if (!isAtThisChat) {
          setActiveToast(newItem);
          // Auto-dismiss after 6s, but only if it's still THIS specific toast
          setTimeout(() => {
            setActiveToast(current => current?.id === newItem.id ? null : current);
          }, 6000);
        }
      }
    };

    socket.on("new_notification", handleIncomingMessage);
    socket.on("new-message", handleIncomingMessage);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser, addNotification, refreshUnreadCount]);

  // Added: Refresh unread count on mount/identity change
  useEffect(() => {
    if (!currentUser?.token) return;

    // Initial fetch
    refreshUnreadCount();

    // Professional Background Refresh: 
    // Keep checking for messages every 20 seconds in the background
    // to handle cases where socket might be sleeping or missed an event.
    const interval = setInterval(() => {
        console.log("Background notification sync...");
        refreshUnreadCount();
    }, 20000);

    return () => clearInterval(interval);
  }, [currentUser?.token, refreshUnreadCount]);

  const value = {
    unreadCount, notifications, socket: socketRef.current, isConnected,
    markAsRead, markChatAsRead, clearNotifications, refreshUnreadCount,
    showWishlistNotification, showNearbyNotification, activeToast, closeToast
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {activeToast && (
          <motion.div 
            initial={{ y: -100, x: "-50%", opacity: 0 }}
            animate={{ y: 20, x: "-50%", opacity: 1 }}
            exit={{ y: -100, x: "-50%", opacity: 0 }}
            className="fixed top-0 left-1/2 w-[90%] max-w-[400px] bg-[#382110] text-white p-4 rounded-2xl shadow-2xl z-[10000] flex items-center gap-4 cursor-pointer"
            onClick={() => { window.location.href = `/chat/${activeToast.chatId}`; setActiveToast(null); }}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg">
              {activeToast.senderName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate">{activeToast.senderName}</h4>
              <p className="text-xs opacity-90 truncate">{activeToast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};

export default NotificationContext;