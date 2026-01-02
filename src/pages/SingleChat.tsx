// src/pages/SingleChat.tsx - FINAL CLEAN VERSION (No Errors)
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
  FaBookOpen,
  FaStar,
  FaCog,
  FaUsers
} from "react-icons/fa";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

const PINTEREST = {
  primary: "#E60023",
  dark: "#A3081A",
  light: "#FF4D6D",
  bg: "#FFFFFF",
  sidebarBg: "#FFFFFF",        // ← Added this missing property
  textDark: "#000000",
  textLight: "#5F5F5F",
  textMuted: "#8E8E8E",
  border: "#E1E1E1",
  hoverBg: "#F5F5F5",
  redLight: "#FFE2E6",
  grayLight: "#F7F7F7",
};

type Message = {
  id: number;
  senderEmail: string;
  content: string;
  created_at: string;
  is_read: boolean;
};

type Chat = {
  id: number;
  user1: string;
  user2: string;
  offer_id?: number;
  title?: string | null;
  other_user_name?: string | null;
  offer_title?: string | null;
};

type SingleChatProps = {
  currentUser: { email: string; name: string; id: string; token: string };
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
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserNearBottom = useRef(true);

  useEffect(() => {
    const state = location.state as { chat?: Chat };
    if (state?.chat) {
      setChat(state.chat);
    }
  }, [location.state]);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;

    try {
      const resp = await fetch(`${API_BASE}/chat-messages?chat_id=${chatId}`, {
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
        },
      });

      if (!resp.ok) throw new Error("Failed to load messages");

      const data = await resp.json();
      const newMessages: Message[] = Array.isArray(data) ? data : data.messages || [];

      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const filteredNew = newMessages.filter(m => !existingIds.has(m.id));
        if (filteredNew.length === 0) return prev;

        return [...prev, ...filteredNew].sort((a, b) => a.id - b.id);
      });
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  }, [chatId, currentUser.token]);

  useEffect(() => {
    if (!chatId) {
      navigate("/chat");
      return;
    }

    const load = async () => {
      setLoading(true);
      await fetchMessages();
      setLoading(false);
    };

    load();
  }, [chatId, fetchMessages, navigate]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isUserNearBottom.current = scrollHeight - scrollTop - clientHeight < 150;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isUserNearBottom.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !chatId || sending) return;

    const otherUserEmail = chat?.user1 === currentUser.email ? chat?.user2 : chat?.user1;
    if (!otherUserEmail) return;

    const optimisticId = Date.now();
    const optimisticMessage: Message = {
      id: optimisticId,
      senderEmail: currentUser.email,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    setSending(true);

    try {
      const resp = await fetch(`${API_BASE}/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          sender: currentUser.email,
          receiver: otherUserEmail,
          content: newMessage.trim(),
          chat_id: parseInt(chatId),
          offer_id: chat?.offer_id || null,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.message) {
          setMessages(prev =>
            prev.map(m => m.id === optimisticId ? data.message : m)
          );
        }
      }
    } catch (err) {
      console.error("Send failed:", err);
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "Now";
    }
  };

  const getOtherUserName = () => chat?.other_user_name || "User";
  const getOfferTitle = () => chat?.offer_title || chat?.title || "Book chat";

  // ← navItems is now USED in the sidebar
  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBookOpen, label: "My Books", onClick: () => navigate("/profile") },
    { icon: FaBookmark, label: "Saved", onClick: () => {} },
    { icon: FaUsers, label: "Following", onClick: () => {} },
    { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress },
    { icon: FaComments, label: "Messages", active: true, onClick: () => navigate("/chat") },
    { icon: FaBell, label: "Notifications", onClick: () => {} },
    { icon: FaStar, label: "Top Picks", onClick: () => {} },
  ];

  return (
    <div style={{ height: "100vh", width: "100vw", background: PINTEREST.bg, display: "flex", overflow: "hidden" }}>
      {/* Sidebar */}
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
            <span style={{ fontSize: "20px", fontWeight: "700", color: PINTEREST.primary }}>
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
              {currentUser.name.split(" ")[0]}
            </div>
            <div style={{ fontSize: "12px", color: PINTEREST.textLight }}>View profile</div>
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
          borderBottom: `1px solid ${PINTEREST.border}`,
          display: "flex",
          alignItems: "center",
          gap: "16px",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            width: "40px", height: "40px", borderRadius: "50%", background: PINTEREST.hoverBg, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {sidebarOpen ? <FaTimes /> : <FaEllipsisH />}
          </motion.button>

          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/chat")} style={{
            width: "40px", height: "40px", borderRadius: "50%", background: PINTEREST.hoverBg, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <FaArrowLeft size={18} />
          </motion.button>

          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>{getOtherUserName()}</h1>
            <p style={{ fontSize: "13px", color: PINTEREST.textLight, margin: "4px 0 0" }}>{getOfferTitle()}</p>
          </div>
        </header>

        {/* Messages */}
        <main ref={scrollContainerRef} style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{
                width: "48px", height: "48px", border: `4px solid ${PINTEREST.grayLight}`, borderTopColor: PINTEREST.primary, borderRadius: "50%", margin: "0 auto 20px", animation: "spin 1s linear infinite"
              }} />
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontSize: "64px", opacity: 0.3, marginBottom: "20px" }}>💬</div>
              <p>No messages yet</p>
              <p style={{ color: PINTEREST.textLight }}>Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderEmail === currentUser.email;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}
                >
                  <div style={{
                    background: isMe ? PINTEREST.primary : "white",
                    color: isMe ? "white" : PINTEREST.textDark,
                    padding: "12px 18px",
                    borderRadius: "20px",
                    borderBottomRightRadius: isMe ? "6px" : "20px",
                    borderBottomLeftRadius: isMe ? "20px" : "6px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}>
                    <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.5 }}>{msg.content}</p>
                    <div style={{ marginTop: "6px", fontSize: "11px", opacity: 0.8, textAlign: "right" }}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input */}
        <div style={{ padding: "16px 20px", background: PINTEREST.bg, borderTop: `1px solid ${PINTEREST.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", background: PINTEREST.grayLight, borderRadius: "28px", padding: "8px 16px" }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              disabled={sending}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "15px",
              }}
            />
            <motion.button
              whileTap={{ scale: newMessage.trim() ? 0.9 : 1 }}
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: newMessage.trim() ? PINTEREST.primary : PINTEREST.hoverBg,
                color: "white",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: newMessage.trim() ? "pointer" : "not-allowed",
              }}
            >
              <FaPaperPlane size={16} />
            </motion.button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}