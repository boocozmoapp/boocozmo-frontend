// src/pages/SingleChat.tsx - FINAL VERSION WITH FIXED CLOSE DEAL
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

const PINTEREST = {
  primary: "#E60023",
  dark: "#A3081A",
  light: "#FF4D6D",
  bg: "#FFFFFF",
  sidebarBg: "#FFFFFF",
  textDark: "#000000",
  textLight: "#5F5F5F",
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

export default function SingleChat({ currentUser }: SingleChatProps) {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen] = useState(false);

  // NEW: Offer state
  const [offerClosed, setOfferClosed] = useState(false);
  const [closingOffer, setClosingOffer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      const newMessages: Message[] = Array.isArray(data)
        ? data
        : data.messages || [];
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const fresh = newMessages.filter((m) => !ids.has(m.id));
        return [...prev, ...fresh].sort((a, b) => a.id - b.id);
      });
    } catch { /* empty */ }
  }, [chatId, currentUser.token]);

  useEffect(() => {
    if (!chatId) navigate("/chat");
    fetchMessages().finally(() => setLoading(false));
  }, [chatId, fetchMessages, navigate]);

  useEffect(() => {
    const i = setInterval(fetchMessages, 5000);
    return () => clearInterval(i);
  }, [fetchMessages]);

  const isOfferOwner = chat?.user1 === currentUser.email;

  // FIXED: Correct Close Deal implementation
  const handleCloseDeal = async () => {
    if (!chat?.offer_id || closingOffer) return;
    if (!window.confirm("Close this exchange?")) return;

    setClosingOffer(true);

    try {
      const resp = await fetch(`${API_BASE}/close-deal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          offer_id: chat.offer_id,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        console.error("Close deal failed:", data);
        alert(data.error || "Failed to close deal");
        return;
      }

      // SUCCESS
      setOfferClosed(true);
    } catch (err) {
      console.error("Network error:", err);
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
    setMessages((p) => [
      ...p,
      {
        id: tempId,
        senderEmail: currentUser.email,
        content: newMessage,
        created_at: new Date().toISOString(),
        is_read: false,
      },
    ]);
    setNewMessage("");
    setSending(true);

    try {
      const r = await fetch(`${API_BASE}/send-message`, {
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
      if (r.ok) {
        const d = await r.json();
        setMessages((p) =>
          p.map((m) => (m.id === tempId ? d.message : m))
        );
      }
    } catch {
      setMessages((p) => p.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (t: string) =>
    new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div style={{ height: "100vh", display: "flex", background: PINTEREST.bg }}>
      {/* SIDEBAR */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        style={{
          width: 240,
          background: PINTEREST.sidebarBg,
          borderRight: `1px solid ${PINTEREST.border}`,
          position: "fixed",
          height: "100%",
          padding: 20,
        }}
      >
        <strong style={{ color: PINTEREST.primary }}>Boocozmo</strong>
      </motion.aside>

      {/* MAIN */}
      <div
        style={{
          flex: 1,
          marginLeft: sidebarOpen ? 240 : 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <header
          style={{
            padding: 16,
            borderBottom: `1px solid ${PINTEREST.border}`,
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <button onClick={() => navigate("/chat")}>
            <FaArrowLeft />
          </button>
          <div>
            <strong>{chat?.other_user_name || "User"}</strong>
            <div style={{ fontSize: 12, color: PINTEREST.textLight }}>
              {chat?.offer_title || "Book exchange"}
            </div>
          </div>
        </header>

        {/* OFFER CARD */}
        {chat?.offer_id && (
          <div
            style={{
              padding: 16,
              background: PINTEREST.grayLight,
              borderBottom: `1px solid ${PINTEREST.border}`,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              <strong>{chat.offer_title}</strong>
              <div style={{ fontSize: 12 }}>
                {offerClosed ? "Exchange completed" : "Exchange active"}
              </div>
            </div>

            {isOfferOwner && !offerClosed && (
              <button
                onClick={handleCloseDeal}
                style={{
                  background: PINTEREST.primary,
                  color: "white",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: 16,
                }}
              >
                {closingOffer ? "Closing..." : "Close Deal"}
              </button>
            )}
          </div>
        )}

        {/* MESSAGES */}
        <main
          ref={scrollContainerRef}
          style={{ flex: 1, overflowY: "auto", padding: 20 }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                marginBottom: 10,
                alignSelf:
                  m.senderEmail === currentUser.email ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  background:
                    m.senderEmail === currentUser.email ? PINTEREST.primary : "white",
                  color:
                    m.senderEmail === currentUser.email ? "white" : PINTEREST.textDark,
                  padding: 12,
                  borderRadius: 16,
                }}
              >
                {m.content}
                <div style={{ fontSize: 10, opacity: 0.7 }}>
                  {formatTime(m.created_at)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        {/* INPUT */}
        <div style={{ padding: 16, borderTop: `1px solid ${PINTEREST.border}` }}>
          <input
            disabled={offerClosed}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={offerClosed ? "Exchange completed" : "Type a message..."}
            style={{ width: "80%" }}
          />
          <button onClick={handleSend} disabled={offerClosed}>
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
}
