// src/pages/SingleChat.tsx - FIXED WITH INVISIBLE POLLING
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

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
};

export default function SingleChat({ currentUser }: SingleChatProps) {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Get the latest message ID for efficient polling
  useEffect(() => {
    if (messages.length > 0) {
      const latestId = Math.max(...messages.map(m => m.id));
      lastMessageIdRef.current = latestId;
    }
  }, [messages]);

  // Cleanup on unmount
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

    if (!silent) {
      setIsPolling(true);
    }

    try {
      // 1. Fetch chat details
      const chatResp = await fetch(`${API_BASE}/chats/${chatId}`);
      
      if (chatResp.ok) {
        const chatData = await chatResp.json();
        
        // Update chat data silently
        if (chatData.chat && isMountedRef.current) {
          setChat(prevChat => ({
            ...prevChat,
            ...chatData.chat,
          }));
        }

        // Get messages - either from response or separate endpoint
        let newMessages: Message[] = [];
        
        if (chatData.messages) {
          newMessages = chatData.messages;
        } else {
          // Fetch messages with last message ID for efficient polling
          const query = lastMessageIdRef.current 
            ? `chat_id=${chatId}&since_id=${lastMessageIdRef.current}`
            : `chat_id=${chatId}&limit=100`;
          
          const messagesResp = await fetch(`${API_BASE}/chat-messages?${query}`);
          if (messagesResp.ok) {
            const messagesData = await messagesResp.json();
            newMessages = messagesData.messages || messagesData;
          }
        }

        // Only update if we got new messages
        if (newMessages.length > 0 && isMountedRef.current) {
          setMessages(prev => {
            // Filter out duplicates and merge
            const existingIds = new Set(prev.map(m => m.id));
            const trulyNew = newMessages.filter(m => !existingIds.has(m.id));
            
            if (trulyNew.length === 0) return prev;
            
            // Merge and sort by ID
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

  // Initial load
  useEffect(() => {
    if (!chatId) {
      navigate("/chat");
      return;
    }

    const initialLoad = async () => {
      setLoading(true);
      await fetchChatAndMessages(false);
      
      // Check location state for chat data if API fails
      const state = location.state as { chat?: Chat };
      if (!chat && state?.chat && isMountedRef.current) {
        setChat(state.chat);
      }
    };

    initialLoad();

    // Setup smart polling with backoff
    const pollWithBackoff = (attempt = 0) => {
      if (!isMountedRef.current) return;

      // Calculate delay: start with 3s, max at 10s
      const baseDelay = 3000;
      const maxDelay = 10000;
      const backoffFactor = Math.min(1.2, 1 + (attempt * 0.1));
      const delay = Math.min(baseDelay * backoffFactor, maxDelay);

      pollTimeoutRef.current = setTimeout(async () => {
        try {
          await fetchChatAndMessages(true);
          
          // Reset backoff on successful fetch
          pollWithBackoff(0);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
          // Increase backoff on error
          pollWithBackoff(attempt + 1);
        }
      }, delay);
    };

    // Start polling after initial load
    const initialPollDelay = setTimeout(() => {
      pollWithBackoff(0);
    }, 3000);

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      clearTimeout(initialPollDelay);
    };
  }, [chatId, navigate, location.state, fetchChatAndMessages, chat]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !isPolling) {
      const scrollContainer = messagesEndRef.current.parentElement?.parentElement;
      if (scrollContainer) {
        const isNearBottom = 
          scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
        
        if (isNearBottom) {
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          });
        }
      }
    }
  }, [messages, isPolling]);

  const handleSend = async () => {
    if (!newMessage.trim() || !chatId) return;

    // Get the other user's email
    const otherUserEmail = chat?.user1 === currentUser.email ? chat?.user2 : chat?.user1;
    
    if (!otherUserEmail) {
      console.error("Cannot determine other user");
      return;
    }

    const messageToSend = {
      sender: currentUser.email,
      receiver: otherUserEmail,
      content: newMessage.trim(),
      chat_id: parseInt(chatId),
      offer_id: chat?.offer_id || 0,
      useExistingChat: true
    };

    // Optimistic update
    const optimisticMessage: Message = {
      id: Date.now(), // Temporary ID
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
        console.log("Message sent successfully");
        
        // Replace optimistic message with real one
        if (data.message) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === optimisticMessage.id ? data.message : msg
            )
          );
        }
        
        // Trigger immediate poll for quick sync
        setTimeout(() => fetchChatAndMessages(true), 500);
      } else {
        // Keep optimistic message but mark as failed?
        console.error("Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Keep optimistic message for now
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
    if (chat?.other_user_name) return chat.other_user_name;
    if (chat) {
      return chat.user1 === currentUser.email ? chat.user2 : chat.user1;
    }
    return "Book Exchange";
  };

  const getOfferTitle = () => {
    return chat?.offer_title || chat?.title || "Book conversation";
  };

  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      background: "#f5f0e6",
      fontFamily: "'Georgia', 'Times New Roman', serif" 
    }}>
      {/* Chat Header with subtle polling indicator */}
      <header style={{
        background: "white",
        padding: "16px",
        borderBottom: "1px solid #e0e0e0",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(205, 127, 50, 0.1)",
        position: "relative",
      }}>
        {isPolling && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #CD7F32, transparent)",
            animation: "shimmer 2s infinite",
          }} />
        )}
        
        <button
          onClick={() => navigate("/chat")}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            color: "#CD7F32",
            cursor: "pointer",
            padding: "4px",
            zIndex: 1,
          }}
        >
          <FaArrowLeft />
        </button>

        <div style={{ flex: 1, zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 style={{ 
              fontSize: "18px", 
              fontWeight: "bold", 
              margin: 0, 
              color: "#1a1a1a",
              fontFamily: "'Playfair Display', serif" 
            }}>
              {getOtherUserName()}
            </h1>
            {isPolling && (
              <div style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#4CAF50",
                animation: "pulse 1.5s infinite",
              }} />
            )}
          </div>
          <p style={{ 
            fontSize: "14px", 
            color: "#666", 
            margin: "2px 0 0",
            fontFamily: "'Georgia', serif" 
          }}>
            {getOfferTitle()}
          </p>
        </div>
      </header>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px",
        background: "#f5f0e6",
        position: "relative",
      }}>
        {loading ? (
          <div style={{ 
            textAlign: "center", 
            color: "#666", 
            padding: "40px",
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
            Loading chat...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            color: "#666", 
            padding: "40px",
            fontFamily: "'Georgia', serif" 
          }}>
            <p style={{ marginBottom: "16px", fontSize: "16px" }}>No messages yet. Start the conversation!</p>
            <p style={{ fontSize: "14px", color: "#888" }}>
              Discuss: {getOfferTitle()}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.map((msg) => {
              const isMe = msg.senderEmail === currentUser.email;
              const isOptimistic = msg.id > 10000000000; // Temporary optimistic IDs
              
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isOptimistic ? 0.7 : 1, y: 0 }}
                  style={{
                    alignSelf: isMe ? "flex-end" : "flex-start",
                    maxWidth: "70%",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{
                    background: isMe ? 
                      (isOptimistic ? "rgba(205, 127, 50, 0.7)" : "#CD7F32") : 
                      "white",
                    color: isMe ? "#fff" : "#1a1a1a",
                    padding: "12px 16px",
                    borderRadius: "18px",
                    borderBottomRightRadius: isMe ? "4px" : "18px",
                    borderBottomLeftRadius: isMe ? "18px" : "4px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    wordBreak: "break-word",
                    border: `1px solid ${isMe ? "#B87333" : "#E6B17E"}`,
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
                    <p style={{ 
                      margin: 0, 
                      fontSize: "15px", 
                      lineHeight: 1.4,
                      fontFamily: "'Georgia', serif" 
                    }}>
                      {msg.content}
                    </p>
                    <div style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: "4px",
                    }}>
                      <span style={{
                        fontSize: "11px",
                        opacity: 0.8,
                        color: isMe ? "rgba(255,255,255,0.9)" : "#666",
                      }}>
                        {isOptimistic ? "Sending..." : formatTime(msg.created_at)}
                        {isMe && msg.is_read && !isOptimistic && (
                          <span style={{ marginLeft: "4px" }}>✓✓</span>
                        )}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div style={{
        background: "white",
        padding: "16px",
        borderTop: "1px solid #e0e0e0",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexShrink: 0,
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "1px solid #E6B17E",
            borderRadius: "24px",
            fontSize: "15px",
            outline: "none",
            background: "#F5E7D3",
            color: "#333",
            fontFamily: "'Georgia', serif",
          }}
        />

        <button
          onClick={handleSend}
          disabled={!newMessage.trim()}
          style={{
            background: newMessage.trim() ? "#CD7F32" : "#E6B17E",
            border: "none",
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: newMessage.trim() ? "pointer" : "not-allowed",
            color: "#fff",
            fontSize: "18px",
            transition: "background 0.2s ease",
          }}
        >
          <FaPaperPlane />
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
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
        
        /* Optimize for smooth scrolling */
        .message-container {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000;
        }
      `}</style>
    </div>
  );
}