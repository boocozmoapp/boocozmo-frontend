// src/pages/SingleChat.tsx - WITH MUTUAL MAP FEATURE
import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  FaUsers,
  FaMapMarkerAlt,
  FaExpand,
  FaCompress,
  FaCrosshairs,
  FaMapPin,
} from "react-icons/fa";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = "https://boocozmo-api.onrender.com";

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
  redLight: "#FFE2E6",
  grayLight: "#F7F7F7",
  success: "#00A86B",
  info: "#1D9BF0",
  warning: "#FF9500",
  overlay: "rgba(0, 0, 0, 0.7)"
};

// Map pin types
interface MapPin {
  id: number;
  lat: number;
  lng: number;
  senderEmail: string;
  senderName: string;
  created_at: string;
  messageId?: number;
  note?: string;
}

type Message = {
  id: number;
  senderEmail: string;
  content: string;
  created_at: string;
  is_read: boolean;
  isMapPin?: boolean;
  mapPinData?: {
    lat: number;
    lng: number;
    note?: string;
  };
};

type Chat = {
  id: number;
  user1: string;
  user2: string;
  offer_id?: number;
  title?: string | null;
  other_user_name?: string | null;
  offer_title?: string | null;
  offer_latitude?: number;
  offer_longitude?: number;
};

type SingleChatProps = {
  currentUser: { email: string; name: string; id: string; token: string };
  onProfilePress?: () => void;
  onMapPress?: () => void;
  onAddPress?: () => void;
};

// Custom map pin icons
const createPinIcon = (isCurrentUser: boolean = false, isOfferLocation: boolean = false) => {
  const colors = {
    user: PINTEREST.primary,
    other: PINTEREST.info,
    offer: PINTEREST.success
  };

  const color = isOfferLocation ? colors.offer : (isCurrentUser ? colors.user : colors.other);
  
  return L.divIcon({
    className: 'map-pin-icon',
    html: `
      <div style="
        width: ${isOfferLocation ? '48px' : '36px'};
        height: ${isOfferLocation ? '48px' : '36px'};
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${isOfferLocation ? '18px' : '14px'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
        position: relative;
      ">
        ${isOfferLocation ? '📚' : (isCurrentUser ? '📍' : '📌')}
        ${!isOfferLocation && `<div style="
          position: absolute;
          top: -5px;
          right: -5px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${color};
          border: 2px solid white;
        "></div>`}
      </div>
    `,
    iconSize: isOfferLocation ? [48, 48] : [36, 36],
    iconAnchor: isOfferLocation ? [24, 48] : [18, 36],
    popupAnchor: [0, -36]
  });
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
  const [mapPins, setMapPins] = useState<MapPin[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [isAddingPin, setIsAddingPin] = useState(false);
  // eslint-disable-next-line no-empty-pattern
  const [] = useState("");

  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  
  // Chat refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserNearBottom = useRef(true);

  // Initialize chat data
  useEffect(() => {
    const state = location.state as { chat?: Chat };
    if (state?.chat) {
      setChat(state.chat);
      // Initialize map if we have offer location
      if (state.chat.offer_latitude && state.chat.offer_longitude) {
        setTimeout(() => initializeMap(), 100);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapRef.current) return;

    // Default to offer location or NYC
    const defaultLat = chat?.offer_latitude || 40.7128;
    const defaultLng = chat?.offer_longitude || -74.006;
    const defaultZoom = chat?.offer_latitude ? 15 : 13;

    // Remove existing map if any
    if (mapInstance.current) {
      mapInstance.current.remove();
      markersRef.current = [];
    }

    // Create enhanced map
    const map = L.map(mapRef.current, {
      center: [defaultLat, defaultLng],
      zoom: defaultZoom,
      zoomControl: true,
      attributionControl: false,
      minZoom: 3,
      maxZoom: 19,
      scrollWheelZoom: 'center',
      doubleClickZoom: 'center',
      touchZoom: 'center',
    });

    mapInstance.current = map;

    // Add tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '© OpenStreetMap contributors, © CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    // Add scale control
    L.control.scale({ imperial: true, metric: true }).addTo(map);

    // Add offer location marker if exists
    if (chat?.offer_latitude && chat?.offer_longitude) {
      const offerIcon = createPinIcon(false, true);
      const offerMarker = L.marker([chat.offer_latitude, chat.offer_longitude], {
        icon: offerIcon,
        zIndexOffset: 1000
      })
        .addTo(map)
        .bindPopup(`
          <div style="padding: 8px;">
            <strong style="color: ${PINTEREST.success}">📚 Book Location</strong><br>
            <small>${chat.offer_title || 'Offer Location'}</small>
          </div>
        `);
      markersRef.current.push(offerMarker);
    }

    // Add existing pins
    mapPins.forEach(pin => {
      const isCurrentUser = pin.senderEmail === currentUser.email;
      const icon = createPinIcon(isCurrentUser, false);
      const marker = L.marker([pin.lat, pin.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="padding: 8px; min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: ${isCurrentUser ? PINTEREST.primary : PINTEREST.info}"></div>
              <strong>${pin.senderName.split(' ')[0]}</strong>
            </div>
            ${pin.note ? `<p style="margin: 0; color: ${PINTEREST.textDark}">${pin.note}</p>` : ''}
            <small style="color: ${PINTEREST.textMuted}">${new Date(pin.created_at).toLocaleString()}</small>
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Map click handler for adding pins
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (!isAddingPin) return;
      
      const { lat, lng } = e.latlng;
      
      // Ask for pin note
      const note = prompt("Add a note for this location (optional):", "");
      if (note === null) return; // User cancelled
      
      // Create and send pin
      createMapPin(lat, lng, note || "");
      setIsAddingPin(false);
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat, mapPins, currentUser.email, isAddingPin]);

  // Toggle map expansion
  const toggleMapExpansion = () => {
    setMapExpanded(!mapExpanded);
    setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    }, 50);
  };

  // Create and send map pin
  const createMapPin = async (lat: number, lng: number, note: string = "") => {
    if (!chatId) return;

    const otherUserEmail = chat?.user1 === currentUser.email ? chat?.user2 : chat?.user1;
    if (!otherUserEmail) return;

    const optimisticId = Date.now();
    const optimisticPin: MapPin = {
      id: optimisticId,
      lat,
      lng,
      senderEmail: currentUser.email,
      senderName: currentUser.name,
      created_at: new Date().toISOString(),
      note
    };

    setMapPins(prev => [...prev, optimisticPin]);

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
          content: "", // Empty content for map pins
          chat_id: parseInt(chatId),
          offer_id: chat?.offer_id || null,
          isMapPin: true,
          mapPinData: { lat, lng, note }
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.message) {
          // Update with server ID
          setMapPins(prev => 
            prev.map(pin => pin.id === optimisticId ? {
              ...pin,
              id: data.message.id,
              messageId: data.message.id
            } : pin)
          );
        }
      }
    } catch (err) {
      console.error("Failed to send map pin:", err);
      setMapPins(prev => prev.filter(pin => pin.id !== optimisticId));
    }
  };

  // Fetch messages and extract map pins
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

      // Extract map pins from messages
      const newPins: MapPin[] = [];
      newMessages.forEach(msg => {
        if (msg.isMapPin && msg.mapPinData) {
          newPins.push({
            id: msg.id,
            lat: msg.mapPinData.lat,
            lng: msg.mapPinData.lng,
            senderEmail: msg.senderEmail,
            senderName: msg.senderEmail === currentUser.email ? currentUser.name : (chat?.other_user_name || "User"),
            created_at: msg.created_at,
            messageId: msg.id,
            note: msg.mapPinData.note
          });
        }
      });

      // Update map pins
      setMapPins(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const filteredNew = newPins.filter(p => !existingIds.has(p.id));
        if (filteredNew.length === 0) return prev;

        const updated = [...prev, ...filteredNew];
        
        // Re-initialize map with new pins
        setTimeout(() => {
          if (mapInstance.current) {
            initializeMap();
          }
        }, 100);

        return updated;
      });

      // Update messages
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const filteredNew = newMessages.filter(m => !existingIds.has(m.id));
        if (filteredNew.length === 0) return prev;

        return [...prev, ...filteredNew].sort((a, b) => a.id - b.id);
      });
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  }, [chatId, currentUser.token, currentUser.email, currentUser.name, chat?.other_user_name, initializeMap]);

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
    const interval = setInterval(fetchMessages, 3000); // More frequent updates for real-time pins
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll handling
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

  // Auto-scroll to new messages
  useEffect(() => {
    if (isUserNearBottom.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Initialize map when component mounts or chat loads
  useEffect(() => {
    if (chat && showMap) {
      setTimeout(() => {
        initializeMap();
      }, 300);
    }
  }, [chat, showMap, initializeMap]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Send regular text message
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

  // Center map on offer location
  const centerOnOffer = () => {
    if (mapInstance.current && chat?.offer_latitude && chat?.offer_longitude) {
      mapInstance.current.setView([chat.offer_latitude, chat.offer_longitude], 16, {
        animate: true,
        duration: 0.5
      });
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
              cursor: "pointer"
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
              cursor: "pointer"
            }}
          >
            <FaArrowLeft size={18} />
          </motion.button>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>{getOtherUserName()}</h1>
            <p style={{ fontSize: "13px", color: PINTEREST.textLight, margin: "4px 0 0" }}>{getOfferTitle()}</p>
          </div>

          {/* Map Controls in Header */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMap(!showMap)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                background: showMap ? PINTEREST.primary : PINTEREST.hoverBg,
                color: showMap ? "white" : PINTEREST.textDark,
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <FaMapMarkerAlt size={14} />
              {showMap ? "Hide Map" : "Show Map"}
            </motion.button>

            {chat?.offer_latitude && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={centerOnOffer}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: PINTEREST.success,
                  color: "white",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                <FaCrosshairs size={14} />
              </motion.button>
            )}
          </div>
        </header>

        {/* Mutual Map Section */}
        <AnimatePresence>
          {showMap && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: mapExpanded ? "70vh" : "250px", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: "relative",
                borderBottom: `1px solid ${PINTEREST.border}`,
                background: PINTEREST.grayLight,
                overflow: "hidden",
              }}
            >
              {/* Map Controls Overlay */}
              <div style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                zIndex: 1001,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}>
                {/* Expand/Collapse */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMapExpansion}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: PINTEREST.primary,
                    color: "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  }}
                >
                  {mapExpanded ? <FaCompress size={14} /> : <FaExpand size={14} />}
                </motion.button>

                {/* Add Pin Mode Toggle */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsAddingPin(!isAddingPin)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: isAddingPin ? PINTEREST.warning : PINTEREST.info,
                    color: "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  }}
                >
                  <FaMapPin size={14} />
                </motion.button>
              </div>

              {/* Map Instructions */}
              <div style={{
                position: "absolute",
                bottom: "12px",
                left: "12px",
                right: "12px",
                zIndex: 1001,
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(10px)",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                color: PINTEREST.textDark,
                fontWeight: "500",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}>
                <span>
                  {isAddingPin 
                    ? "📌 Tap map to add meeting point" 
                    : mapPins.length > 0 
                      ? `${mapPins.length} meeting point${mapPins.length > 1 ? 's' : ''} set` 
                      : "Add meeting points by tapping the map pin button"
                  }
                </span>
                
                {isAddingPin && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAddingPin(false)}
                    style={{
                      padding: "4px 8px",
                      background: PINTEREST.primary,
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </motion.button>
                )}
              </div>

              {/* Map Container */}
              <div
                ref={mapRef}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: mapExpanded ? "0" : "0",
                }}
              />

              {/* Pin Legend */}
              {mapPins.length > 0 && !mapExpanded && (
                <div style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  zIndex: 1001,
                  background: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(10px)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: PINTEREST.textDark,
                  maxWidth: "200px",
                }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>Meeting Points:</div>
                  {mapPins.slice(0, 3).map((pin) => (
                    <div key={pin.id} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "6px",
                      marginBottom: "2px",
                      fontSize: "10px"
                    }}>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: pin.senderEmail === currentUser.email ? PINTEREST.primary : PINTEREST.info,
                      }} />
                      <span>{pin.senderName.split(' ')[0]}</span>
                      {pin.note && <span style={{ opacity: 0.7 }}>• {pin.note}</span>}
                    </div>
                  ))}
                  {mapPins.length > 3 && (
                    <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "2px" }}>
                      +{mapPins.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <main 
          ref={scrollContainerRef} 
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{
                width: "48px", 
                height: "48px", 
                border: `4px solid ${PINTEREST.grayLight}`, 
                borderTopColor: PINTEREST.primary, 
                borderRadius: "50%", 
                margin: "0 auto 20px", 
                animation: "spin 1s linear infinite"
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
            <>
              {/* Map pin messages */}
              {messages.filter(m => m.isMapPin).map((msg) => {
                const isMe = msg.senderEmail === currentUser.email;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ alignSelf: "center", maxWidth: "85%", width: "100%" }}
                  >
                    <div style={{
                      background: isMe ? PINTEREST.primary : "white",
                      color: isMe ? "white" : PINTEREST.textDark,
                      padding: "12px 16px",
                      borderRadius: "16px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: isMe ? "rgba(255,255,255,0.2)" : PINTEREST.info,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                      }}>
                        📍
                      </div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "14px" }}>
                          {isMe ? "You" : getOtherUserName().split(' ')[0]} added a meeting point
                        </div>
                        {msg.mapPinData?.note && (
                          <div style={{ fontSize: "13px", opacity: 0.9, marginTop: "2px" }}>
                            "{msg.mapPinData.note}"
                          </div>
                        )}
                        <div style={{ fontSize: "11px", opacity: 0.8, marginTop: "4px" }}>
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Regular text messages */}
              {messages.filter(m => !m.isMapPin).map((msg) => {
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
              })}
            </>
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
            
            {/* Map Pin Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsAddingPin(!isAddingPin)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: isAddingPin ? PINTEREST.warning : PINTEREST.grayLight,
                color: isAddingPin ? "white" : PINTEREST.textDark,
                border: `1px solid ${isAddingPin ? PINTEREST.warning : PINTEREST.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <FaMapPin size={14} />
            </motion.button>

            {/* Send Button */}
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
          
          {/* Add Pin Mode Indicator */}
          {isAddingPin && (
            <div style={{
              marginTop: "8px",
              padding: "8px 12px",
              background: `${PINTEREST.warning}20`,
              borderRadius: "8px",
              fontSize: "13px",
              color: PINTEREST.warning,
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: `1px solid ${PINTEREST.warning}40`,
            }}>
              <FaMapPin size={12} />
              <span>Tap on the map above to add a meeting point</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddingPin(false)}
                style={{
                  marginLeft: "auto",
                  padding: "4px 8px",
                  background: PINTEREST.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .map-pin-icon {
          transition: transform 0.2s ease;
        }
        
        .map-pin-icon:hover {
          transform: scale(1.1);
        }
        
        .leaflet-control-zoom {
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
        
        .leaflet-container {
          font-family: 'Inter', -apple-system, sans-serif !important;
        }
        
        /* Smooth transitions */
        .leaflet-map-container {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}