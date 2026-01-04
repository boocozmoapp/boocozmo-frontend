/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ChatScreen.tsx - GREEN ENERGY THEME: Calm, Sustainable, Professional
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  FaHome, 
  FaMapMarkedAlt, 
  FaPlus, 
  FaComments, 
  FaBell,
  FaBookmark,
  FaCompass,
  FaBookOpen as FaBookOpenIcon,
  FaStar,
  FaCog,
  FaBars,
  FaTimes,
  FaUsers
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api";

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
  icon: "#80A080",
  success: "#6BA87A",
};

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
};

type ChatScreenProps = {
  currentUser: { email: string; name: string; id: string; token: string };
  onProfilePress?: () => void;
  onMapPress?: () => void;
  onAddPress?: () => void;
};

export default function ChatScreen({ 
  currentUser, 
  onProfilePress,
  onMapPress,
  onAddPress 
}: ChatScreenProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      setError(null);

      try {
        const resp = await fetch(`${API_BASE}/chats?user=${encodeURIComponent(currentUser.email)}`, {
          headers: {
            "Authorization": `Bearer ${currentUser.token}`,
            "Content-Type": "application/json",
          },
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to load messages");
        }

        const data: Conversation[] = await resp.json();
        setConversations(data);
      } catch (err: any) {
        console.error("Chat fetch error:", err);
        setError("Failed to load messages. Using demo data.");
        setConversations(getMockConversations());
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    const interval = setInterval(fetchChats, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.email, currentUser.token]);

  const getMockConversations = (): Conversation[] => [
    {
      id: 1,
      other_user_name: "John Doe",
      offer_title: "The Great Gatsby",
      last_message_at: new Date(Date.now() - 300000).toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString(),
      unread_user1: false,
      unread_user2: true,
      user1: currentUser.email,
      user2: "john@example.com",
      offer_id: 1
    },
    {
      id: 2,
      other_user_name: "Jane Smith",
      offer_title: "To Kill a Mockingbird",
      last_message_at: new Date(Date.now() - 3600000).toISOString(),
      created_at: new Date(Date.now() - 172800000).toISOString(),
      unread_user1: true,
      unread_user2: false,
      user1: "jane@example.com",
      user2: currentUser.email,
      offer_id: 2
    },
    {
      id: 3,
      other_user_name: "Alex Johnson",
      offer_title: "Atomic Habits",
      last_message_at: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 259200000).toISOString(),
      unread_user1: false,
      unread_user2: false,
      user1: currentUser.email,
      user2: "alex@example.com",
      offer_id: 3
    }
  ];

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const isUnread = (conv: Conversation) => {
    return conv.user1 === currentUser.email ? conv.unread_user1 : conv.unread_user2;
  };

  const getOtherUserInitial = (name: string | null) => {
    return (name || "?")[0].toUpperCase();
  };

  const handleChatClick = (conv: Conversation) => {
    navigate(`/chat/${conv.id}`, {
      state: { 
        chat: {
          id: conv.id,
          user1: conv.user1,
          user2: conv.user2,
          other_user_name: conv.other_user_name,
          offer_title: conv.offer_title,
          offer_id: conv.offer_id
        }
      }
    });
  };

  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress || (() => navigate("/map")) },
    { icon: FaBookOpenIcon, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBookmark, label: "Saved", onClick: () => navigate("/saved") },
    { icon: FaUsers, label: "Following", onClick: () => {} },
    { icon: FaComments, label: "Messages", active: true, onClick: () => navigate("/chat") },
    { icon: FaBell, label: "Notifications", onClick: () => {} },
    { icon: FaStar, label: "Top Picks", onClick: () => {} },
  ];

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      background: GREEN.dark,
      display: "flex",
      fontFamily: "'Inter', -apple-system, sans-serif",
      overflow: "hidden",
    }}>
      {/* Sidebar */}
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
            <span style={{
              fontSize: "20px",
              fontWeight: "800",
              color: GREEN.textPrimary,
            }}>
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
              {currentUser.name.split(' ')[0]}
            </div>
            <div style={{ fontSize: "12px", color: GREEN.textSecondary }}>
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
            onClick={onAddPress}
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

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        marginLeft: sidebarOpen ? "240px" : "0",
        transition: "margin-left 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}>
        <header style={{
          padding: "12px 20px",
          background: GREEN.medium,
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: `1px solid ${GREEN.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: GREEN.grayLight,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: GREEN.textPrimary,
                cursor: "pointer",
              }}
            >
              {sidebarOpen ? <FaTimes size={28} /> : <FaBars size={16} />}
            </motion.button>

            <h1 style={{
              fontSize: "24px",
              fontWeight: "700",
              color: GREEN.textPrimary,
              margin: 0,
            }}>
              Messages
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/notifications")}
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: GREEN.grayLight,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: GREEN.textPrimary,
                cursor: "pointer",
                position: "relative",
              }}
            >
              <FaBell size={28} />
              <div style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: GREEN.accent,
              }} />
            </motion.button>
          </div>
        </header>

        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          background: GREEN.dark,
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                border: `4px solid ${GREEN.grayLight}`,
                borderTopColor: GREEN.accent,
                borderRadius: "50%",
                margin: "0 auto 20px",
                animation: "spin 1s linear infinite",
              }} />
              <p style={{ color: GREEN.textSecondary, fontSize: "16px" }}>
                Loading messages...
              </p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>Messages</div>
              <p style={{ color: GREEN.textSecondary, fontSize: "16px", marginBottom: "20px" }}>
                {error}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                style={{
                  padding: "12px 28px",
                  background: GREEN.accent,
                  color: "white",
                  border: "none",
                  borderRadius: "24px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Retry
              </motion.button>
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: GREEN.grayLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                color: GREEN.accentLight,
              }}>
                <FaComments size={40} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "600", color: GREEN.textPrimary, marginBottom: "8px" }}>
                No messages yet
              </h3>
              <p style={{ color: GREEN.textSecondary, fontSize: "15px", maxWidth: "300px", margin: "0 auto 32px" }}>
                Start chatting from any book offer
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/")}
                style={{
                  padding: "14px 32px",
                  background: GREEN.accent,
                  color: "white",
                  border: "none",
                  borderRadius: "24px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Browse Books
              </motion.button>
            </div>
          ) : (
            <div>
              {conversations.map((conv) => (
                <motion.button
                  key={conv.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChatClick(conv)}
                  style={{
                    width: "100%",
                    background: GREEN.medium,
                    border: "none",
                    borderRadius: "16px",
                    padding: "16px",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    textAlign: "left",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    transition: "all 0.2s ease",
                  }}
                  whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0,0,0,0.4)" }}
                >
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: GREEN.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "20px",
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}>
                    {getOtherUserInitial(conv.other_user_name)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          margin: "0 0 4px",
                          color: GREEN.textPrimary,
                        }}>
                          {conv.other_user_name || "Unknown User"}
                        </h3>
                        <p style={{
                          fontSize: "14px",
                          color: GREEN.textSecondary,
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {conv.offer_title || conv.title || "General chat"}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{
                          fontSize: "12px",
                          color: GREEN.textMuted,
                        }}>
                          {formatTime(conv.last_message_at || conv.created_at)}
                        </span>
                        {isUnread(conv) && (
                          <div style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: GREEN.accentLight,
                            margin: "8px auto 0",
                          }} />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${GREEN.border}; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: ${GREEN.textMuted}; }
      `}</style>
    </div>
  );
}