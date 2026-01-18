/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/NotificationBell.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBell, FaTimes, FaHeart, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

// Local type definition
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
  const { 
    notifications, 
    markAsRead, 
    markChatAsRead, 
    isConnected 
  } = useNotifications();
  
  // State
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derived Values
  const localNotifications = notifications || [];
  const unreadCount = localNotifications.filter(n => !n.isRead).length;
  
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

  const handleNotificationClick = async (notification: NotificationItemType) => {
    markAsRead(notification.id);
    setIsOpen(false);
    
    if (notification.type === 'wishlist' || notification.type === 'nearby') {
       if (notification.offerId) {
         navigate(`/offer/${notification.offerId}`);
       }
    } else if (notification.chatId) {
       await markChatAsRead(notification.chatId);
       navigate(`/chat/${notification.chatId}`);
    }
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#382110] hover:text-white hover:bg-[#382110] rounded-full transition-colors z-[60]"
      >
        <FaBell size={18} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ scale: { repeat: Infinity, duration: 2 }, default: { duration: 0.2 } }}
              exit={{ scale: 0 }}
              className="absolute top-0 right-0 w-3 h-3 bg-[#e74c3c] rounded-full border border-white shadow-[0_0_8px_rgba(231,76,60,0.6)]"
            />
          )}
        </AnimatePresence>
        {!isConnected && (
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-gray-300 border border-white" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 max-h-[70vh] bg-white border border-[#d8d8d8] rounded-xl shadow-2xl z-[100] overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 border-b border-[#eee] flex items-center justify-between bg-[#fcfbf9]">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-[#382110] text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#e74c3c] text-white text-[10px] font-bold rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 text-[#999] hover:text-[#382110]">
                <FaTimes size={12} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[400px]">
              {localNotifications.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-bold text-[#555]">All caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f5f5f5]">
                  {localNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 cursor-pointer ${!notification.isRead ? "bg-[#fffaf0]" : "bg-white"}`}
                    >
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#382110] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {notification.type === 'wishlist' ? <FaHeart size={12} /> : 
                           notification.type === 'nearby' ? <FaMapMarkerAlt size={12} /> : 
                           notification.senderName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-[13px] text-[#382110] font-bold truncate">
                              {notification.senderName}
                            </span>
                            <span className="text-[10px] text-[#999]">{formatTime(notification.timestamp)}</span>
                          </div>
                          <p className="text-xs text-[#555] line-clamp-2">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={() => { localNotifications.forEach(n => markAsRead(n.id)); setIsOpen(false); }}
                className="w-full py-2 bg-[#f9f9f9] border-t text-xs font-bold text-[#555]"
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
