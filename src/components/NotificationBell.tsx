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
  offerTitle?: string;
  type?: 'message' | 'wishlist' | 'nearby';
  offerId?: number;
};

type Props = {
  className?: string;
};

export default function NotificationBell({ className = "" }: Props) {
  const navigate = useNavigate();
  // We use notifications array to calc unread locally for instant feedback
  const { notifications, markAsRead, markChatAsRead, isConnected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate unread count strictly from the local list
  const unreadCount = notifications.filter(n => !n.isRead).length;

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
    // Mark as read immediately in UI
    markAsRead(notification.id);
    
    // Close dropdown
    setIsOpen(false);
    
    // Navigate based on notification type
    if (notification.type === 'wishlist' || notification.type === 'nearby') {
       if (notification.offerId) {
         navigate(`/offer/${notification.offerId}`);
       }
    } else {
      // Message notification
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#382110] hover:text-white hover:bg-[#382110] rounded-full transition-colors z-50"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
      >
        <FaBell size={18} />
        
        {/* Unread Badge - STRICTLY only when unreadCount > 0 */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-0 right-0 w-3 h-3 bg-[#e74c3c] rounded-full border border-white shadow-sm flex items-center justify-center z-50 pointer-events-none"
            >
            </motion.span>
          )}
        </AnimatePresence>

        {/* Connection Dot (subtle, bottom right) */}
        {!isConnected && (
            <span 
              className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-gray-300 border border-white"
              title="Connecting..."
            />
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.3 }}
            className="absolute right-0 top-12 w-80 max-h-[70vh] bg-white border border-[#d8d8d8] rounded-xl shadow-2xl z-[100] overflow-hidden origin-top-right flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#eee] flex items-center justify-between bg-[#fcfbf9]">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-[#382110] text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#e74c3c] text-white text-[10px] font-bold rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#999] hover:text-[#382110] transition-colors rounded-full hover:bg-[#eee]"
              >
                <FaTimes size={12} />
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="py-12 px-8 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#f4f1ea] rounded-full flex items-center justify-center mb-3">
                     <FaBell className="text-xl text-[#dccdb4]" />
                  </div>
                  <p className="text-sm font-bold text-[#555]">All caught up!</p>
                  <p className="text-xs text-[#999] mt-1">No new notifications to show.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f5f5f5]">
                  {notifications.map((notification) => (
                    <motion.div
                      layout
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 cursor-pointer transition-colors relative group
                        ${!notification.isRead ? "bg-[#fffaf0] hover:bg-[#fff5e0]" : "bg-white hover:bg-[#fafafa]"}`
                      }
                    >
                      <div className="flex gap-3">
                        {/* Avatar/Icon based on type */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm mt-1 ${
                          notification.type === 'wishlist' 
                            ? "bg-gradient-to-br from-[#ec4899] to-[#db2777]"
                            : notification.type === 'nearby'
                            ? "bg-gradient-to-br from-[#00635d] to-[#004d48]"
                            : "bg-[#382110]"
                        }`}>
                          {notification.type === 'wishlist' ? (
                            <FaHeart size={12} />
                          ) : notification.type === 'nearby' ? (
                            <FaMapMarkerAlt size={12} />
                          ) : (
                            notification.senderName.charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <span className={`text-[13px] text-[#382110] truncate pr-2 ${!notification.isRead ? 'font-bold' : 'font-semibold'}`}>
                               {notification.type === 'wishlist' ? 'Wishlist Match' 
                                : notification.type === 'nearby' ? 'Nearby Gem'
                                : notification.senderName}
                            </span>
                            <span className="text-[10px] text-[#999] whitespace-nowrap">{formatTime(notification.timestamp)}</span>
                          </div>
                          
                          <p className={`text-xs text-[#555] line-clamp-2 leading-relaxed ${!notification.isRead ? 'font-medium' : 'font-normal'}`}>
                            {notification.message}
                          </p>
                          
                          {notification.offerTitle && (
                             <div className="mt-1 flex items-center gap-1 text-[10px] text-[#00635d] font-bold">
                                <FaBook size={8} /> {notification.offerTitle}
                             </div>
                          )}
                        </div>
                        
                        {/* Unread Dot Indicator right in list items */}
                        {!notification.isRead && (
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#e74c3c] rounded-full shadow-sm" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Mark all read footer (only if unread exist) */}
            {notifications.length > 0 && notifications.some(n=>!n.isRead) && (
                <button 
                  onClick={() => {
                     notifications.forEach(n => markAsRead(n.id)); 
                     setIsOpen(false);
                  }}
                  className="w-full py-2 bg-[#f9f9f9] border-t border-[#eee] text-xs font-bold text-[#555] hover:text-[#382110] hover:bg-[#f0f0f0] transition-colors"
                >
                   Mark all as read
                </button>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
