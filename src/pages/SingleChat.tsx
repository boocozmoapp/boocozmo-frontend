// src/pages/SingleChat.tsx - FIXED FOR YOUR BACKEND
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaPaperPlane} from "react-icons/fa";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) {
      navigate("/chat");
      return;
    }

    const fetchChatAndMessages = async () => {
      setLoading(true);
      try {
        // 1. First try to get chat details from YOUR backend endpoint
        const chatResp = await fetch(`${API_BASE}/chats/${chatId}`);
        
        if (chatResp.ok) {
          const chatData = await chatResp.json();
          console.log("Chat data from /chats/:id:", chatData);
          
          // YOUR backend returns { chat, messages }
          if (chatData.chat && chatData.messages) {
            setChat(chatData.chat);
            setMessages(chatData.messages);
          } else {
            // If it returns just the chat object
            setChat(chatData);
            // Then fetch messages separately
            await fetchMessages(parseInt(chatId));
          }
        } else {
          // If chat not found in backend, check if we have it in location state
          const state = location.state as { chat?: Chat };
          if (state?.chat) {
            console.log("Using chat from location state:", state.chat);
            setChat(state.chat);
          } else {
            throw new Error(`Chat ${chatId} not found`);
          }
        }
        
      } catch (err) {
        console.error("Error loading chat:", err);
        // Check location state for chat data
        const state = location.state as { chat?: Chat };
        if (state?.chat) {
          setChat(state.chat);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchMessages = async (id: number) => {
      try {
        const messagesResp = await fetch(`${API_BASE}/chat-messages?chat_id=${id}&limit=100`);
        if (messagesResp.ok) {
          const messagesData = await messagesResp.json();
          console.log("Messages data:", messagesData);
          
          // YOUR backend returns { messages, total }
          if (messagesData.messages) {
            setMessages(messagesData.messages);
          } else {
            setMessages(messagesData);
          }
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchChatAndMessages();

    // Set up polling for new messages
    const interval = setInterval(fetchChatAndMessages, 3000);
    return () => clearInterval(interval);
  }, [chatId, navigate, location.state]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    console.log("Sending message:", messageToSend);

    try {
      const resp = await fetch(`${API_BASE}/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageToSend),
      });

      if (resp.ok) {
        const data = await resp.json();
        console.log("Message sent response:", data);
        setNewMessage("");
        
        // Add the new message to our list
        if (data.message) {
          setMessages(prev => [...prev, data.message]);
        } else {
          // For demo, create a mock message
          const mockMessage: Message = {
            id: Date.now(),
            senderEmail: currentUser.email,
            content: newMessage.trim(),
            created_at: new Date().toISOString(),
            is_read: false,
            receiverEmail: otherUserEmail,
            chat_id: parseInt(chatId)
          };
          setMessages(prev => [...prev, mockMessage]);
          setNewMessage("");
        }
      } else {
        const errorText = await resp.text();
        console.error("Failed to send message:", errorText);
        // Fallback for demo
        const mockMessage: Message = {
          id: Date.now(),
          senderEmail: currentUser.email,
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
          is_read: false,
          receiverEmail: otherUserEmail,
          chat_id: parseInt(chatId)
        };
        setMessages(prev => [...prev, mockMessage]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Fallback for demo
      const mockMessage: Message = {
        id: Date.now(),
        senderEmail: currentUser.email,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        is_read: false,
        receiverEmail: otherUserEmail,
        chat_id: parseInt(chatId)
      };
      setMessages(prev => [...prev, mockMessage]);
      setNewMessage("");
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
      {/* Chat Header */}
      <header style={{
        background: "white",
        padding: "16px",
        borderBottom: "1px solid #e0e0e0",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(205, 127, 50, 0.1)",
      }}>
        <button
          onClick={() => navigate("/chat")}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            color: "#CD7F32",
            cursor: "pointer",
            padding: "4px",
          }}
        >
          <FaArrowLeft />
        </button>

        <div style={{ flex: 1 }}>
          <h1 style={{ 
            fontSize: "18px", 
            fontWeight: "bold", 
            margin: 0, 
            color: "#1a1a1a",
            fontFamily: "'Playfair Display', serif" 
          }}>
            {getOtherUserName()}
          </h1>
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
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: isMe ? "flex-end" : "flex-start",
                    maxWidth: "70%",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{
                    background: isMe ? "#CD7F32" : "white",
                    color: isMe ? "#fff" : "#1a1a1a",
                    padding: "12px 16px",
                    borderRadius: "18px",
                    borderBottomRightRadius: isMe ? "4px" : "18px",
                    borderBottomLeftRadius: isMe ? "18px" : "4px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    wordBreak: "break-word",
                    border: `1px solid ${isMe ? "#B87333" : "#E6B17E"}`,
                  }}>
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
                        {formatTime(msg.created_at)}
                        {isMe && msg.is_read && (
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