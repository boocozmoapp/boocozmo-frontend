/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ChatScreen.tsx - PREMIUM THEME
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaHome, FaMapMarkedAlt, FaComments,
  FaBookmark, FaCompass, FaBookOpen, FaUsers, 
  FaBars, FaTimes, FaSearch
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

const API_BASE = "https://boocozmo-api.onrender.com";

type Conversation = {
  id: number;
  other_user_name: string | null;
  offer_title: string | null;
  last_message_at: string | null;
  created_at: string;
  unread_user1?: boolean;
  unread_user2?: boolean;
  user1: string;
  user2: string;
  title?: string | null;
  offer_id?: number;
  other_user?: {
    name: string;
    profilePhoto: string | null;
    email: string;
  };
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
  onProfilePress?: () => void;
  onMapPress?: () => void;
  onAddPress?: () => void;
};

export default function ChatScreen({ currentUser }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  
  // Use notification context
  const { refreshUnreadCount, markChatAsRead, socket } = useNotifications();

  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/chats?user=${encodeURIComponent(currentUser.email)}`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` },
      });
      if (!resp.ok) throw new Error();
      const chats = await resp.json();
      setConversations(chats);
      setError(null);
    } catch (err: any) {
      setError("Could not load chats");
      setConversations([]);
    } finally { 
      setLoading(false); 
    }
  }, [currentUser.email, currentUser.token]);

  // Initial fetch
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Refresh unread count when screen mounts
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Listen for new messages to refresh chat list
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      // Refresh chat list when new message arrives
      fetchChats();
    };

    socket.on("new_notification", handleNewMessage);
    
    return () => {
      socket.off("new_notification", handleNewMessage);
    };
  }, [socket, fetchChats]);

  const handleChatClick = async (conv: Conversation) => {
    // Check if this chat has unread messages for current user
    const hasUnread = (conv.user1 === currentUser.email && conv.unread_user1) || 
                      (conv.user2 === currentUser.email && conv.unread_user2);
    
    if (hasUnread) {
      // Mark chat as read
      await markChatAsRead(conv.id);
      
      // Update local state
      setConversations(prev => prev.map(c => {
        if (c.id === conv.id) {
          if (c.user1 === currentUser.email) {
            return { ...c, unread_user1: false };
          } else {
            return { ...c, unread_user2: false };
          }
        }
        return c;
      }));
    }
    
    navigate(`/chat/${conv.id}`, { state: { chat: conv } });
  };

  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaMapMarkedAlt, label: "Map", onClick: () => navigate("/map") },
    { icon: FaBookOpen, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaCompass, label: "Discover", onClick: () => navigate("/discover") },
    { icon: FaBookmark, label: "Saved", onClick: () => navigate("/saved") },
    { icon: FaUsers, label: "Community", onClick: () => navigate("/community") },
    { icon: FaComments, label: "Messages", active: true, onClick: () => navigate("/chat") },
  ];

  const filtered = conversations.filter(c => 
    (c.other_user?.name || c.other_user_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.offer_title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-110px)] md:h-[calc(100vh-60px)] w-full bg-primary text-text-main flex overflow-hidden font-sans">
      <AnimatePresence>
        {sidebarOpen && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden" />}
      </AnimatePresence>

      <motion.aside initial={false} animate={{ width: sidebarOpen ? 260 : 80 }} className="hidden md:flex flex-col bg-primary-light/80 backdrop-blur-xl border-r border-white/5 z-50 overflow-hidden">
        <div className="p-6 flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white text-xl font-bold font-serif">B</div>{sidebarOpen && <span className="font-serif font-bold text-xl text-white">Boocozmo</span>}</div>
        <nav className="flex-1 px-4 space-y-2">{navItems.map(item => (<button key={item.label} onClick={item.onClick} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${item.active ? 'bg-secondary/20 text-secondary' : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'}`}><item.icon size={20} />{sidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}</button>))}</nav>
      </motion.aside>

      <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-primary via-primary-light/20 to-primary relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
         
         <header className="h-20 px-6 flex items-center justify-between border-b border-white/5 bg-primary/80 backdrop-blur-md sticky top-0 z-30">
            <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">Messages</h1>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 text-white"><FaBars /></button>
         </header>

         <div className="p-6 pb-2">
            <div className="relative">
               <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
               <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search messages..." className="w-full bg-primary-light/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:border-secondary outline-none transition-colors" />
            </div>
         </div>

         <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 space-y-3">
            {filtered.length === 0 ? (
               <div className="text-center py-20 text-gray-400">No messages found.</div>
            ) : (
               filtered.map((conv, i) => (
                  <motion.div 
                     key={conv.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.05 }}
                     onClick={() => handleChatClick(conv)}
                     className="bg-primary-light/30 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/5 cursor-pointer transition-colors group relative overflow-hidden"
                  >
                     <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-secondary-hover flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                        {conv.other_user?.profilePhoto ? (
                           <img src={conv.other_user.profilePhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                           (conv.other_user?.name || conv.other_user_name || "?").charAt(0)
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                           <h3 className="font-bold text-white truncate">{conv.other_user?.name || conv.other_user_name || "Unknown"}</h3>
                           <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(conv.last_message_at || conv.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">
                           {(conv as any).store_id 
                              ? `Store Inquiry: ${(conv.offer_title || conv.title || "Store").replace(/^Inquiry:\s*/i, "")}`
                              : (conv.offer_title || conv.title || (conv as any).bookTitle || "Book Inquiry")}
                        </p>
                     </div>
                     {((conv.user1 === currentUser.email && conv.unread_user1) || (conv.user2 === currentUser.email && conv.unread_user2)) && (
                        <div className="w-3 h-3 rounded-full bg-secondary shadow-lg shadow-secondary/50" />
                     )}
                  </motion.div>
               ))
            )}
         </main>
      </div>
    </div>
  );
}