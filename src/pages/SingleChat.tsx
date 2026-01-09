/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/SingleChat.tsx - PREMIUM THEME
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaPaperPlane, FaCheck, FaCheckDouble } from "react-icons/fa";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

const API_BASE = "https://boocozmo-api.onrender.com";

type Message = {
  id: number;
  senderEmail?: string;
  sender_email?: string; // Backend might use snake_case
  content: string;
  created_at: string;
  is_read: boolean;
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
};

export default function SingleChat({ currentUser }: Props) {
  const { chatId } = useParams<{ chatId: string }>();
  // Handle "new" or numeric ID
  const [activeChatId, setActiveChatId] = useState<string | number | null>(
    chatId === "new" ? null : Number(chatId)
  );

  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInfo = location.state?.chat;
  
  // Use notification context
  const { markChatAsRead, socket, refreshUnreadCount } = useNotifications();

  // Mark chat as read when opened
  useEffect(() => {
    if (activeChatId && typeof activeChatId === "number") {
      markChatAsRead(activeChatId);
    }
  }, [activeChatId, markChatAsRead]);

  // Listen for new messages in this chat via socket
  useEffect(() => {
    if (!socket || !activeChatId) return;

    const handleNewMessage = (data: any) => {
      // If message is for this chat, refresh messages
      if (data.chatId === activeChatId || data.chat_id === activeChatId) {
        // Add the new message to the list
        const msgSenderEmail = data.senderEmail || data.sender_email || '';
        const newMsg: Message = {
          id: data.messageId || Date.now(),
          senderEmail: msgSenderEmail,
          sender_email: msgSenderEmail,
          content: data.message || data.content,
          created_at: new Date().toISOString(),
          is_read: false
        };
        
        // Only add if not from current user (to avoid duplicates with optimistic updates)
        if (msgSenderEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
          setMessages(prev => [...prev, newMsg]);
          // Mark as read immediately since user is viewing the chat
          markChatAsRead(activeChatId as number);
        }
      }
    };

    socket.on("new_notification", handleNewMessage);
    
    return () => {
      socket.off("new_notification", handleNewMessage);
    };
  }, [socket, activeChatId, currentUser.email, markChatAsRead]);

  const fetchMessages = useCallback(async () => {
    if (!activeChatId) return;
    try {
      const resp = await fetch(`${API_BASE}/chat-messages?chat_id=${activeChatId}`, { headers: { Authorization: `Bearer ${currentUser.token}` } });
      if (resp.ok) {
         const data = await resp.json();
         setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch {}
  }, [activeChatId, currentUser]);

  useEffect(() => { 
     fetchMessages();
     const interval = setInterval(fetchMessages, 3000); // Polling
     return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    const tempId = Date.now();
    const optimisticMsg: Message = { id: tempId, senderEmail: currentUser.email, sender_email: currentUser.email, content: newMessage, created_at: new Date().toISOString(), is_read: false };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");
    setSending(true);

    try {
      const res = await fetch(`${API_BASE}/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentUser.token}` },
        body: JSON.stringify({ 
           sender: currentUser.email, 
           receiver: chatInfo?.user1 === currentUser.email ? chatInfo?.user2 : chatInfo?.user1 || chatInfo?.ownerEmail, 
           content: optimisticMsg.content, 
           // If we have an active numeric ID, use it. Otherwise 0 tells backend to create new.
           chat_id: activeChatId || 0, 
           offer_id: chatInfo?.offer_id 
        }),
      });
      
      if (!res.ok) throw new Error("Failed");
      
      const data = await res.json();
      // If backend returns a new chat ID (e.g. data.chat_id or data.id), update activeChatId
      if (!activeChatId && data.chat_id) {
         setActiveChatId(data.chat_id);
         // Optionally update URL without reload
         window.history.replaceState(null, "", `/chat/${data.chat_id}`);
      }

      fetchMessages(); // Sync
    } catch {
       setMessages(prev => prev.filter(m => m.id !== tempId)); // Revert on fail
    } finally { setSending(false); }
  };

  return (
    <div className="h-screen w-full bg-[#f4f1ea] flex flex-col font-sans text-[#333]">
      {/* Header */}
      <header className="h-16 px-4 flex items-center gap-4 bg-white border-b border-[#d8d8d8] z-20">
         <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#555] hover:text-[#382110]"><FaArrowLeft /></button>
         <div className="flex-1">
            <h1 className="font-serif font-bold text-[#382110] text-lg">{chatInfo?.other_user_name || chatInfo?.ownerName || "Chat"}</h1>
            <p className="text-xs text-[#555] truncate max-w-[200px]">{chatInfo?.offer_title || chatInfo?.bookTitle || "Book Inquiry"}</p>
         </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f4f1ea]">
         {messages.length === 0 && <div className="text-center text-[#999] py-10">Start the conversation!</div>}
         {messages.map((m, i) => {
            // Handle both camelCase and snake_case from backend
            const senderEmail = m.senderEmail || m.sender_email || '';
            const isMe = senderEmail.toLowerCase() === currentUser.email.toLowerCase();
            return (
               <motion.div 
                  key={m.id || i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
               >
                  <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${isMe ? 'bg-[#e8e4dd] text-[#333] rounded-bl-sm border border-[#d8d8d8]' : 'bg-[#382110] text-white rounded-br-sm'}`}>
                     <p className="text-sm leading-relaxed">{m.content}</p>
                     <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-[#777]' : 'text-white/60'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {isMe && (m.is_read ? <FaCheckDouble /> : <FaCheck />)}
                     </div>
                  </div>
               </motion.div>
            );
         })}
         <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <div className="p-4 bg-white border-t border-[#d8d8d8] pb-6">
         <div className="flex items-center gap-2 bg-[#f4f1ea] border border-[#d8d8d8] rounded-full px-4 py-2 focus-within:border-[#382110] transition-colors">
            <input 
               value={newMessage} 
               onChange={e => setNewMessage(e.target.value)} 
               onKeyDown={e => e.key === 'Enter' && handleSend()}
               placeholder="Type a message..." 
               className="flex-1 bg-transparent border-none outline-none text-[#333] placeholder-[#999] py-2"
            />
            <button onClick={handleSend} disabled={!newMessage.trim() || sending} className="p-2 bg-[#382110] text-white rounded-full disabled:opacity-50 hover:bg-[#2a190c] transition-colors">
               <FaPaperPlane size={14} />
            </button>
         </div>
      </div>
    </div>
  );
}