/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/HomeScreen.tsx - GREEN ENERGY THEME: Calm, Sustainable, Professional
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
  FaBars,
  FaHeart,
  FaBookmark as FaBookmarkSolid,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api"; // Using Vite proxy

const GREEN = {
  dark: "#0F2415",           // Deep forest green
  medium: "#1A3A2A",         // Card & sidebar background
  accent: "#4A7C59",         // Soft sage green
  accentLight: "#6BA87A",
  textPrimary: "#E8F0E8",    // Soft off-white
  textSecondary: "#A8B8A8",  // Muted green
  textMuted: "#80A080",
  border: "rgba(74, 124, 89, 0.3)",
  grayLight: "#2A4A3A",
  hoverBg: "#255035",
  icon: "#80A080",
};

type Offer = {
  id: number;
  type: "sell" | "exchange" | "buy";
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
  visibility: "public" | "private";
  state: "open" | "closed";
  publishedAt?: string;
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
  onAddPress?: () => void;
  onProfilePress?: () => void;
  onMapPress?: () => void;
};

const getRandomHeight = (index: number) => {
  const heights = [260, 280, 240, 300, 220, 260, 280, 240];
  return heights[index % heights.length];
};

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
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchOffers = useCallback(async (pageNum = 0, isLoadMore = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (!isLoadMore) {
      setLoading(true);
    }
    setError(null);
    setImageErrors({});

    try {
      let endpoint = `${API_BASE}/offers`;
      if (searchQuery.trim()) {
        endpoint = `${API_BASE}/search-offers?query=${encodeURIComponent(searchQuery)}&`;
      } else {
        endpoint += "?";
      }
      endpoint += `limit=${limit}&offset=${pageNum * limit}`;

      const response = await fetchWithTimeout(endpoint, {
        signal: abortControllerRef.current.signal,
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Cache-Control": "no-cache",
        },
      }, 15000);

      if (!response.ok) {
        if (response.status === 401) throw new Error("Session expired. Please login again.");
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load offers");
      }

      const data = await response.json();
      let rawOffers = [];
      if (Array.isArray(data)) rawOffers = data;
      else if (data.offers && Array.isArray(data.offers)) rawOffers = data.offers;
      else if (data.data && Array.isArray(data.data)) rawOffers = data.data;

      const processed: Offer[] = rawOffers
        .filter((o: any) => o.visibility === "public" && o.state === "open")
        .map((o: any, index: number) => {
          let imageUrl = null;
          if (o.imageUrl) {
            if (o.imageUrl.startsWith('data:image/')) imageUrl = o.imageUrl;
            else if (o.imageUrl.startsWith('http')) imageUrl = o.imageUrl;
            else imageUrl = `${API_BASE}${o.imageUrl.startsWith('/') ? '' : '/'}${o.imageUrl}`;
          }

          if (!imageUrl) {
            const fallbacks = [
              "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80",
              "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=300&h=380&fit=crop&q=80",
              "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=420&fit=crop&q=80",
            ];
            imageUrl = fallbacks[index % fallbacks.length];
          }

          return {
            id: o.id || index,
            type: o.type || "sell",
            bookTitle: o.bookTitle || "Unknown Book",
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
            description: o.description || `A great book about ${o.genre || "fiction"}.`,
            genre: o.genre || "Fiction",
            author: o.author || "Unknown Author",
            lastUpdated: o.lastUpdated || o.publishedAt || o.created_at || new Date().toISOString(),
            visibility: o.visibility || "public",
            state: o.state || "open",
            publishedAt: o.publishedAt,
          };
        });

      if (isLoadMore) {
        setOffers(prev => [...prev, ...processed]);
      } else {
        setOffers(processed);
      }

      setHasMore(processed.length === limit);

      const likes: Record<number, boolean> = {};
      const saves: Record<number, boolean> = {};
      processed.forEach(offer => {
        likes[offer.id] = Math.random() > 0.5;
        saves[offer.id] = Math.random() > 0.7;
      });
      setIsLiked(prev => ({ ...prev, ...likes }));
      setIsSaved(prev => ({ ...prev, ...saves }));
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error:", err);
        setError(err.message || "Failed to load books");
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser.token, searchQuery]);

  useEffect(() => {
    fetchOffers(0, false);
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchOffers]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOffers(nextPage, true);
    }
  }, [loading, hasMore, page, fetchOffers]);

  const filteredOffers = useMemo(() => {
    let result = offers;
    if (selectedFilter !== "all") {
      result = result.filter((o) => o.type === selectedFilter);
    }
    result = result.filter((o) => o.visibility === "public" && o.state === "open");
    return result;
  }, [offers, selectedFilter]);

  const getImageSource = useCallback((offer: Offer) => {
    if (offer.imageUrl) return offer.imageUrl;
    if (offer.imageBase64) {
      if (offer.imageBase64.startsWith('data:image/')) return offer.imageBase64;
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
    setImageErrors(prev => ({ ...prev, [offerId]: true }));
  }, []);

  const handleLike = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setIsLiked(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSave = useCallback(async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const newSavedState = !isSaved[id];
    setIsSaved(prev => ({ ...prev, [id]: newSavedState }));

    try {
      const endpoint = newSavedState ? `${API_BASE}/save-offer` : `${API_BASE}/unsave-offer`;
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offer_id: id }),
      }, 8000);

      if (!response.ok) {
        setIsSaved(prev => ({ ...prev, [id]: !newSavedState }));
        throw new Error("Failed to update saved status");
      }
    } catch (err) {
      console.error("Save/Unsave error:", err);
      alert("Failed to update saved status");
    }
  }, [currentUser.token, isSaved]);

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
      case "sell": return GREEN.accent;
      case "exchange": return "#00A86B";
      case "buy": return "#1D9BF0";
      default: return GREEN.textMuted;
    }
  };

  const formatPrice = (price: number | null) => price ? `$${price.toFixed(2)}` : "Free";


  const handleChat = useCallback(async (offer: Offer) => {
    if (offer.ownerEmail === currentUser.email) {
      alert("This is your own listing!");
      return;
    }

    setChatLoading(true);
    try {
      const chatsResponse = await fetchWithTimeout(`${API_BASE}/chats`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` },
      }, 8000);

      if (!chatsResponse.ok) throw new Error("Failed to fetch chats");

      const chats = await chatsResponse.json();
      let existingChat = null;
      if (Array.isArray(chats)) {
        existingChat = chats.find((chat: any) =>
          ((chat.user1 === currentUser.email && chat.user2 === offer.ownerEmail) ||
           (chat.user1 === offer.ownerEmail && chat.user2 === currentUser.email)) &&
          chat.offer_id === offer.id
        );
      }

      let chatId = existingChat?.id;

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
        setSelectedOffer(null);
      }
    } catch (error) {
      console.error("Chat error:", error);
      alert("Failed to start chat");
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

  const navItems = [
    { icon: FaHome, label: "Home", active: true, onClick: () => navigate("/") },
    { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress },
    { icon: FaBookOpen, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBookmark, label: "Saved", onClick: () => navigate("/saved") },
    { icon: FaUsers, label: "Following", onClick: () => {} },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
    { icon: FaBell, label: "Notifications", onClick: () => {} },
    { icon: FaStar, label: "Top Picks", onClick: () => {} },
  ];

  const filterButtons = [
    { id: "all" as const, label: "All", icon: <FaFilter size={12} /> },
    { id: "sell" as const, label: "For Sale", icon: <FaDollarSign size={12} /> },
    { id: "exchange" as const, label: "Exchange", icon: <FaExchangeAlt size={12} /> },
    { id: "buy" as const, label: "Wanted", icon: <FaTag size={12} /> },
  ];

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
            transition={{ duration: 0.3, delay: index * 0.03 }}
            whileHover={{ y: -4 }}
            onMouseEnter={() => setHoveredOffer(offer.id)}
            onMouseLeave={() => setHoveredOffer(null)}
            onClick={() => handleCardClick(offer)}
            style={{
              position: "relative",
              cursor: "pointer",
              borderRadius: "16px",
              overflow: "hidden",
              background: GREEN.medium,
              boxShadow: hovered ? "0 12px 24px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease",
              height: `${cardHeight}px`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ position: "relative", height: "60%", overflow: "hidden", background: GREEN.grayLight }}>
              <img
                src={displaySrc}
                alt={offer.bookTitle}
                onError={() => handleImageError(offer.id)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                loading="lazy"
              />

              <div style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                background: `${getTypeColor(offer.type)}`,
                color: "white",
                padding: "4px 8px",
                borderRadius: "8px",
                fontSize: "10px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}>
                {getTypeIcon(offer.type)}
                {getTypeLabel(offer.type)}
              </div>

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
                  background: "rgba(26, 58, 42, 0.8)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaHeart color={liked ? GREEN.accentLight : GREEN.textPrimary} fill={liked ? GREEN.accentLight : "none"} />
              </motion.button>

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
                  background: "rgba(26, 58, 42, 0.8)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaBookmark color={saved ? GREEN.accentLight : GREEN.textPrimary} fill={saved ? GREEN.accentLight : "none"} />
              </motion.button>

              {offer.price && (
                <div style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "8px",
                  background: "rgba(26, 58, 42, 0.9)",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: GREEN.accentLight,
                }}>
                  {formatPrice(offer.price)}
                </div>
              )}
            </div>

            <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column" }}>
              <h3 style={{
                fontSize: "14px",
                fontWeight: "600",
                margin: "0 0 6px",
                color: GREEN.textPrimary,
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
                <p style={{ fontSize: "12px", color: GREEN.textSecondary, margin: "0 0 6px", fontStyle: "italic" }}>
                  {offer.author}
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: GREEN.grayLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: GREEN.textSecondary,
                    fontSize: "10px",
                    fontWeight: "600",
                    border: `1px solid ${GREEN.border}`,
                  }}>
                    {offer.ownerName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "500", color: GREEN.textPrimary }}>
                      {offer.ownerName?.split(" ")[0] || "User"}
                    </div>
                    <div style={{ fontSize: "10px", color: GREEN.textSecondary }}>
                      {offer.distance}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: GREEN.textSecondary }}>
                  <FaHeart size={10} color={liked ? GREEN.accentLight : GREEN.textSecondary} />
                  <span>{Math.floor(Math.random() * 30) + 5}</span>
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
      background: GREEN.dark,
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
          onClick={onProfilePress}
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
        overflow: "hidden",
      }}>
        {/* Header */}
        <header style={{
          padding: "12px 20px",
          background: GREEN.medium,
          borderBottom: `1px solid ${GREEN.border}`,
          flexShrink: 0,
          zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
              <div
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: GREEN.grayLight,
                  border: `1px solid ${GREEN.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {sidebarOpen ? <FaTimes size={16} color={GREEN.textPrimary} /> : <FaBars size={16} color={GREEN.textPrimary} />}
              </div>

              <div style={{ position: "relative", flex: 1 }}>
                <FaSearch
                  size={12}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: GREEN.icon,
                  }}
                />
                <input
                  type="text"
                  placeholder="Search books, authors, genres..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    const handler = setTimeout(() => {
                      setPage(0);
                      fetchOffers(0, false);
                    }, 500);
                    return () => clearTimeout(handler);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 10px 10px 36px",
                    borderRadius: "20px",
                    border: `1px solid ${GREEN.border}`,
                    fontSize: "14px",
                    background: GREEN.grayLight,
                    color: GREEN.textPrimary,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: GREEN.grayLight,
                border: `1px solid ${GREEN.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
              }}>
                <FaBell size={16} color={GREEN.textPrimary} />
                <div style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: GREEN.accent,
                }} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            {filterButtons.map((filter) => (
              <motion.button
                key={filter.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedFilter(filter.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "16px",
                  background: selectedFilter === filter.id ? GREEN.accent : GREEN.grayLight,
                  color: selectedFilter === filter.id ? "white" : GREEN.textPrimary,
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

        {/* Main Feed */}
        <main 
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "12px",
            alignContent: "start",
          }}
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
              handleLoadMore();
            }
          }}
        >
          {loading && page === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                background: GREEN.grayLight,
                borderRadius: "16px",
                height: `${getRandomHeight(i)}px`,
              }} />
            ))
          ) : error ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: GREEN.textPrimary }}>
                Unable to load books
              </h3>
              <p style={{ color: GREEN.textSecondary }}>{error}</p>
              <button onClick={() => fetchOffers(0, false)} style={{
                padding: "10px 20px",
                background: GREEN.accent,
                color: "white",
                border: "none",
                borderRadius: "20px",
                marginTop: "16px",
              }}>
                Try Again
              </button>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: GREEN.textPrimary }}>
                No books found
              </h3>
              <p style={{ color: GREEN.textSecondary }}>
                {searchQuery ? `No results for "${searchQuery}"` : "Be the first to share a book!"}
              </p>
              {onAddPress && (
                <button onClick={onAddPress} style={{
                  padding: "10px 20px",
                  background: GREEN.accent,
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  marginTop: "16px",
                }}>
                  <FaPlus size={12} /> Share a Book
                </button>
              )}
            </div>
          ) : (
            <>
              {filteredOffers.map((offer, index) => (
                <PinterestCard key={`${offer.id}-${index}`} offer={offer} index={index} />
              ))}
              {hasMore && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "20px" }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    style={{
                      padding: "10px 20px",
                      background: GREEN.grayLight,
                      color: GREEN.textPrimary,
                      border: `1px solid ${GREEN.border}`,
                      borderRadius: "20px",
                    }}
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Offer Detail Modal */}
      <AnimatePresence>
        {selectedOffer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDetail}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(4px)",
                zIndex: 2000,
              }}
            />
            <div style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2001,
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  width: "calc(100% - 40px)",
                  maxWidth: "400px",
                  maxHeight: "85vh",
                  background: GREEN.medium,
                  borderRadius: "20px",
                  padding: "20px",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
                  overflowY: "auto",
                  border: `1px solid ${GREEN.border}`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleCloseDetail}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    background: GREEN.accent,
                    border: "none",
                    color: "white",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaTimes />
                </button>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{
                    width: "100%",
                    height: "180px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    marginBottom: "16px",
                    background: GREEN.grayLight,
                  }}>
                    <img
                      src={getImageSource(selectedOffer)}
                      alt={selectedOffer.bookTitle}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 6px", color: GREEN.textPrimary }}>
                    {selectedOffer.bookTitle}
                  </h3>
                  <p style={{ fontSize: "14px", color: GREEN.textSecondary, margin: "0 0 12px", fontStyle: "italic" }}>
                    {selectedOffer.author || "Unknown Author"}
                  </p>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: GREEN.textSecondary,
                    marginBottom: "16px",
                  }}>
                    <FaMapMarkerAlt size={11} />
                    <span>{selectedOffer.distance || "Nearby"}</span>
                    <span>•</span>
                    <span>{selectedOffer.ownerName || selectedOffer.ownerEmail.split("@")[0]}</span>
                  </div>

                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "16px",
                    background: `${getTypeColor(selectedOffer.type)}20`,
                    color: getTypeColor(selectedOffer.type),
                    fontSize: "11px",
                    fontWeight: "600",
                    marginBottom: "16px",
                  }}>
                    {getTypeIcon(selectedOffer.type)}
                    {getTypeLabel(selectedOffer.type)}
                  </div>
                </div>

                {selectedOffer.description && (
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: "600", margin: "0 0 8px", color: GREEN.textPrimary }}>
                      Description
                    </h4>
                    <p style={{ fontSize: "13px", color: GREEN.textSecondary, lineHeight: 1.5 }}>
                      {selectedOffer.description}
                    </p>
                  </div>
                )}

                <div style={{
                  marginBottom: "24px",
                  padding: "16px",
                  background: GREEN.grayLight,
                  borderRadius: "12px",
                  border: `1px solid ${GREEN.border}`,
                }}>
                  <div style={{ fontSize: "11px", color: GREEN.textSecondary, marginBottom: "6px" }}>
                    {selectedOffer.type === "sell" ? "Price" : selectedOffer.type === "exchange" ? "Exchange for" : "Looking for"}
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: GREEN.accentLight }}>
                    {selectedOffer.type === "sell" && selectedOffer.price ? `$${selectedOffer.price}` : 
                     selectedOffer.type === "exchange" ? "Exchange" : "Wanted"}
                  </div>
                </div>

                <button
                  onClick={() => handleChat(selectedOffer)}
                  disabled={chatLoading || selectedOffer.ownerEmail === currentUser.email}
                  style={{
                    width: "100%",
                    background: selectedOffer.ownerEmail === currentUser.email ? GREEN.grayLight : GREEN.accent,
                    color: "white",
                    border: "none",
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: selectedOffer.ownerEmail === currentUser.email ? "not-allowed" : (chatLoading ? "wait" : "pointer"),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {chatLoading ? "Starting..." : selectedOffer.ownerEmail === currentUser.email ? "Your Book" : "Contact Owner"}
                </button>

                <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                  <button onClick={(e) => handleLike(e, selectedOffer.id)} style={{ flex: 1, padding: "10px", background: `${isLiked[selectedOffer.id] ? GREEN.accent : GREEN.grayLight}20`, color: GREEN.textPrimary, border: `1px solid ${GREEN.border}`, borderRadius: "10px" }}>
                    <FaHeart size={12} /> Like
                  </button>
                  <button onClick={(e) => handleSave(e, selectedOffer.id)} style={{ flex: 1, padding: "10px", background: `${isSaved[selectedOffer.id] ? GREEN.accent : GREEN.grayLight}20`, color: GREEN.textPrimary, border: `1px solid ${GREEN.border}`, borderRadius: "10px" }}>
                    <FaBookmarkSolid size={12} /> Save
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}