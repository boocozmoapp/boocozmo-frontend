// src/pages/SingleChat.tsx - PINTEREST-STYLE REDESIGN (Matching HomeScreen & ChatScreen Theme)
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  FaArrowLeft, 
  FaPaperPlane, 
  FaEllipsisH, 
  FaTimes,
  FaHome,
  FaMapMarkedAlt,
  FaPlus,
  FaComments,
  FaBell,
  FaBookmark,
  FaCompass,
  FaBook,
  FaStar,
  FaCog,
  FaUsers
} from "react-icons/fa";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

// Exact Pinterest colors from previous screens
const PINTEREST = {
  primary: "#E60023",
  dark: "#A3081A",
  light: "#FF4D6D",
  bg: "#FFFFFF",
  sidebarBg: "#FFFFFF",
  textDark: "#000000",
  textLight: "#5F5F5F",
  textMuted: "#8E8E8E",
  border: "#E1E1E1",
  hoverBg: "#F5F5F5",
  icon: "#767676",
  redLight: "#FFE2E6",
  grayLight: "#F7F7F7",
  overlay: "rgba(0, 0, 0, 0.7)"
};

type Message = {
  id: number;
  senderEmail: string;
  content: string;
  created_at: string;
  is_read: boolean;
  receiverEmail?: string;
  chat_id?: number;
};

type Chat = {
  id: number;
  user1: string;
  user2: string;
  offer_id: number;
  title: string | null;
  last_message_at: string | null;
  created_at: string;
  unread_user1?: boolean;
  unread_user2?: boolean;
  other_user_name?: string;
  offer_title?: string;
};

type SingleChatProps = {
  currentUser: { email: string; name: string; id: string };
  onProfilePress?: () => void;
  onMapPress?: () => void;
  onAddPress?: () => void;
};

export default function SingleChat({ 
  currentUser,
  onProfilePress,
  onMapPress,
  onAddPress 
}: SingleChatProps) {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (messages.length > 0) {
      const latestId = Math.max(...messages.map(m => m.id));
      lastMessageIdRef.current = latestId;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  const fetchChatAndMessages = useCallback(async (silent = false) => {
    if (!chatId || !isMountedRef.current) return;

    if (!silent) setIsPolling(true);

    try {
      const chatResp = await fetch(`${API_BASE}/chats/${chatId}`);
      
      if (chatResp.ok) {
        const chatData = await chatResp.json();
        
        if (chatData.chat && isMountedRef.current) {
          setChat(prevChat => ({
            ...prevChat,
            ...chatData.chat,
          }));
        }

        let newMessages: Message[] = [];
        
        if (chatData.messages) {
          newMessages = chatData.messages;
        } else {
          const query = lastMessageIdRef.current 
            ? `chat_id=${chatId}&since_id=${lastMessageIdRef.current}`
            : `chat_id=${chatId}&limit=100`;
          
          const messagesResp = await fetch(`${API_BASE}/chat-messages?${query}`);
          if (messagesResp.ok) {
            const messagesData = await messagesResp.json();
            newMessages = messagesData.messages || messagesData;
          }
        }

        if (newMessages.length > 0 && isMountedRef.current) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const trulyNew = newMessages.filter(m => !existingIds.has(m.id));
            
            if (trulyNew.length === 0) return prev;
            
            const merged = [...prev, ...trulyNew].sort((a, b) => a.id - b.id);
            return merged;
          });
        }
      }
    } catch (err) {
      console.error("Error in background fetch:", err);
    } finally {
      if (isMountedRef.current) {
        setIsPolling(false);
        setLoading(false);
      }
    }
  }, [chatId]);

  useEffect(() => {
    if (!chatId) {
      navigate("/chat");
      return;
    }

    const initialLoad = async () => {
      setLoading(true);
      await fetchChatAndMessages(false);
      
      const state = location.state as { chat?: Chat };
      if (!chat && state?.chat && isMountedRef.current) {
        setChat(state.chat);
      }
    };

    initialLoad();

    const pollWithBackoff = (attempt = 0) => {
      if (!isMountedRef.current) return;

      const baseDelay = 3000;
      const maxDelay = 10000;
      const backoffFactor = Math.min(1.2, 1 + (attempt * 0.1));
      const delay = Math.min(baseDelay * backoffFactor, maxDelay);

      pollTimeoutRef.current = setTimeout(async () => {
        try {
          await fetchChatAndMessages(true);
          pollWithBackoff(0);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
          pollWithBackoff(attempt + 1);
        }
      }, delay);
    };

    const initialPollDelay = setTimeout(() => {
      pollWithBackoff(0);
    }, 3000);

    return () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      clearTimeout(initialPollDelay);
    };
  }, [chatId, navigate, location.state, fetchChatAndMessages, chat]);

  useEffect(() => {
    if (messagesEndRef.current && !isPolling) {
      const scrollContainer = messagesEndRef.current.parentElement?.parentElement;
      if (scrollContainer) {
        const isNearBottom = 
          scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
        
        if (isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [messages, isPolling]);

  const handleSend = async () => {
    if (!newMessage.trim() || !chatId) return;

    const otherUserEmail = chat?.user1 === currentUser.email ? chat?.user2 : chat?.user1;
    if (!otherUserEmail) return;

    const messageToSend = {
      sender: currentUser.email,
      receiver: otherUserEmail,
      content: newMessage.trim(),
      chat_id: parseInt(chatId),
      offer_id: chat?.offer_id || 0,
      useExistingChat: true
    };

    const optimisticMessage: Message = {
      id: Date.now(),
      senderEmail: currentUser.email,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
      receiverEmail: otherUserEmail,
      chat_id: parseInt(chatId)
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      const resp = await fetch(`${API_BASE}/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageToSend),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.message) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === optimisticMessage.id ? data.message : msg
            )
          );
        }
        setTimeout(() => fetchChatAndMessages(true), 500);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Just now";
    }
  };

  const getOtherUserName = () => {
    return chat?.other_user_name || chat?.user1 === currentUser.email ? chat?.user2 : chat?.user1 || "Book Exchange";
  };

  const getOfferTitle = () => {
    return chat?.offer_title || chat?.title || "Book conversation";
  };

  // Sidebar items - same as other screens
  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBook, label: "My Books", onClick: () => navigate("/profile") },
    { icon: FaBookmark, label: "Saved", onClick: () => {} },
    { icon: FaUsers, label: "Following", onClick: () => {} },
    { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress },
    { icon: FaComments, label: "Messages", active: true, onClick: () => navigate("/chat") },
    { icon: FaBell, label: "Notifications", onClick: () => {} },
    { icon: FaStar, label: "Top Picks", onClick: () => {} },
  ];

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      background: PINTEREST.bg,
      display: "flex",
      fontFamily: "'Inter', -apple-system, sans-serif",
      overflow: "hidden",
    }}>
      {/* Sidebar - Identical to Home & Chat screens */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 25 }}
        style={{
          width: "240px",
          background: PINTEREST.sidebarBg,
          borderRight: `1px solid ${PINTEREST.border}`,
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          padding: "20px 16px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: PINTEREST.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "700",
              fontSize: "14px",
            }}>
              B
            </div>
            <span style={{
              fontSize: "20px",
              fontWeight: "700",
              color: PINTEREST.primary,
            }}>
              Boocozmo
            </span>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={onProfilePress}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px",
            borderRadius: "12px",
            background: PINTEREST.hoverBg,
            marginBottom: "24px",
            cursor: "pointer",
          }}
        >
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${PINTEREST.primary}, ${PINTEREST.dark})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "600",
            fontSize: "16px",
          }}>
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: PINTEREST.textDark }}>
              {currentUser.name.split(' ')[0]}
            </div>
            <div style={{ fontSize: "12px", color: PINTEREST.textLight }}>
              View profile
            </div>
          </div>
        </motion.div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <motion.button
              key={item.label}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={item.onClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "12px",
                background: item.active ? PINTEREST.redLight : "transparent",
                border: "none",
                color: item.active ? PINTEREST.primary : PINTEREST.textDark,
                fontSize: "14px",
                fontWeight: item.active ? "600" : "500",
                cursor: "pointer",
                borderRadius: "12px",
                marginBottom: "4px",
                textAlign: "left",
              }}
            >
              <item.icon size={18} />
              {item.label}
            </motion.button>
          ))}
        </nav>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddPress}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px",
            background: PINTEREST.primary,
            color: "white",
            border: "none",
            borderRadius: "24px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            width: "100%",
            justifyContent: "center",
            marginTop: "20px",
          }}
        >
          <FaPlus /> Share a Book
        </motion.button>

        <motion.button
          whileHover={{ x: 4 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            padding: "12px",
            background: "transparent",
            border: "none",
            color: PINTEREST.textLight,
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            borderRadius: "12px",
            marginTop: "12px",
            textAlign: "left",
          }}
        >
          <FaCog size={18} />
          Settings
        </motion.button>
      </motion.aside>

      {/* Main Chat Area */}
      <div style={{ 
        flex: 1, 
        marginLeft: sidebarOpen ? "240px" : "0",
        transition: "margin-left 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <header style={{
          padding: "12px 20px",
          background: PINTEREST.bg,
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: `1px solid ${PINTEREST.border}`,
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: PINTEREST.hoverBg,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: PINTEREST.textDark,
              cursor: "pointer",
            }}
          >
            {sidebarOpen ? <FaTimes /> : <FaEllipsisH />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/chat")}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: PINTEREST.hoverBg,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: PINTEREST.textDark,
              cursor: "pointer",
            }}
          >
            <FaArrowLeft size={18} />
          </motion.button>

          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: "18px",
              fontWeight: "600",
              color: PINTEREST.textDark,
              margin: 0,
            }}>
              {getOtherUserName()}
            </h1>
            <p style={{
              fontSize: "13px",
              color: PINTEREST.textLight,
              margin: "4px 0 0",
            }}>
              {getOfferTitle()}
            </p>
          </div>

          {isPolling && (
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#4CAF50",
              animation: "pulse 1.5s infinite",
            }} />
          )}
        </header>

        {/* Messages Area */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          background: PINTEREST.bg,
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                border: `4px solid ${PINTEREST.grayLight}`,
                borderTopColor: PINTEREST.primary,
                borderRadius: "50%",
                margin: "0 auto 20px",
                animation: "spin 1s linear infinite",
              }} />
              <p style={{ color: PINTEREST.textLight }}>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{
                fontSize: "64px",
                marginBottom: "20px",
                opacity: 0.3,
              }}>💬</div>
              <p style={{ fontSize: "16px", color: PINTEREST.textLight, marginBottom: "8px" }}>
                No messages yet
              </p>
              <p style={{ fontSize: "14px", color: PINTEREST.textMuted }}>
                Start the conversation about "{getOfferTitle()}"
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isMe = msg.senderEmail === currentUser.email;
                const isOptimistic = msg.id > 10000000000;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isOptimistic ? 0.7 : 1, y: 0 }}
                    style={{
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "75%",
                    }}
                  >
                    <div style={{
                      background: isMe ? PINTEREST.primary : "white",
                      color: isMe ? "white" : PINTEREST.textDark,
                      padding: "12px 18px",
                      borderRadius: "20px",
                      borderBottomRightRadius: isMe ? "6px" : "20px",
                      borderBottomLeftRadius: isMe ? "20px" : "6px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      position: "relative",
                    }}>
                      {isOptimistic && (
                        <div style={{
                          position: "absolute",
                          top: "-6px",
                          right: "-6px",
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: "#FF9800",
                          animation: "pulse 1s infinite",
                        }} />
                      )}
                      <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.5 }}>
                        {msg.content}
                      </p>
                      <div style={{
                        marginTop: "6px",
                        fontSize: "11px",
                        opacity: 0.8,
                        textAlign: "right",
                      }}>
                        {isOptimistic ? "Sending..." : formatTime(msg.created_at)}
                        {isMe && msg.is_read && !isOptimistic && " ✓✓"}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </main>

        {/* Input Area */}
        <div style={{
          padding: "16px 20px",
          background: PINTEREST.bg,
          borderTop: `1px solid ${PINTEREST.border}`,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: PINTEREST.grayLight,
            borderRadius: "28px",
            padding: "8px 16px",
          }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Write a message..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "15px",
                color: PINTEREST.textDark,
                padding: "8px 0",
              }}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!newMessage.trim()}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: newMessage.trim() ? PINTEREST.primary : PINTEREST.hoverBg,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                cursor: newMessage.trim() ? "pointer" : "not-allowed",
              }}
            >
              <FaPaperPlane size={16} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: ${PINTEREST.border};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${PINTEREST.textLight};
        }
        @media (max-width: 768px) {
          aside { display: none; }
          div[style*="marginLeft"] { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}