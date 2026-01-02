// src/pages/ChatScreen.tsx - PINTEREST-STYLE REDESIGN (Matching HomeScreen Theme)
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
  FaBook,
  FaStar,
  FaCog,
  FaEllipsisH,
  FaTimes,
  FaUsers
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

// Exact Pinterest colors from HomeScreen
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
  currentUser: { email: string; name: string; id: string };
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
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Check backend status
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(API_BASE, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        setBackendOnline(response.ok);
      } catch {
        setBackendOnline(false);
      }
    };
    checkBackend();
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const resp = await fetch(`${API_BASE}/chats?user=${encodeURIComponent(currentUser.email)}`, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        });

        clearTimeout(timeoutId);

        if (!resp.ok) throw new Error(`Failed: ${resp.status}`);

        const data: Conversation[] = await resp.json();
        setConversations(data);
        setError(null);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Using demo data");
        setConversations(getMockConversations());
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    if (backendOnline !== false) {
      const interval = setInterval(fetchChats, 30000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.email, backendOnline]);

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

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    window.location.reload();
  };

  // Sidebar items (same as HomeScreen)
  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBook, label: "My Books", onClick: () => navigate("/profile") },
    { icon: FaBookmark, label: "Saved", onClick: () => {} },
    { icon: FaUsers, label: "Following", onClick: () => {} },
    { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress },
    { icon: FaComments, label: "Messages", active: true, onClick: () => {} },
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
      {/* Sidebar - Identical to HomeScreen */}
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

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        marginLeft: sidebarOpen ? "240px" : "0",
        transition: "margin-left 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Top Bar */}
        <header style={{
          padding: "12px 20px",
          background: PINTEREST.bg,
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: `1px solid ${PINTEREST.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
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

            <h1 style={{
              fontSize: "24px",
              fontWeight: "700",
              color: PINTEREST.textDark,
              margin: 0,
            }}>
              Messages
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
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
                position: "relative",
              }}
            >
              <FaBell />
              <div style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: PINTEREST.primary,
              }} />
            </motion.button>
          </div>
        </header>

        {/* Chat List */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          background: PINTEREST.bg,
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                border: `4px solid ${PINTEREST.grayLight}`,
                borderTopColor: PINTEREST.primary,
                borderRadius: "50%",
                margin: "0 auto 20px",
                animation: "spin 1s linear infinite",
              }} />
              <p style={{ color: PINTEREST.textLight, fontSize: "16px" }}>
                Loading messages...
              </p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>💬</div>
              <p style={{ color: PINTEREST.textLight, fontSize: "16px", marginBottom: "20px" }}>
                {error}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetry}
                style={{
                  padding: "12px 28px",
                  background: PINTEREST.primary,
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
                background: PINTEREST.redLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                color: PINTEREST.primary,
              }}>
                <FaComments size={40} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "600", color: PINTEREST.textDark, marginBottom: "8px" }}>
                No messages yet
              </h3>
              <p style={{ color: PINTEREST.textLight, fontSize: "15px", maxWidth: "300px", margin: "0 auto 32px" }}>
                Start chatting from any book offer
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/")}
                style={{
                  padding: "14px 32px",
                  background: PINTEREST.primary,
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
                    background: "white",
                    border: "none",
                    borderRadius: "16px",
                    padding: "16px",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    textAlign: "left",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    transition: "all 0.2s ease",
                  }}
                  whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
                >
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${PINTEREST.primary}, ${PINTEREST.dark})`,
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
                          color: PINTEREST.textDark,
                        }}>
                          {conv.other_user_name || "Unknown User"}
                        </h3>
                        <p style={{
                          fontSize: "14px",
                          color: PINTEREST.textLight,
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
                          color: PINTEREST.textMuted,
                        }}>
                          {formatTime(conv.last_message_at || conv.created_at)}
                        </span>
                        {isUnread(conv) && (
                          <div style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: PINTEREST.primary,
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

      {/* Global Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
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