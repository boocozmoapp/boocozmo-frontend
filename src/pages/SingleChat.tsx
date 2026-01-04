 
// src/pages/SingleChat.tsx - GREEN ENERGY THEME: Full Navigation + Complete UI
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  FaArrowLeft, 
  FaPaperPlane, 
  FaBars, 
  FaTimes,
  FaHome,
  FaMapMarkedAlt,
  FaBookOpen,
  FaCompass,
  FaBookmark,
  FaUsers,
  FaComments,
  FaBell,
  FaStar,
  FaCog,
  FaPlus,
} from "react-icons/fa";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

const GREEN = {
  dark: "#0F2415",
  medium: "#1A3A2A",
  accent: "#4A7C59",
  accentLight: "#6BA87A",
  textPrimary: "#E8F0E8",
  textSecondary: "#A8B8A8",
  textMuted: "#80A080",
  border: "rgba(74, 124, 89, 0.3)",
  grayLight: "#2A4A3A",
  hoverBg: "#255035",
  success: "#6BA87A",
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

  const [offerClosed, setOfferClosed] = useState(false);
  const [closingOffer, setClosingOffer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      const newMessages: Message[] = Array.isArray(data) ? data : data.messages || [];
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const fresh = newMessages.filter((m) => !ids.has(m.id));
        return [...prev, ...fresh].sort((a, b) => a.id - b.id);
      });
    } catch { /* silent */ }
  }, [chatId, currentUser.token]);

  useEffect(() => {
    if (!chatId) navigate("/chat");
    fetchMessages().finally(() => setLoading(false));
  }, [chatId, fetchMessages, navigate]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isOfferOwner = chat?.user1 === currentUser.email;

  const handleCloseDeal = async () => {
    if (!chat?.offer_id || closingOffer) return;
    if (!window.confirm("Close this exchange? This will end the conversation.")) return;

    setClosingOffer(true);

    try {
      const resp = await fetch(`${API_BASE}/close-deal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ offer_id: chat.offer_id }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        alert(data.error || "Failed to close deal");
        return;
      }

      setOfferClosed(true);
    } catch {
      alert("Network error");
    } finally {
      setClosingOffer(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending || offerClosed || !chatId) return;

    const other = chat?.user1 === currentUser.email ? chat?.user2 : chat?.user1;
    if (!other) return;

    const tempId = Date.now();
    const tempMessage: Message = {
      id: tempId,
      senderEmail: currentUser.email,
      content: newMessage,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");
    setSending(true);

    try {
      const resp = await fetch(`${API_BASE}/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          sender: currentUser.email,
          receiver: other,
          content: newMessage,
          chat_id: Number(chatId),
          offer_id: chat?.offer_id || null,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (t: string) =>
    new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress || (() => navigate("/map")) },
    { icon: FaBookOpen, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaCompass, label: "Discover", onClick: () => navigate("/discover") },
    { icon: FaBookmark, label: "Saved", onClick: () => navigate("/saved") },
    { icon: FaUsers, label: "Following", onClick: () => navigate("/following") },
    { icon: FaComments, label: "Messages", active: true, onClick: () => navigate("/chat") },
    { icon: FaBell, label: "Notifications", onClick: () => navigate("/notifications") },
    { icon: FaStar, label: "Top Picks", onClick: () => navigate("/top-picks") },
  ];

  return (
    <div style={{ height: "100vh", width: "100vw", background: GREEN.dark, display: "flex", overflow: "hidden" }}>
      {/* Full Sidebar Navigation */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 25 }}
        style={{
          width: "240px",
          background: GREEN.medium,
          borderRight: `1px solid ${GREEN.border}`,
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 1000,
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
              background: GREEN.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "700",
              fontSize: "14px",
            }}>
              B
            </div>
            <span style={{ fontSize: "20px", fontWeight: "800", color: GREEN.textPrimary }}>
              Boocozmo
            </span>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={onProfilePress || (() => navigate("/profile"))}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px",
            borderRadius: "12px",
            background: GREEN.hoverBg,
            marginBottom: "24px",
            cursor: "pointer",
          }}
        >
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: GREEN.accent,
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
            <div style={{ fontSize: "14px", fontWeight: "600", color: GREEN.textPrimary }}>
              {currentUser.name.split(" ")[0]}
            </div>
            <div style={{ fontSize: "12px", color: GREEN.textSecondary }}>View profile</div>
          </div>
        </motion.div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <motion.button
              key={item.label}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                item.onClick();
                setSidebarOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "12px",
                background: item.active ? GREEN.hoverBg : "transparent",
                border: "none",
                color: item.active ? GREEN.accentLight : GREEN.textPrimary,
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

        {onAddPress && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onAddPress();
              setSidebarOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px",
              background: GREEN.accent,
              color: "white",
              border: "none",
              borderRadius: "24px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              width: "100%",
              justifyContent: "center",
              marginTop: "20px",
              boxShadow: "0 4px 20px rgba(74, 124, 89, 0.4)",
            }}
          >
            <FaPlus /> Share a Book
          </motion.button>
        )}

        <motion.button
          whileHover={{ x: 4 }}
          onClick={() => navigate("/settings")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            padding: "12px",
            background: "transparent",
            border: "none",
            color: GREEN.textSecondary,
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
          background: GREEN.medium,
          borderBottom: `1px solid ${GREEN.border}`,
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexShrink: 0,
          zIndex: 100,
        }}>
          <div
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "8px",
              background: GREEN.grayLight,
              border: `1px solid ${GREEN.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {sidebarOpen ? <FaTimes size={20} color={GREEN.textPrimary} /> : <FaBars size={20} color={GREEN.textPrimary} />}
          </div>

          <button
            onClick={() => navigate("/chat")}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "8px",
              background: GREEN.grayLight,
              border: `1px solid ${GREEN.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <FaArrowLeft size={20} color={GREEN.textPrimary} />
          </button>

          <div>
            <strong style={{ fontSize: "18px", color: GREEN.textPrimary }}>
              {chat?.other_user_name || "User"}
            </strong>
            <div style={{ fontSize: "13px", color: GREEN.textSecondary }}>
              {chat?.offer_title || "Book exchange"}
            </div>
          </div>
        </header>

        {/* Offer Status Bar */}
        {chat?.offer_id && (
          <div style={{
            padding: "16px 20px",
            background: GREEN.grayLight,
            borderBottom: `1px solid ${GREEN.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <strong style={{ color: GREEN.textPrimary }}>{chat.offer_title}</strong>
              <div style={{ fontSize: "13px", color: offerClosed ? GREEN.success : GREEN.textSecondary }}>
                {offerClosed ? "Exchange completed ✓" : "Exchange active"}
              </div>
            </div>

            {isOfferOwner && !offerClosed && (
              <button
                onClick={handleCloseDeal}
                disabled={closingOffer}
                style={{
                  background: GREEN.accent,
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "24px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: closingOffer ? "not-allowed" : "pointer",
                  opacity: closingOffer ? 0.7 : 1,
                }}
              >
                {closingOffer ? "Closing..." : "Close Deal"}
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {messages.length === 0 && loading ? (
            <div style={{ textAlign: "center", color: GREEN.textSecondary, padding: "40px" }}>
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", color: GREEN.textSecondary, padding: "40px" }}>
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  alignSelf: m.senderEmail === currentUser.email ? "flex-end" : "flex-start",
                  maxWidth: "70%",
                }}
              >
                <div style={{
                  background: m.senderEmail === currentUser.email ? GREEN.accent : GREEN.grayLight,
                  color: m.senderEmail === currentUser.email ? "white" : GREEN.textPrimary,
                  padding: "12px 16px",
                  borderRadius: "18px",
                  borderBottomRightRadius: m.senderEmail === currentUser.email ? "4px" : "18px",
                  borderBottomLeftRadius: m.senderEmail === currentUser.email ? "18px" : "4px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}>
                  <div style={{ marginBottom: "4px" }}>{m.content}</div>
                  <div style={{
                    fontSize: "10px",
                    opacity: 0.8,
                    textAlign: m.senderEmail === currentUser.email ? "right" : "left",
                  }}>
                    {formatTime(m.created_at)}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input */}
        <div style={{
          padding: "16px 20px",
          background: GREEN.medium,
          borderTop: `1px solid ${GREEN.border}`,
        }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <input
              disabled={offerClosed || sending}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={offerClosed ? "Exchange completed" : "Type a message..."}
              style={{
                flex: 1,
                padding: "14px 16px",
                borderRadius: "24px",
                border: `1px solid ${GREEN.border}`,
                background: GREEN.grayLight,
                color: GREEN.textPrimary,
                fontSize: "15px",
                outline: "none",
              }}
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={offerClosed || sending || !newMessage.trim()}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: (offerClosed || sending || !newMessage.trim()) ? GREEN.grayLight : GREEN.accent,
                color: "white",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: (offerClosed || sending || !newMessage.trim()) ? "not-allowed" : "pointer",
              }}
            >
              <FaPaperPlane size={18} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}