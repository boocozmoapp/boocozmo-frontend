// src/pages/HomeScreen.tsx - PINTEREST STYLE WITH 2 CARDS PER ROW
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
  FaBook,
  FaEye,
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
  const heights = [280, 320, 360, 300, 340, 380, 310, 350, 290, 330];
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
  const [cardHeights] = useState<Record<number, number>>(() => ({}));

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchOffers = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/offers`, {
        signal: abortControllerRef.current.signal,
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load offers");
      }

      const data = await response.json();
      const rawOffers = Array.isArray(data) ? data : data.offers || [];

      // Process with random heights for Pinterest layout
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processed: Offer[] = rawOffers.map((o: any, index: number) => {
        let imageUrl = o.imageUrl || o.imageBase64 || null;

        if (!imageUrl) {
          // Random book covers with different aspect ratios
          const fallbacks = [
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop",
            "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=450&fit=crop",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h-550&fit=crop",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=650&fit=crop",
            "https://images.unsplash.com/photo-1551029506-0807df4e2031?w=400&h=400&fit=crop",
            "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=700&fit=crop",
            "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=480&fit=crop",
          ];
          imageUrl = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }

        // Set random height for this card
        cardHeights[o.id] = getRandomHeight(index);

        return {
          ...o,
          imageUrl,
        };
      });

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
        setError(err.message || "Failed to load books");
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser.token, cardHeights]);

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

  const handleOfferPress = useCallback((id: number) => navigate(`/offer/${id}`), [navigate]);

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
        const cardHeight = cardHeights[offer.id] || getRandomHeight(index);

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.3,
              delay: index * 0.05 // Stagger animation
            }}
            whileHover={{ 
              y: -8,
              transition: { duration: 0.2 }
            }}
            onMouseEnter={() => setHoveredOffer(offer.id)}
            onMouseLeave={() => setHoveredOffer(null)}
            onClick={() => handleOfferPress(offer.id)}
            style={{
              position: "relative",
              cursor: "pointer",
              borderRadius: "20px",
              overflow: "hidden",
              background: "white",
              boxShadow: hovered 
                ? "0 24px 48px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)"
                : "0 4px 16px rgba(0,0,0,0.08)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              height: `${cardHeight}px`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Image Container - Varies in height */}
            <div style={{ 
              position: "relative", 
              flex: "1 0 auto",
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
                  transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: hovered ? "scale(1.08)" : "scale(1)",
                }}
                loading="lazy"
              />

              {/* Top Badge */}
              <div style={{
                position: "absolute",
                top: "14px",
                left: "14px",
                background: getTypeColor(offer.type),
                color: "white",
                padding: "6px 12px",
                borderRadius: "14px",
                fontSize: "11px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                zIndex: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}>
                {getTypeIcon(offer.type)}
                {getTypeLabel(offer.type)}
              </div>

              {/* Like Button */}
              <motion.button
                onClick={(e) => handleLike(e, offer.id)}
                whileTap={{ scale: 0.8 }}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(8px)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 2,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <motion.div
                  animate={{ scale: liked ? [1, 1.3, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <FaHeart 
                    size={16} 
                    color={liked ? PINTEREST.primary : PINTEREST.textLight}
                    fill={liked ? PINTEREST.primary : "none"}
                  />
                </motion.div>
              </motion.button>

              {/* Price Overlay */}
              {offer.price && !hovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: "absolute",
                    bottom: "14px",
                    right: "14px",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(8px)",
                    padding: "8px 14px",
                    borderRadius: "14px",
                    fontSize: "15px",
                    fontWeight: "800",
                    color: PINTEREST.primary,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    zIndex: 2,
                  }}
                >
                  {formatPrice(offer.price)}
                </motion.div>
              )}

              {/* Hover Overlay */}
              <AnimatePresence>
                {hovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: "20px",
                      zIndex: 1,
                    }}
                  >
                    <div style={{ color: "white" }}>
                      <h3 style={{ 
                        fontSize: "18px", 
                        fontWeight: "800", 
                        margin: "0 0 10px",
                        lineHeight: 1.3,
                        letterSpacing: "-0.3px",
                      }}>
                        {offer.bookTitle}
                      </h3>
                      
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "14px",
                        marginBottom: "14px",
                      }}>
                        <span style={{ 
                          fontSize: "16px", 
                          fontWeight: "800",
                          background: PINTEREST.primary,
                          padding: "6px 14px",
                          borderRadius: "16px",
                          boxShadow: "0 4px 12px rgba(230, 0, 35, 0.3)",
                        }}>
                          {formatPrice(offer.price)}
                        </span>
                        {offer.author && (
                          <span style={{ fontSize: "14px", opacity: 0.9 }}>
                            by {offer.author}
                          </span>
                        )}
                      </div>

                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "10px",
                        fontSize: "13px",
                        opacity: 0.8 
                      }}>
                        <FaBook size={12} />
                        <span>{offer.genre || "Fiction"}</span>
                        <span style={{ opacity: 0.5 }}>•</span>
                        <span>{offer.distance || "Nearby"}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Content (Always visible) */}
            <div style={{ 
              padding: "18px", 
              background: "white",
              borderTop: `1px solid ${PINTEREST.border}20`,
            }}>
              <h3 style={{ 
                fontSize: "16px", 
                fontWeight: "700", 
                margin: "0 0 8px",
                color: PINTEREST.textDark,
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minHeight: "44px",
              }}>
                {offer.bookTitle}
              </h3>
              
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginTop: "10px" 
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${PINTEREST.primary}20, ${PINTEREST.light}20)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: PINTEREST.primary,
                    fontSize: "14px",
                    fontWeight: "600",
                    border: `2px solid ${PINTEREST.primary}30`,
                  }}>
                    {offer.ownerName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: PINTEREST.textDark }}>
                      {offer.ownerName?.split(" ")[0] || "User"}
                    </div>
                    <div style={{ fontSize: "11px", color: PINTEREST.textLight, marginTop: "2px" }}>
                      {offer.distance || "Local"}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px",
                  fontSize: "12px",
                  color: PINTEREST.textLight
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "5px",
                    padding: "4px 8px",
                    background: liked ? `${PINTEREST.primary}10` : PINTEREST.grayLight,
                    borderRadius: "12px",
                  }}>
                    <FaHeart size={12} color={liked ? PINTEREST.primary : PINTEREST.textLight} />
                    <span style={{ fontWeight: "600" }}>{Math.floor(Math.random() * 50) + 10}</span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "5px",
                    padding: "4px 8px",
                    background: PINTEREST.grayLight,
                    borderRadius: "12px",
                  }}>
                    <FaEye size={12} />
                    <span style={{ fontWeight: "600" }}>{Math.floor(Math.random() * 200) + 50}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      }),
    [getImageSource, hoveredOffer, isLiked, cardHeights, handleOfferPress, handleLike]
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
        overflow: "hidden",
      }}>
        {/* Header */}
        <header style={{
          padding: "16px 24px",
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 900,
          borderBottom: `1px solid ${PINTEREST.border}`,
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            marginBottom: "16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
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
                {sidebarOpen ? <FaTimes size={18} /> : <FaEllipsisH size={18} />}
              </motion.button>

              {/* Search */}
              <div style={{ position: "relative", flex: 1, maxWidth: "500px" }}>
                <FaSearch
                  size={14}
                  style={{
                    position: "absolute",
                    left: "16px",
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
                    padding: "14px 14px 14px 44px",
                    borderRadius: "24px",
                    border: `1px solid ${PINTEREST.border}`,
                    fontSize: "15px",
                    background: PINTEREST.grayLight,
                    color: PINTEREST.textDark,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Notifications */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
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
                <FaBell size={18} />
                <div style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "8px",
                  height: "8px",
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
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "4px",
            scrollbarWidth: "none",
          }}>
            {filterButtons.map((filter) => (
              <motion.button
                key={filter.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedFilter(filter.id)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "20px",
                  background: selectedFilter === filter.id ? PINTEREST.primary : PINTEREST.hoverBg,
                  color: selectedFilter === filter.id ? "white" : PINTEREST.textDark,
                  fontSize: "13px",
                  fontWeight: selectedFilter === filter.id ? "700" : "600",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
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

        {/* Main Feed - Pinterest Masonry Layout with 2 cards per row */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "20px",
          alignContent: "start",
        }}>
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: PINTEREST.grayLight,
                  borderRadius: "20px",
                  height: `${getRandomHeight(i)}px`,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))
          ) : error ? (
            <div style={{ 
              gridColumn: "1 / -1", 
              textAlign: "center", 
              padding: "60px",
              background: "white",
              borderRadius: "20px",
              margin: "40px",
            }}>
              <div style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: PINTEREST.redLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "40px",
                color: PINTEREST.primary,
              }}>
                <FaBookOpen />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: PINTEREST.textDark, marginBottom: "8px" }}>
                Unable to load books
              </h3>
              <p style={{ color: PINTEREST.textLight, marginBottom: "24px", maxWidth: "400px", margin: "0 auto" }}>
                {error}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={fetchOffers}
                style={{
                  padding: "14px 28px",
                  background: PINTEREST.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "24px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(230, 0, 35, 0.3)",
                }}
              >
                Try Again
              </motion.button>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div style={{ 
              gridColumn: "1 / -1", 
              textAlign: "center", 
              padding: "80px 40px",
              background: "white",
              borderRadius: "20px",
              margin: "40px",
            }}>
              <div style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: PINTEREST.redLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: "48px",
                color: PINTEREST.primary,
              }}>
                <FaBookOpen />
              </div>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: PINTEREST.textDark, marginBottom: "12px" }}>
                No books found
              </h3>
              <p style={{ 
                color: PINTEREST.textLight, 
                fontSize: "16px",
                marginBottom: "32px",
                maxWidth: "400px",
                margin: "0 auto",
                lineHeight: 1.5,
              }}>
                {searchQuery 
                  ? `No results for "${searchQuery}"`
                  : "Be the first to share a book in your community!"
                }
              </p>
              {onAddPress && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={onAddPress}
                  style={{
                    padding: "16px 32px",
                    background: PINTEREST.primary,
                    color: "white",
                    border: "none",
                    borderRadius: "24px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    margin: "0 auto",
                    boxShadow: "0 4px 20px rgba(230, 0, 35, 0.3)",
                  }}
                >
                  <FaPlus /> Share a Book
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
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${PINTEREST.grayLight};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${PINTEREST.border};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${PINTEREST.textLight};
        }
        
        input:focus {
          outline: none;
          border-color: ${PINTEREST.primary} !important;
          box-shadow: 0 0 0 2px ${PINTEREST.primary}20 !important;
        }
        
        /* Hide scrollbar for filter tabs */
        div::-webkit-scrollbar {
          display: none;
        }
        
        /* Pinterest-like staggered loading */
        @keyframes cardAppear {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}