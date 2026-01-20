// src/components/EmptyState.tsx - Beautiful Empty State Illustrations
import { motion } from "framer-motion";
import { FaBook, FaComments, FaSearch, FaBell, FaStore, FaUsers, FaHeart, FaPlus } from "react-icons/fa";
import type { ReactNode } from "react";

type EmptyStateType = "books" | "chats" | "search" | "notifications" | "stores" | "community" | "wishlist" | "library";

type Props = {
  type: EmptyStateType;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

const illustrations: Record<EmptyStateType, { icon: ReactNode; defaultTitle: string; defaultMessage: string; color: string }> = {
  books: {
    icon: <FaBook size={40} />,
    defaultTitle: "No Books Yet",
    defaultMessage: "Start your reading journey by discovering amazing books!",
    color: "from-[#382110] to-[#5a3e2b]",
  },
  chats: {
    icon: <FaComments size={40} />,
    defaultTitle: "No Conversations",
    defaultMessage: "Start chatting with book lovers to trade your favorite reads!",
    color: "from-[#377458] to-[#2d5c46]",
  },
  search: {
    icon: <FaSearch size={40} />,
    defaultTitle: "No Results Found",
    defaultMessage: "Try adjusting your search or browse our book collection.",
    color: "from-blue-500 to-indigo-600",
  },
  notifications: {
    icon: <FaBell size={40} />,
    defaultTitle: "All Caught Up!",
    defaultMessage: "You have no new notifications. Check back later!",
    color: "from-amber-500 to-orange-500",
  },
  stores: {
    icon: <FaStore size={40} />,
    defaultTitle: "No Stores Found",
    defaultMessage: "Be the first to create a bookstore in your area!",
    color: "from-purple-500 to-pink-500",
  },
  community: {
    icon: <FaUsers size={40} />,
    defaultTitle: "No Communities Yet",
    defaultMessage: "Join or create a community to connect with fellow readers!",
    color: "from-cyan-500 to-blue-500",
  },
  wishlist: {
    icon: <FaHeart size={40} />,
    defaultTitle: "Wishlist is Empty",
    defaultMessage: "Save books you want to read by adding them to your wishlist!",
    color: "from-rose-500 to-red-500",
  },
  library: {
    icon: <FaBook size={40} />,
    defaultTitle: "Your Library is Empty",
    defaultMessage: "Add books to your library to start trading!",
    color: "from-[#8b5a2b] to-[#6d4422]",
  },
};

export default function EmptyState({ type, title, message, action }: Props) {
  const config = illustrations[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      {/* Animated Icon Container */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="relative mb-6"
      >
        {/* Background glow */}
        <div className={`absolute inset-0 bg-gradient-to-r ${config.color} rounded-full blur-xl opacity-20 scale-150`} />
        
        {/* Icon container */}
        <div className={`relative w-24 h-24 bg-gradient-to-br ${config.color} rounded-3xl flex items-center justify-center text-white shadow-xl`}>
          {config.icon}
        </div>
        
        {/* Decorative elements */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          className="absolute -bottom-2 -left-2 w-3 h-3 bg-[#377458] rounded-full"
        />
      </motion.div>

      {/* Text */}
      <h3 className="text-xl font-bold font-serif text-[#382110] mb-2">
        {title || config.defaultTitle}
      </h3>
      <p className="text-[#555] max-w-xs leading-relaxed mb-6">
        {message || config.defaultMessage}
      </p>

      {/* Action Button */}
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${config.color} text-white font-semibold shadow-lg hover:shadow-xl transition-shadow`}
        >
          <FaPlus size={14} />
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
