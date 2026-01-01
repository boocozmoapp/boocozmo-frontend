// src/pages/ChatScreen.tsx - FIXED WITH BETTER ERROR HANDLING
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaBookOpen, FaMapMarkedAlt, FaPlus, FaComments, FaUser, FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

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
};

type ChatScreenProps = {
  currentUser: { email: string; name: string; id: string };
};

export default function ChatScreen({ currentUser }: ChatScreenProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const navigate = useNavigate();

  // Check if backend is online
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(API_BASE, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000) // 5 second timeout
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
        console.log("Fetching chats from:", `${API_BASE}/chats?user=${encodeURIComponent(currentUser.email)}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const resp = await fetch(`${API_BASE}/chats?user=${encodeURIComponent(currentUser.email)}`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!resp.ok) {
          console.error(`Backend returned error: ${resp.status} ${resp.statusText}`);
          throw new Error(`Failed to load chats: ${resp.status} ${resp.statusText}`);
        }
        
        const data: Conversation[] = await resp.json();
        console.log("Received chats data:", data);
        setConversations(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load chats:", err);
        setError(err instanceof Error ? err.message : "Network error. Using demo data.");
        // Show mock data for demo
        setConversations(getMockConversations());
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    // Refresh chats every 30 seconds if backend is online
    if (backendOnline !== false) {
      const interval = setInterval(fetchChats, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser.email, backendOnline]);

  const getMockConversations = (): Conversation[] => {
    return [
      {
        id: 1,
        other_user_name: "John Doe",
        offer_title: "The Great Gatsby",
        last_message_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        unread_user1: false,
        unread_user2: true,
        user1: currentUser.email,
        user2: "john@example.com",
        title: "Chat about The Great Gatsby",
        offer_id: 1
      },
      {
        id: 2,
        other_user_name: "Jane Smith",
        offer_title: "To Kill a Mockingbird",
        last_message_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        unread_user1: true,
        unread_user2: false,
        user1: "jane@example.com",
        user2: currentUser.email,
        title: "Exchange discussion",
        offer_id: 2
      },
      {
        id: 3,
        other_user_name: "Alex Johnson",
        offer_title: "Atomic Habits",
        last_message_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        unread_user1: false,
        unread_user2: false,
        user1: currentUser.email,
        user2: "alex@example.com",
        title: "Book purchase chat",
        offer_id: 3
      }
    ];
  };

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
    return new Date(dateStr).toLocaleDateString();
  };

  const isUnread = (conv: Conversation) => {
    return conv.user1 === currentUser.email ? conv.unread_user1 : conv.unread_user2;
  };

  const getOtherUserInitial = (conv: Conversation) => {
    const otherUserName = conv.other_user_name || "?";
    return otherUserName[0].toUpperCase();
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
    // Reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#f5f0e6", 
      display: "flex", 
      flexDirection: "column",
      fontFamily: "'Georgia', 'Times New Roman', serif"
    }}>
      {/* Header */}
      <header style={{ 
        background: "white", 
        padding: "16px", 
        borderBottom: "1px solid #e2e8f0", 
        display: "flex", 
        alignItems: "center", 
        gap: "12px",
        boxShadow: "0 2px 8px rgba(205, 127, 50, 0.1)",
        position: "relative"
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ 
            background: "none", 
            border: "none", 
            fontSize: "24px", 
            color: "#CD7F32",
            cursor: "pointer",
            padding: "4px",
            flexShrink: 0
          }}
        >
          <FaArrowLeft />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            fontSize: "24px", 
            fontWeight: "bold", 
            margin: 0, 
            color: "#1e293b",
            fontFamily: "'Playfair Display', serif"
          }}>
            Messages
          </h1>
          <p style={{ 
            fontSize: "14px", 
            color: "#64748b", 
            margin: "4px 0 0",
            fontFamily: "'Georgia', serif"
          }}>
            Connect with book lovers
          </p>
        </div>
        
        {/* Backend status indicator */}
        {backendOnline === false && (
          <div style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            background: "#FEE2E2",
            color: "#DC2626",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: "500"
          }}>
            <FaExclamationTriangle size={10} />
            Offline Mode
          </div>
        )}
      </header>

      {/* Error Banner */}
      {error && !loading && (
        <div style={{
          background: "#FEF3C7",
          borderBottom: "1px solid #F59E0B",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaExclamationTriangle color="#D97706" />
            <span style={{ color: "#92400E", fontSize: "14px" }}>
              {error.includes("demo") ? "Using demo data" : error}
            </span>
          </div>
          <button
            onClick={handleRetry}
            style={{
              background: "#CD7F32",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Chat List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ 
            textAlign: "center", 
            padding: "40px", 
            color: "#64748b",
            fontFamily: "'Georgia', serif"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              border: `3px solid #CD7F32`,
              borderTopColor: "transparent",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite",
            }} />
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px", 
            color: "#64748b",
            fontFamily: "'Georgia', serif"
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#F5E7D3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              color: "#CD7F32",
            }}>
              <FaComments size={36} />
            </div>
            <p style={{ fontSize: "18px", marginBottom: "12px", fontWeight: "600" }}>No messages yet</p>
            <p style={{ fontSize: "15px", marginBottom: "24px", color: "#94a3b8" }}>
              Start a conversation from an offer!
            </p>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "12px 24px",
                background: "#CD7F32",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                cursor: "pointer",
                fontFamily: "'Georgia', serif",
                fontWeight: "500",
                boxShadow: "0 2px 8px rgba(205, 127, 50, 0.3)"
              }}
            >
              Browse Offers
            </button>
          </div>
        ) : (
          <div>
            {/* Demo mode notice */}
            {error && error.includes("demo") && (
              <div style={{
                padding: "12px 16px",
                background: "#F5E7D3",
                borderBottom: "1px solid #E6B17E",
                color: "#B87333",
                fontSize: "13px",
                textAlign: "center",
                fontStyle: "italic"
              }}>
                Showing demo conversations. Chats may not be saved.
              </div>
            )}
            
            {conversations.map((conv) => (
              <motion.button
                key={conv.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChatClick(conv)}
                style={{
                  width: "100%",
                  background: "white",
                  border: "none",
                  padding: "16px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F5E7D3";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #CD7F32, #E6B17E)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "20px",
                    fontWeight: "bold",
                    boxShadow: "0 2px 6px rgba(205, 127, 50, 0.3)",
                    flexShrink: 0
                  }}
                >
                  {getOtherUserInitial(conv)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <h3 style={{ 
                      fontSize: "16px", 
                      fontWeight: "600", 
                      margin: 0, 
                      color: "#1e293b",
                      fontFamily: "'Georgia', serif",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {conv.other_user_name || "Unknown User"}
                    </h3>
                    <span style={{ 
                      fontSize: "12px", 
                      color: "#94a3b8",
                      fontFamily: "'Georgia', serif",
                      flexShrink: 0,
                      marginLeft: "8px"
                    }}>
                      {formatTime(conv.last_message_at || conv.created_at)}
                    </span>
                  </div>
                  <p style={{ 
                    fontSize: "14px", 
                    color: "#64748b", 
                    margin: "0 0 4px",
                    fontFamily: "'Georgia', serif",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {conv.offer_title || conv.title || "General chat"}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {isUnread(conv) && (
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: "#CD7F32",
                          boxShadow: "0 0 4px rgba(205, 127, 50, 0.5)",
                          flexShrink: 0
                        }}
                      />
                    )}
                    {conv.offer_id && (
                      <span style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        background: "#F1F5F9",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        flexShrink: 0
                      }}>
                        Offer #{conv.offer_id}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "white",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-around",
          padding: "12px 0",
          boxShadow: "0 -2px 8px rgba(205, 127, 50, 0.1)",
          zIndex: 100
        }}
      >
        {[
          { Icon: FaBookOpen, label: "Home", path: "/" },
          { Icon: FaMapMarkedAlt, label: "Map", path: "/map" },
          { Icon: FaPlus, label: "Post", path: "/offer" },
          { Icon: FaComments, label: "Chat", path: "/chat", active: true },
          { Icon: FaUser, label: "Profile", path: "/profile" },
        ].map(({ Icon, label, path, active }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              color: active ? "#CD7F32" : "#94a3b8",
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "'Georgia', serif",
              padding: "4px 8px",
              borderRadius: "6px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background = "#F5E7D3";
                e.currentTarget.style.color = "#B87333";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "#94a3b8";
              }
            }}
          >
            <Icon size={24} />
            {label}
          </button>
        ))}
      </nav>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #F5E7D3;
        }
        ::-webkit-scrollbar-thumb {
          background: #E6B17E;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #CD7F32;
        }
      `}</style>
    </div>
  );
}