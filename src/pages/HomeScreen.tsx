// src/pages/HomeScreen.tsx - SIMPLIFIED PINTEREST STYLE
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
  const [isLiked, setIsLiked] = useState<Record<number, boolean>>({});

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchOffers = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // Try with authorization first
      let response;
      try {
        response = await fetch(`${API_BASE}/offers`, {
          signal: abortControllerRef.current.signal,
          headers: {
            "Authorization": `Bearer ${currentUser.token}`,
            "Cache-Control": "no-cache",
          },
        });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (authError) {
        // If fails with auth, try without it
        response = await fetch(`${API_BASE}/offers`, {
          signal: abortControllerRef.current.signal,
          headers: {
            "Cache-Control": "no-cache",
          },
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load offers");
      }

      const data = await response.json();
      console.log("API Response:", data);
      
      // Handle different response formats
      let rawOffers = [];
      if (Array.isArray(data)) {
        rawOffers = data;
      } else if (data.offers && Array.isArray(data.offers)) {
        rawOffers = data.offers;
      } else if (data.data && Array.isArray(data.data)) {
        rawOffers = data.data;
      }
      
      console.log("Raw offers count:", rawOffers.length);

      // Process offers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processed: Offer[] = rawOffers.map((o: any, index: number) => {
        let imageUrl = o.imageUrl || o.imageBase64 || null;

        if (!imageUrl) {
          // Simple book covers
          const fallbacks = [
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop",
            "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=300&h=380&fit=crop",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h-420&fit=crop",
          ];
          imageUrl = fallbacks[Math.floor(Math.random() * fallbacks.length)];
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
          description: o.description || "",
          genre: o.genre || "Fiction",
          author: o.author || "Unknown Author",
        };
      });

      console.log("Processed offers:", processed.length);
      setOffers(processed);
      
      // Initialize random likes
      const likes: Record<number, boolean> = {};
      processed.forEach(offer => {
        likes[offer.id] = Math.random() > 0.5;
      });
      setIsLiked(likes);
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

  const getImageSource = useCallback((offer: Offer) => offer.imageUrl || "", []);

  const handleLike = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setIsLiked(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sell": return "Sell";
      case "exchange": return "Trade";
      case "buy": return "Want";
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

  const filterButtons = [
    { id: "all" as const, label: "All", icon: <FaFilter size={12} /> },
    { id: "sell" as const, label: "For Sale", icon: <FaDollarSign size={12} /> },
    { id: "exchange" as const, label: "Trade", icon: <FaExchangeAlt size={12} /> },
    { id: "buy" as const, label: "Wanted", icon: <FaTag size={12} /> },
  ];

  const PinterestCard = useMemo(
    () =>
      memo(({ offer, index }: { offer: Offer; index: number }) => {
        const img = getImageSource(offer);
        const hovered = hoveredOffer === offer.id;
        const liked = isLiked[offer.id] || false;
        const cardHeight = getRandomHeight(index);

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
                src={img}
                alt={offer.bookTitle}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                loading="lazy"
              />

              {/* Simple Type Badge */}
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
                <FaHeart 
                  color={liked ? PINTEREST.primary : PINTEREST.textLight}
                  fill={liked ? PINTEREST.primary : "none"}
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
    [getImageSource, hoveredOffer, isLiked, handleLike]
  );

  const navItems = [
    { icon: FaHome, label: "Home", active: true, onClick: () => navigate("/") },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBookOpen, label: "My Books", onClick: () => navigate("/profile") },
    { icon: FaBookmark, label: "Saved", onClick: () => {} },
    { icon: FaUsers, label: "Following", onClick: () => {} },
    { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
    { icon: FaBell, label: "Notifications", onClick: () => {} },
    { icon: FaStar, label: "Top Picks", onClick: () => {} },
  ];

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
                {sidebarOpen ? <FaTimes size={16} /> : <FaEllipsisH size={16} />}
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
                <FaBell size={16} />
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
          minHeight: 0, // Important for scrollable container
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
        
        /* Hide scrollbar for filter tabs */
        div::-webkit-scrollbar {
          display: none;
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
}