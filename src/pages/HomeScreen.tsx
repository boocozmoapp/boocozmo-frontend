// src/pages/HomeScreen.tsx - COMPLETE FIXED VERSION
import { useEffect, useState, useCallback, useMemo, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaHome,
  FaMapMarkedAlt,
  FaPlus,
  FaComments,
  FaBell,
  FaBookmark,
  FaCog,
  FaBookOpen,
  FaUsers,
  FaCompass,
  FaStar,
  FaTimes,
  FaFilter,
  FaDollarSign,
  FaExchangeAlt,
  FaTag,
  FaEllipsisH,
  FaHeart,
  FaShareAlt,
  FaBookmark as FaBookmarkSolid,
  FaMapMarkerAlt,
  FaCheck,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

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
  icon: "#767676",
  redLight: "#FFE2E6",
  grayLight: "#F7F7F7",
};

type Offer = {
  id: number;
  type: "buy" | "sell" | "exchange";
  bookTitle: string;
  exchangeBook: string | null;
  price: number | null;
  condition: string | null;
  ownerEmail: string;
  imageUrl: string | null;
  imageBase64: string | null;
  latitude: number | null;
  longitude: number | null;
  ownerName?: string;
  distance?: string | null;
  description?: string;
  genre?: string;
  author?: string;
  lastUpdated?: string;
  saved?: boolean;
  liked?: boolean;
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
  onAddPress?: () => void;
  onProfilePress?: () => void;
  onMapPress?: () => void;
};

// Function to generate random heights for Pinterest effect
const getRandomHeight = (index: number) => {
  const heights = [260, 280, 240, 300, 220, 260, 280, 240];
  return heights[index % heights.length];
};

// Retry wrapper with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export default function HomeScreen({
  currentUser,
  onAddPress,
  onProfilePress,
  onMapPress,
}: Props) {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "sell" | "exchange" | "buy">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredOffer, setHoveredOffer] = useState<number | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isLiked, setIsLiked] = useState<Record<number, boolean>>({});
  const [isSaved, setIsSaved] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [chatLoading, setChatLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchOffers = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setImageErrors({});

    try {
      const response = await fetchWithTimeout(`${API_BASE}/offers`, {
        signal: abortControllerRef.current.signal,
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Cache-Control": "no-cache",
        },
      }, 15000);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load offers");
      }

      const data = await response.json();
      
      let rawOffers = [];
      if (Array.isArray(data)) {
        rawOffers = data;
      } else if (data.offers && Array.isArray(data.offers)) {
        rawOffers = data.offers;
      } else if (data.data && Array.isArray(data.data)) {
        rawOffers = data.data;
      }

      // Process offers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processed: Offer[] = rawOffers.map((o: any, index: number) => {
        let imageUrl = null;
        
        if (o.imageUrl) {
          if (o.imageUrl.startsWith('data:image/')) {
            imageUrl = o.imageUrl;
          } else if (o.imageUrl.startsWith('http')) {
            imageUrl = o.imageUrl;
          } else if (o.imageUrl.startsWith('/')) {
            imageUrl = `${API_BASE}${o.imageUrl}`;
          } else {
            imageUrl = `${API_BASE}/uploads/${o.imageUrl}`;
          }
        }
        
        if (!imageUrl) {
          const fallbacks = [
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80",
            "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=300&h=380&fit=crop&q=80",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=420&fit=crop&q=80",
            "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&h=400&fit=crop&q=80",
            "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=380&fit=crop&q=80",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&q=80",
          ];
          imageUrl = fallbacks[index % fallbacks.length];
        }

        return {
          id: o.id || index,
          type: o.type || "sell",
          bookTitle: o.bookTitle || o.title || "Unknown Book",
          exchangeBook: o.exchangeBook || null,
          price: o.price ? parseFloat(o.price) : null,
          condition: o.condition || null,
          ownerEmail: o.ownerEmail || "unknown@example.com",
          imageUrl,
          imageBase64: o.imageBase64 || null,
          latitude: o.latitude ? parseFloat(o.latitude) : null,
          longitude: o.longitude ? parseFloat(o.longitude) : null,
          ownerName: o.ownerName || o.ownerEmail?.split("@")[0] || "User",
          distance: o.distance || "Nearby",
          description: o.description || `A great book about ${o.genre || "fiction"}. Perfect condition!`,
          genre: o.genre || "Fiction",
          author: o.author || "Unknown Author",
          lastUpdated: o.lastUpdated || o.created_at || new Date().toISOString(),
        };
      });

      setOffers(processed);
      
      const likes: Record<number, boolean> = {};
      const saves: Record<number, boolean> = {};
      processed.forEach(offer => {
        likes[offer.id] = Math.random() > 0.5;
        saves[offer.id] = Math.random() > 0.7;
      });
      setIsLiked(likes);
      setIsSaved(saves);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error:", err);
        setError(err.message || "Failed to load books");
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser.token]);

  useEffect(() => {
    fetchOffers();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchOffers]);

  const filteredOffers = useMemo(() => {
    let result = offers;

    if (selectedFilter !== "all") {
      result = result.filter((o) => o.type === selectedFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.bookTitle.toLowerCase().includes(q) ||
          o.author?.toLowerCase().includes(q) ||
          o.description?.toLowerCase().includes(q) ||
          o.genre?.toLowerCase().includes(q) ||
          o.exchangeBook?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [offers, selectedFilter, searchQuery]);

  const getImageSource = useCallback((offer: Offer) => {
    if (offer.imageUrl) {
      return offer.imageUrl;
    }
    
    if (offer.imageBase64) {
      if (offer.imageBase64.startsWith('data:image/')) {
        return offer.imageBase64;
      }
      return `data:image/jpeg;base64,${offer.imageBase64}`;
    }
    
    const fallbacks = [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80",
      "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=300&h=380&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=420&fit=crop&q=80",
    ];
    return fallbacks[offer.id % fallbacks.length];
  }, []);

  const handleImageError = useCallback((offerId: number) => {
    setImageErrors(prev => ({
      ...prev,
      [offerId]: true
    }));
  }, []);

  const handleLike = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setIsLiked(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const handleSave = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setIsSaved(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sell": return "For Sale";
      case "exchange": return "Exchange";
      case "buy": return "Wanted";
      default: return "";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sell": return <FaDollarSign size={10} />;
      case "exchange": return <FaExchangeAlt size={10} />;
      case "buy": return <FaTag size={10} />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sell": return PINTEREST.primary;
      case "exchange": return "#00A86B";
      case "buy": return "#1D9BF0";
      default: return PINTEREST.textLight;
    }
  };

  const formatPrice = (price: number | null) => price ? `$${price.toFixed(2)}` : "Free";

  const formatTimeAgo = (dateString: string): string => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // ==================== CHAT FUNCTIONALITY ====================
  const handleChat = useCallback(async (offer: Offer) => {
    if (offer.ownerEmail === currentUser.email) {
      alert("This is your own listing!");
      return;
    }

    setChatLoading(true);
    
    try {
      // Step 1: Get all chats for current user
      const chatsResponse = await fetchWithTimeout(`${API_BASE}/chats`, {
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
      }, 8000);

      if (!chatsResponse.ok) {
        throw new Error("Failed to fetch chats");
      }

      const chats = await chatsResponse.json();
      
      // Find existing chat with this user for this offer
      let existingChat = null;
      if (Array.isArray(chats)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existingChat = chats.find((chat: any) => 
          ((chat.user1 === currentUser.email && chat.user2 === offer.ownerEmail) ||
           (chat.user1 === offer.ownerEmail && chat.user2 === currentUser.email)) &&
          chat.offer_id === offer.id
        );
      }

      let chatId = existingChat?.id;

      // Step 2: Create new chat if none exists
      if (!chatId) {
        const messageResponse = await fetchWithTimeout(`${API_BASE}/send-message`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${currentUser.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            receiver: offer.ownerEmail,
            content: `Hi! I'm interested in your book "${offer.bookTitle}"`,
            offer_id: offer.id,
            useExistingChat: false,
          }),
        }, 10000);

        if (!messageResponse.ok) {
          const errData = await messageResponse.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to start chat");
        }

        const result = await messageResponse.json();
        chatId = result.message?.chat_id || result.chat_id;
      }

      if (chatId) {
        // Navigate to chat screen with proper state
        navigate(`/chat/${chatId}`, {
          state: {
            chat: {
              id: chatId,
              user1: currentUser.email,
              user2: offer.ownerEmail,
              other_user_name: offer.ownerName || offer.ownerEmail.split("@")[0],
              offer_title: offer.bookTitle,
              offer_id: offer.id,
              token: currentUser.token,
            },
          },
        });
        
        // Close offer detail modal
        setSelectedOffer(null);
      }
    } catch (error) {
      console.error("Chat error:", error);
      alert("Failed to start chat. Please try again.");
    } finally {
      setChatLoading(false);
    }
  }, [currentUser.email, currentUser.token, navigate]);

  const handleCardClick = useCallback((offer: Offer) => {
    setSelectedOffer(offer);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedOffer(null);
  }, []);

  const filterButtons = [
    { id: "all" as const, label: "All", icon: <FaFilter size={12} /> },
    { id: "sell" as const, label: "For Sale", icon: <FaDollarSign size={12} /> },
    { id: "exchange" as const, label: "Exchange", icon: <FaExchangeAlt size={12} /> },
    { id: "buy" as const, label: "Wanted", icon: <FaTag size={12} /> },
  ];

  const navItems = [
    { icon: FaHome, label: "Home", active: true, onClick: () => navigate("/") },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBookOpen, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaBookmark, label: "Saved", onClick: () => {} },
    { icon: FaUsers, label: "Following", onClick: () => {} },
    { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
    { icon: FaBell, label: "Notifications", onClick: () => {} },
    { icon: FaStar, label: "Top Picks", onClick: () => {} },
  ];

  // Pinterest Card Component
  const PinterestCard = useMemo(
    () =>
      memo(({ offer, index }: { offer: Offer; index: number }) => {
        const imgSrc = getImageSource(offer);
        const hovered = hoveredOffer === offer.id;
        const liked = isLiked[offer.id] || false;
        const saved = isSaved[offer.id] || false;
        const cardHeight = getRandomHeight(index);
        const hasImageError = imageErrors[offer.id];
        
        const displaySrc = hasImageError 
          ? "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80"
          : imgSrc;

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.3,
              delay: index * 0.03
            }}
            whileHover={{ 
              y: -4,
              transition: { duration: 0.2 }
            }}
            onMouseEnter={() => setHoveredOffer(offer.id)}
            onMouseLeave={() => setHoveredOffer(null)}
            onClick={() => handleCardClick(offer)}
            style={{
              position: "relative",
              cursor: "pointer",
              borderRadius: "12px",
              overflow: "hidden",
              background: "white",
              boxShadow: hovered 
                ? "0 8px 16px rgba(0,0,0,0.1)"
                : "0 2px 8px rgba(0,0,0,0.06)",
              transition: "all 0.2s ease",
              height: `${cardHeight}px`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Image Container */}
            <div style={{ 
              position: "relative", 
              height: "60%",
              overflow: "hidden",
              background: PINTEREST.grayLight 
            }}>
              <img
                src={displaySrc}
                alt={offer.bookTitle}
                onError={() => handleImageError(offer.id)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                loading="lazy"
              />

              {/* Type Badge */}
              <div style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                background: getTypeColor(offer.type),
                color: "white",
                padding: "4px 8px",
                borderRadius: "8px",
                fontSize: "10px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                textTransform: "uppercase",
                zIndex: 2,
              }}>
                {getTypeIcon(offer.type)}
                {getTypeLabel(offer.type)}
              </div>

              {/* Like Button */}
              <motion.button
                onClick={(e) => handleLike(e, offer.id)}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "36px",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 2,
                  fontSize: "12px",
                }}
              >
                <FaHeart 
                  color={liked ? PINTEREST.primary : PINTEREST.textLight}
                  fill={liked ? PINTEREST.primary : "none"}
                />
              </motion.button>

              {/* Save Button */}
              <motion.button
                onClick={(e) => handleSave(e, offer.id)}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 2,
                  fontSize: "12px",
                }}
              >
                <FaBookmark 
                  color={saved ? PINTEREST.primary : PINTEREST.textLight}
                  fill={saved ? PINTEREST.primary : "none"}
                />
              </motion.button>

              {/* Price */}
              {offer.price && (
                <div style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "8px",
                  background: "rgba(255, 255, 255, 0.9)",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: PINTEREST.primary,
                  zIndex: 2,
                }}>
                  {formatPrice(offer.price)}
                </div>
              )}
            </div>

            {/* Bottom Content */}
            <div style={{ 
              padding: "12px", 
              background: "white",
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}>
              <h3 style={{ 
                fontSize: "14px", 
                fontWeight: "600", 
                margin: "0 0 6px",
                color: PINTEREST.textDark,
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                flex: 1,
              }}>
                {offer.bookTitle}
              </h3>
              
              {offer.author && (
                <p style={{ 
                  fontSize: "12px", 
                  color: PINTEREST.textLight,
                  margin: "0 0 6px",
                  fontStyle: "italic",
                }}>
                  {offer.author}
                </p>
              )}

              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginTop: "auto",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: PINTEREST.grayLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: PINTEREST.textLight,
                    fontSize: "10px",
                    fontWeight: "600",
                    border: `1px solid ${PINTEREST.border}`,
                  }}>
                    {offer.ownerName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "500", color: PINTEREST.textDark }}>
                      {offer.ownerName?.split(" ")[0] || "User"}
                    </div>
                    <div style={{ fontSize: "10px", color: PINTEREST.textLight }}>
                      {offer.distance}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "6px",
                  fontSize: "11px",
                  color: PINTEREST.textLight
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "3px",
                  }}>
                    <FaHeart size={10} color={liked ? PINTEREST.primary : PINTEREST.textLight} />
                    <span style={{ fontWeight: "500" }}>{Math.floor(Math.random() * 30) + 5}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      }),
    [getImageSource, hoveredOffer, isLiked, isSaved, handleLike, handleSave, handleImageError, imageErrors, handleCardClick]
  );

  return (
    <div style={{ 
      height: "100vh", 
      width: "100vw", 
      background: PINTEREST.bg, 
      display: "flex", 
      overflow: "hidden",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
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
          zIndex: 1000,
          padding: "20px 16px",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${PINTEREST.primary}, ${PINTEREST.dark})`,
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
              color: PINTEREST.textDark,
              letterSpacing: "-0.5px",
            }}>
              boocozmo
            </span>
          </div>
        </div>

        {/* User Profile */}
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

        {/* Navigation */}
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

        {/* Create Button */}
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
            boxShadow: "0 4px 20px rgba(230, 0, 35, 0.3)",
          }}
        >
          <FaPlus /> Share a Book
        </motion.button>

        {/* Settings */}
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
        overflow: "hidden",
      }}>
        {/* Header */}
        <header style={{
          padding: "12px 20px",
          background: "white",
          borderBottom: `1px solid ${PINTEREST.border}`,
          flexShrink: 0,
          zIndex: 100,
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            marginBottom: "12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: PINTEREST.hoverBg,
                  border: `1px solid ${PINTEREST.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: PINTEREST.textDark,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {sidebarOpen ? <FaTimes size={16} /> : <FaEllipsisH size={16} color={PINTEREST.textDark} />}
              </motion.button>

              {/* Search */}
              <div style={{ position: "relative", flex: 1 }}>
                <FaSearch
                  size={12}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: PINTEREST.icon,
                    zIndex: 1,
                  }}
                />
                <input
                  type="text"
                  placeholder="Search books, authors, genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 10px 10px 36px",
                    borderRadius: "20px",
                    border: `1px solid ${PINTEREST.border}`,
                    fontSize: "14px",
                    background: PINTEREST.grayLight,
                    color: PINTEREST.textDark,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Notifications */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: PINTEREST.hoverBg,
                  border: `1px solid ${PINTEREST.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: PINTEREST.textDark,
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <FaBell size={16}  color={PINTEREST.textDark} />
                <div style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: PINTEREST.primary,
                  border: `2px solid ${PINTEREST.hoverBg}`,
                }} />
              </motion.button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ 
            display: "flex", 
            gap: "6px",
            overflowX: "auto",
            paddingBottom: "2px",
            scrollbarWidth: "none",
          }}>
            {filterButtons.map((filter) => (
              <motion.button
                key={filter.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedFilter(filter.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "16px",
                  background: selectedFilter === filter.id ? PINTEREST.primary : PINTEREST.hoverBg,
                  color: selectedFilter === filter.id ? "white" : PINTEREST.textDark,
                  fontSize: "12px",
                  fontWeight: selectedFilter === filter.id ? "600" : "500",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                  border: "none",
                  flexShrink: 0,
                }}
              >
                {filter.icon}
                {filter.label}
              </motion.button>
            ))}
          </div>
        </header>

        {/* Main Feed - Scrollable Pinterest Layout */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          alignContent: "start",
          minHeight: 0,
        }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: PINTEREST.grayLight,
                  borderRadius: "12px",
                  height: `${getRandomHeight(i)}px`,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))
          ) : error ? (
            <div style={{ 
              gridColumn: "1 / -1", 
              textAlign: "center", 
              padding: "40px 20px",
              background: "white",
              borderRadius: "12px",
              margin: "20px",
            }}>
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: PINTEREST.redLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "24px",
                color: PINTEREST.primary,
              }}>
                <FaBookOpen />
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: PINTEREST.textDark, marginBottom: "8px" }}>
                Unable to load books
              </h3>
              <p style={{ color: PINTEREST.textLight, marginBottom: "16px", fontSize: "14px" }}>
                {error}
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                onClick={fetchOffers}
                style={{
                  padding: "10px 20px",
                  background: PINTEREST.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Try Again
              </motion.button>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div style={{ 
              gridColumn: "1 / -1", 
              textAlign: "center", 
              padding: "40px 20px",
              background: "white",
              borderRadius: "12px",
              margin: "20px",
            }}>
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: PINTEREST.redLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "24px",
                color: PINTEREST.primary,
              }}>
                <FaBookOpen />
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: PINTEREST.textDark, marginBottom: "8px" }}>
                No books found
              </h3>
              <p style={{ 
                color: PINTEREST.textLight, 
                fontSize: "14px",
                marginBottom: "20px",
              }}>
                {searchQuery 
                  ? `No results for "${searchQuery}"`
                  : "Be the first to share a book!"
                }
              </p>
              {onAddPress && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  onClick={onAddPress}
                  style={{
                    padding: "10px 20px",
                    background: PINTEREST.primary,
                    color: "white",
                    border: "none",
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaPlus size={12} /> Share a Book
                </motion.button>
              )}
            </div>
          ) : (
            <AnimatePresence>
              {filteredOffers.map((offer, index) => (
                <PinterestCard key={offer.id} offer={offer} index={index} />
              ))}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Selected Offer Detail Modal - PERFECTLY CENTERED */}
<AnimatePresence>
  {selectedOffer && (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleCloseDetail}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 2000,
        }}
      />
      
      {/* CENTERING WRAPPER */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2001,
        pointerEvents: "none",
      }}>
        {/* Detail Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            width: "calc(100% - 40px)",
            maxWidth: "400px",
            maxHeight: "85vh",
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(20px)",
            borderRadius: "20px",
            padding: "20px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
            overflowY: "auto",
            border: `1px solid ${PINTEREST.border}`,
            boxSizing: "border-box",
            pointerEvents: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCloseDetail}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: PINTEREST.primary,
              border: "none",
              color: "white",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "18px",
              zIndex: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}
          >
            <FaTimes />
          </motion.button>

          {/* Content - KEEP ALL YOUR EXISTING CONTENT HERE */}
          <div style={{ marginBottom: "20px" }}>
            {/* Book Image */}
            <div style={{
              width: "100%",
              height: "180px",
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "16px",
              background: PINTEREST.grayLight,
            }}>
              <img
                src={getImageSource(selectedOffer)}
                alt={selectedOffer.bookTitle}
                onError={() => handleImageError(selectedOffer.id)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Title and Author */}
            <h3 style={{ 
              fontSize: "18px", 
              fontWeight: "700", 
              margin: "0 0 6px",
              color: PINTEREST.textDark,
              lineHeight: 1.3,
              paddingRight: "40px",
            }}>
              {selectedOffer.bookTitle}
            </h3>
            <p style={{ 
              fontSize: "14px", 
              color: PINTEREST.textLight, 
              margin: "0 0 12px",
              fontStyle: "italic",
            }}>
              {selectedOffer.author ? `by ${selectedOffer.author}` : "Unknown Author"}
            </p>

            {/* Metadata */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              fontSize: "12px",
              color: PINTEREST.textLight,
              marginBottom: "16px",
              flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <FaMapMarkerAlt size={11} /> 
                <span>{selectedOffer.distance ? `${selectedOffer.distance} away` : "Nearby"}</span>
              </div>
              <span style={{ opacity: 0.3 }}>•</span>
              <div>
                {selectedOffer.ownerName || selectedOffer.ownerEmail.split("@")[0]}
              </div>
              {selectedOffer.lastUpdated && (
                <>
                  <span style={{ opacity: 0.3 }}>•</span>
                  <div>
                    {formatTimeAgo(selectedOffer.lastUpdated)}
                  </div>
                </>
              )}
            </div>

            {/* Type Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "16px",
                background: `${getTypeColor(selectedOffer.type)}15`,
                color: getTypeColor(selectedOffer.type),
                fontSize: "11px",
                fontWeight: "600",
                marginBottom: "16px",
                border: `1px solid ${getTypeColor(selectedOffer.type)}30`,
              }}
            >
              {getTypeIcon(selectedOffer.type)}
              {getTypeLabel(selectedOffer.type)}
            </div>
          </div>

          {/* Description */}
          {selectedOffer.description && (
            <div style={{
              marginBottom: "20px",
              paddingBottom: "20px",
              borderBottom: `1px solid ${PINTEREST.border}`,
              maxHeight: "100px",
              overflowY: "auto",
            }}>
              <h4 style={{ 
                fontSize: "13px", 
                fontWeight: "600", 
                margin: "0 0 8px",
                color: PINTEREST.textDark,
              }}>
                Description
              </h4>
              <p style={{
                fontSize: "13px",
                color: PINTEREST.textLight,
                lineHeight: 1.5,
                margin: 0,
              }}>
                {selectedOffer.description}
              </p>
            </div>
          )}

          {/* Price/Exchange Info */}
          <div style={{ 
            marginBottom: "24px",
            padding: "16px",
            background: PINTEREST.grayLight,
            borderRadius: "12px",
            border: `1px solid ${PINTEREST.border}`,
          }}>
            <div style={{ fontSize: "11px", color: PINTEREST.textLight, marginBottom: "6px" }}>
              {selectedOffer.type === "sell" ? "Price" : 
               selectedOffer.type === "buy" ? "Looking for" : "Exchange for"}
            </div>
            <div style={{ 
              fontSize: "22px", 
              fontWeight: "800", 
              color: PINTEREST.primary,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}>
              {selectedOffer.type === "sell" && selectedOffer.price ? (
                <>
                  <FaDollarSign size={18} /> {formatPrice(selectedOffer.price)}
                </>
              ) : selectedOffer.type === "exchange" && selectedOffer.exchangeBook ? (
                <>
                  <FaExchangeAlt size={18} /> Exchange
                </>
              ) : (
                <>
                  <FaTag size={18} /> Wanted
                </>
              )}
            </div>
            
            {selectedOffer.exchangeBook && (
              <div style={{ 
                fontSize: "13px", 
                color: PINTEREST.textDark, 
                fontWeight: "500",
                padding: "8px 12px",
                background: "rgba(255,255,255,0.7)",
                borderRadius: "8px",
                borderLeft: `3px solid #00A86B`,
              }}>
                For: <span style={{ fontWeight: "600" }}>{selectedOffer.exchangeBook}</span>
              </div>
            )}
          </div>

          {/* Chat Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleChat(selectedOffer)}
            disabled={chatLoading || selectedOffer.ownerEmail === currentUser.email}
            style={{
              width: "100%",
              background: selectedOffer.ownerEmail === currentUser.email ? PINTEREST.textLight : PINTEREST.primary,
              color: "white",
              border: "none",
              padding: "14px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: selectedOffer.ownerEmail === currentUser.email ? "not-allowed" : (chatLoading ? "wait" : "pointer"),
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: chatLoading ? 0.8 : 1,
            }}
          >
            {chatLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: "16px",
                    height: "16px",
                    border: `2px solid rgba(255,255,255,0.3)`,
                    borderTopColor: "white",
                    borderRadius: "50%",
                  }}
                />
                Starting Chat...
              </>
            ) : selectedOffer.ownerEmail === currentUser.email ? (
              <>
                <FaCheck size={14} />
                This is Your Book
              </>
            ) : (
              <>
                <FaComments size={14} />
                Contact Owner
              </>
            )}
          </motion.button>

          {/* Action Buttons */}
          <div style={{
            display: "flex",
            gap: "8px",
            paddingTop: "16px",
            borderTop: `1px solid ${PINTEREST.border}`,
          }}>
            {[
              { 
                icon: FaHeart, 
                label: "Like", 
                onClick: (e: React.MouseEvent) => handleLike(e, selectedOffer.id), 
                color: isLiked[selectedOffer.id] ? PINTEREST.primary : PINTEREST.textLight,
                disabled: false,
              },
              { 
                icon: FaBookmarkSolid, 
                label: "Save", 
                onClick: (e: React.MouseEvent) => handleSave(e, selectedOffer.id), 
                color: isSaved[selectedOffer.id] ? PINTEREST.primary : PINTEREST.textLight,
                disabled: false,
              },
              { 
                icon: FaShareAlt, 
                label: "Share", 
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (navigator.share) {
                    navigator.share({
                      title: selectedOffer.bookTitle,
                      text: `Check out "${selectedOffer.bookTitle}" by ${selectedOffer.author} on Boocozmo`,
                      url: `${window.location.origin}/offer/${selectedOffer.id}`,
                    });
                  }
                }, 
                color: PINTEREST.textLight,
                disabled: false,
              },
            ].map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.onClick}
                disabled={action.disabled}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  background: `${action.color}10`,
                  color: action.color,
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: action.disabled ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  minHeight: "40px",
                  opacity: action.disabled ? 0.5 : 1,
                }}
              >
                <action.icon size={12} />
                {action.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  )}
</AnimatePresence>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${PINTEREST.grayLight};
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${PINTEREST.border};
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${PINTEREST.textLight};
        }
        
        input:focus {
          outline: none;
          border-color: ${PINTEREST.primary} !important;
        }
        
        div::-webkit-scrollbar {
          display: none;
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        img {
          transition: opacity 0.3s ease;
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed !important;
        }
      `}</style>
    </div>
  );
}