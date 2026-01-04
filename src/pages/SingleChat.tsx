/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/SingleChat.tsx - PREMIUM THEME
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaPaperPlane, FaCheck, FaCheckDouble } from "react-icons/fa";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

type Message = {
  id: number;
  senderEmail: string;
  content: string;
  created_at: string;
  is_read: boolean;
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
};

export default function SingleChat({ currentUser }: Props) {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInfo = location.state?.chat;

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const resp = await fetch(`${API_BASE}/chat-messages?chat_id=${chatId}`, { headers: { Authorization: `Bearer ${currentUser.token}` } });
      if (resp.ok) {
         const data = await resp.json();
         setMessages(Array.isArray(data) ? data : data.messages || []);
      }
    } catch {}
  }, [chatId, currentUser]);

  useEffect(() => { 
     fetchMessages();
     const interval = setInterval(fetchMessages, 3000); // Polling
     return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    const tempId = Date.now();
    const optimisticMsg: Message = { id: tempId, senderEmail: currentUser.email, content: newMessage, created_at: new Date().toISOString(), is_read: false };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");
    setSending(true);

    try {
      await fetch(`${API_BASE}/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentUser.token}` },
        body: JSON.stringify({ 
           sender: currentUser.email, 
           receiver: chatInfo?.user1 === currentUser.email ? chatInfo?.user2 : chatInfo?.user1, 
           content: optimisticMsg.content, 
           chat_id: Number(chatId), 
           offer_id: chatInfo?.offer_id 
        }),
      });
      fetchMessages(); // Sync
    } catch {
       setMessages(prev => prev.filter(m => m.id !== tempId)); // Revert on fail
    } finally { setSending(false); }
  };

  return (
    <div className="h-screen w-full bg-primary flex flex-col font-sans text-text-main">
      {/* Header */}
      <header className="h-16 px-4 flex items-center gap-4 bg-primary-light/80 backdrop-blur-md border-b border-white/5 z-20">
         <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-300 hover:text-white"><FaArrowLeft /></button>
         <div className="flex-1">
            <h1 className="font-serif font-bold text-white text-lg">{chatInfo?.other_user_name || "Chat"}</h1>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">{chatInfo?.offer_title || "Book Inquiry"}</p>
         </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-primary to-primary-light/20">
         {messages.length === 0 && <div className="text-center text-gray-500 py-10">Start the conversation!</div>}
         {messages.map((m, i) => {
            const isMe = m.senderEmail === currentUser.email;
            return (
               <motion.div 
                  key={m.id || i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
               >
                  <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${isMe ? 'bg-secondary text-white rounded-br-sm' : 'bg-primary-light border border-white/10 text-gray-200 rounded-bl-sm'}`}>
                     <p className="text-sm leading-relaxed">{m.content}</p>
                     <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-white/60' : 'text-gray-500'}`}>
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
      <div className="p-4 bg-primary border-t border-white/5 pb-6">
         <div className="flex items-center gap-2 bg-primary-light/50 border border-white/10 rounded-full px-4 py-2 focus-within:border-secondary transition-colors">
            <input 
               value={newMessage} 
               onChange={e => setNewMessage(e.target.value)} 
               onKeyDown={e => e.key === 'Enter' && handleSend()}
               placeholder="Type a message..." 
               className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 py-2"
            />
            <button onClick={handleSend} disabled={!newMessage.trim() || sending} className="p-2 bg-secondary text-white rounded-full disabled:opacity-50 hover:bg-secondary-hover transition-colors">
               <FaPaperPlane size={14} />
            </button>
         </div>
      </div>
    </div>
  );
}