/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/NotificationBell.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBell, FaEnvelope, FaCheck, FaTimes, FaBook, FaHeart, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

// Local type definition to avoid import issues
type NotificationItemType = {
  id: string;
  chatId: number;
  senderEmail: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  offerId?: number;
  offerTitle?: string;
  type?: 'message' | 'wishlist' | 'nearby';
};

type Props = {
  className?: string;
};

export default function NotificationBell({ className = "" }: Props) {
  const navigate = useNavigate();
  const { unreadCount, notifications, markAsRead, markChatAsRead, isConnected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for navigate-to-chat events from browser notifications
  useEffect(() => {
    const handleNavigateToChat = (event: CustomEvent) => {
      const { chatId } = event.detail;
      if (chatId) {
        navigate(`/chat/${chatId}`);
      }
    };

    window.addEventListener("navigate-to-chat", handleNavigateToChat as EventListener);
    return () => window.removeEventListener("navigate-to-chat", handleNavigateToChat as EventListener);
  }, [navigate]);

  const handleNotificationClick = async (notification: NotificationItemType) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Close dropdown
    setIsOpen(false);
    
    // Navigate based on notification type
    if (notification.type === 'wishlist' || notification.type === 'nearby') {
      // Navigate to offer
      if (notification.offerId) {
        navigate(`/offer/${notification.offerId}`);
      }
    } else {
      // Message notification - navigate to chat
      if (notification.chatId) {
        await markChatAsRead(notification.chatId);
        navigate(`/chat/${notification.chatId}`);
      }
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#382110] hover:text-white hover:bg-[#382110] rounded-full transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
      >
        <FaBell size={16} />
        
        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#d37e2f] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Connection Indicator */}
        <span 
          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
            isConnected ? "bg-green-500" : "bg-gray-400"
          }`}
          title={isConnected ? "Connected" : "Disconnected"}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 max-h-[70vh] bg-white border border-[#d8d8d8] rounded-lg shadow-xl z-[100] overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#eee] flex items-center justify-between bg-[#f4f1ea]">
              <div className="flex items-center gap-2">
                <FaBell className="text-[#382110]" />
                <h3 className="font-bold text-[#382110] text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#d37e2f] text-white text-[10px] font-bold rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#999] hover:text-[#382110] transition-colors"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <FaEnvelope className="mx-auto text-3xl text-[#ccc] mb-3" />
                  <p className="text-sm text-[#777]">No notifications yet</p>
                  <p className="text-xs text-[#999] mt-1">Messages will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-[#eee]">
                  {recentNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 cursor-pointer transition-colors hover:bg-[#f4f1ea] ${
                        !notification.isRead ? "bg-[#f0f9ff]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar/Icon based on type */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                          notification.type === 'wishlist' 
                            ? "bg-gradient-to-br from-[#ec4899] to-[#db2777]"
                            : notification.type === 'nearby'
                            ? "bg-gradient-to-br from-[#00635d] to-[#004d48]"
                            : !notification.isRead 
                            ? "bg-gradient-to-br from-[#d37e2f] to-[#b56c28]" 
                            : "bg-[#999]"
                        }`}>
                          {notification.type === 'wishlist' ? (
                            <FaHeart size={16} />
                          ) : notification.type === 'nearby' ? (
                            <FaMapMarkerAlt size={16} />
                          ) : (
                            notification.senderName.charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-[#382110] text-sm truncate">
                              {notification.type === 'wishlist' ? '✨ Wishlist Match' 
                                : notification.type === 'nearby' ? '📍 Nearby Book'
                                : notification.senderName}
                            </span>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-[#d37e2f] rounded-full flex-shrink-0" />
                            )}
                          </div>
                          
                          <p className="text-xs text-[#555] line-clamp-2 mb-1">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-2 text-[10px] text-[#999]">
                            <span>{formatTime(notification.timestamp)}</span>
                            {notification.offerTitle && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 truncate">
                                  <FaBook size={8} />
                                  {notification.offerTitle}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Read indicator */}
                        {notification.isRead && (
                          <FaCheck className="text-[#00635d] flex-shrink-0" size={12} />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {recentNotifications.length > 0 && (
              <div className="px-4 py-3 border-t border-[#eee] bg-[#fafafa]">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/chat");
                  }}
                  className="w-full text-center text-sm font-medium text-[#00635d] hover:text-[#004d48] transition-colors"
                >
                  View all messages
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
