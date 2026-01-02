 
// src/pages/HomeScreen.tsx - PINTEREST-STYLE REDESIGN (Fully Fixed & Perfected)
import { useEffect, useState, useCallback, useMemo, useRef} from "react";
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
  FaChevronDown,
  FaTimes,
  FaFilter,
  FaDollarSign,
  FaExchangeAlt,
  FaTag,
  FaEllipsisH,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import React from "react";

const API_BASE = "https://boocozmo-api.onrender.com";

// Pinterest Colors
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
  overlay: "rgba(0, 0, 0, 0.7)",
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
  likes?: number;
  saved?: boolean;
};

type Props = {
  currentUser: { email: string; name: string; id: string };
  onAddPress?: () => void;
  onProfilePress?: () => void;
  onMapPress?: () => void;
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
  const [selectedFilter] = useState<"all" | "sell" | "exchange" | "buy">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [, setLastRefresh] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredOffer, setHoveredOffer] = useState<number | null>(null);

  // Refs
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitializedRef = useRef(false);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch offers
  const fetchOffers = useCallback(async (silent = false, force = false) => {
    if ((loading || refreshing) && !force) return;

    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/offers`, {
        signal: abortControllerRef.current.signal,
        headers: { "Cache-Control": "no-cache" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch offers`);
      }

      const responseData = await response.json();

      // Handle both old (array) and new ({ offers, total }) formats
      const rawOffers = Array.isArray(responseData)
        ? responseData
        : responseData.offers || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedOffers = rawOffers.map((offer: any): Offer => {
        let imageUrl = offer.imageUrl || null;

        if (offer.imageUrl?.startsWith("data:image")) {
          imageUrl = offer.imageUrl;
        } else if (offer.imageBase64) {
          imageUrl = offer.imageBase64;
        } else if (!imageUrl) {
          // Random fallback book covers
          const bookCovers = [
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop",
            "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=600&fit=crop",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
            "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
            "https://images.unsplash.com/photo-1551029506-0807df4e2031?w=400&h=600&fit=crop",
            "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=600&fit=crop",
            "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop",
          ];
          const randomIndex = Math.floor(Math.random() * bookCovers.length);
          imageUrl = bookCovers[randomIndex];
        }

        return {
          ...offer,
          imageUrl,
          lastUpdated: new Date().toISOString(),
          likes: Math.floor(Math.random() * 50),
          saved: Math.random() > 0.7,
        };
      });

      if (isMountedRef.current) {
        setOffers(processedOffers);
        setLastRefresh(new Date());
        setError(null);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("Error fetching offers:", err);
      if (isMountedRef.current && !silent) {
        setError(err.message || "Failed to load offers");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      abortControllerRef.current = null;
    }
  }, [loading, refreshing]);

  // Initial load
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchOffers();
    }
  }, [fetchOffers]);

  // Filter offers
  const filteredOffers = useMemo(() => {
    let result = offers;

    if (selectedFilter !== "all") {
      result = result.filter((offer) => offer.type === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (offer) =>
          offer.bookTitle.toLowerCase().includes(query) ||
          offer.description?.toLowerCase().includes(query) ||
          offer.author?.toLowerCase().includes(query) ||
          offer.genre?.toLowerCase().includes(query) ||
          offer.exchangeBook?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, selectedFilter, offers]);

  // Helper functions
  const getImageSource = useCallback((offer: Offer): string => {
    return (
      offer.imageUrl ||
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop"
    );
  }, []);

  const handleOfferPress = useCallback(
    (offerId: number) => {
      navigate(`/offer/${offerId}`);
    },
    [navigate]
  );

  const handleSave = useCallback(
    (offerId: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setOffers((prev) =>
        prev.map((offer) =>
          offer.id === offerId ? { ...offer, saved: !offer.saved } : offer
        )
      );
    },
    []
  );

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "sell":
        return "For Sale";
      case "exchange":
        return "Exchange";
      case "buy":
        return "Wanted";
      default:
        return "";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sell":
        return <FaDollarSign size={10} />;
      case "exchange":
        return <FaExchangeAlt size={10} />;
      case "buy":
        return <FaTag size={10} />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case "sell":
        return PINTEREST.primary;
      case "exchange":
        return "#00A86B";
      case "buy":
        return "#1D9BF0";
      default:
        return PINTEREST.textLight;
    }
  };

  const formatPrice = (price: number | null): string => {
    if (!price) return "Free";
    return `$${price.toFixed(2)}`;
  };

  // Pinterest Card Component
  const PinterestCard = useMemo(
    () =>
      React.memo(({ offer }: { offer: Offer }) => {
        const imageSrc = getImageSource(offer);
        const isHovered = hoveredOffer === offer.id;

        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            onMouseEnter={() => setHoveredOffer(offer.id)}
            onMouseLeave={() => setHoveredOffer(null)}
            style={{
              position: "relative",
              cursor: "pointer",
              borderRadius: "16px",
              overflow: "hidden",
              marginBottom: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "all 0.2s ease",
            }}
            onClick={() => handleOfferPress(offer.id)}
          >
            {/* Book Image */}
            <div style={{ position: "relative", paddingTop: "150%" }}>
              <img
                src={imageSrc}
                alt={offer.bookTitle}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: isHovered ? "brightness(0.9)" : "brightness(1)",
                  transition: "filter 0.3s ease",
                }}
                loading="lazy"
              />

              {/* Hover Overlay */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      padding: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleSave(offer.id, e)}
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: PINTEREST.primary,
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        }}
                      >
                        <FaBookmark size={16} />
                      </motion.button>
                    </div>

                    <div style={{ color: "white" }}>
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          margin: "0 0 4px",
                          lineHeight: 1.2,
                        }}
                      >
                        {offer.bookTitle}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          {offer.price && (
                            <div style={{ fontSize: "18px", fontWeight: "700" }}>
                              {formatPrice(offer.price)}
                            </div>
                          )}
                          {offer.author && (
                            <div style={{ fontSize: "12px", opacity: 0.9 }}>
                              by {offer.author}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            background: getTypeColor(offer.type),
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {getTypeIcon(offer.type)}
                          {getTypeLabel(offer.type)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Non-hover minimal info */}
              {!isHovered && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                    color: "white",
                    padding: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          margin: "0 0 2px",
                          lineHeight: 1.2,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {offer.bookTitle}
                      </h3>
                      {offer.price && (
                        <div style={{ fontSize: "16px", fontWeight: "700" }}>
                          {formatPrice(offer.price)}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        background: getTypeColor(offer.type),
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: "10px",
                        fontSize: "9px",
                        fontWeight: "600",
                      }}
                    >
                      {getTypeLabel(offer.type).charAt(0)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      }),
    [handleOfferPress, handleSave, getImageSource, hoveredOffer]
  );

  // Sidebar Navigation
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
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: PINTEREST.bg,
        display: "flex",
        fontFamily: "'Inter', -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
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
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
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
              }}
            >
              B
            </div>
            <span style={{ fontSize: "20px", fontWeight: "700", color: PINTEREST.primary }}>
              Boocozmo
            </span>
          </div>
        </div>

        {/* User */}
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
          <div
            style={{
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
            }}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: PINTEREST.textDark }}>
              {currentUser.name.split(" ")[0]}
            </div>
            <div style={{ fontSize: "12px", color: PINTEREST.textLight }}>View profile</div>
          </div>
        </motion.div>

        {/* Nav */}
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

        {/* Add Book */}
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
      <div
        style={{
          flex: 1,
          marginLeft: sidebarOpen ? "240px" : "0",
          transition: "margin-left 0.3s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: "12px 20px",
            background: PINTEREST.bg,
            position: "sticky",
            top: 0,
            zIndex: 50,
            borderBottom: `1px solid ${PINTEREST.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
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

            <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
              <FaSearch
                size={14}
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: PINTEREST.icon,
                }}
              />
              <input
                type="text"
                placeholder="Search books, authors, genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  borderRadius: "24px",
                  border: `1px solid ${PINTEREST.border}`,
                  fontSize: "14px",
                  background: PINTEREST.grayLight,
                  color: PINTEREST.textDark,
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                background: PINTEREST.hoverBg,
                border: `1px solid ${PINTEREST.border}`,
                color: PINTEREST.textDark,
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                borderRadius: "20px",
              }}
            >
              <FaFilter size={12} />
              All Books
              <FaChevronDown size={10} />
            </motion.button>

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
              <div
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: PINTEREST.primary,
                }}
              />
            </motion.button>
          </div>
        </header>

        {/* Masonry Grid */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px",
            alignContent: "start",
          }}
        >
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: PINTEREST.grayLight,
                  borderRadius: "16px",
                  height: `${Math.random() * 100 + 250}px`,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))
          ) : error ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
              <h3 style={{ color: PINTEREST.textDark, fontSize: "18px" }}>Unable to load books</h3>
              <p style={{ color: PINTEREST.textLight, fontSize: "14px" }}>{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchOffers(false, true)}
                style={{
                  padding: "12px 24px",
                  background: PINTEREST.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "24px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginTop: "16px",
                }}
              >
                Try Again
              </motion.button>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
              <div
                style={{
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
                }}
              >
                <FaBookOpen />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: PINTEREST.textDark }}>
                {searchQuery ? "No matches found" : "No books available"}
              </h3>
              <p style={{ fontSize: "14px", color: PINTEREST.textLight, maxWidth: "300px", margin: "16px auto" }}>
                {searchQuery ? "Try adjusting your search" : "Be the first to share a book"}
              </p>
              {!searchQuery && onAddPress && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onAddPress}
                  style={{
                    padding: "14px 28px",
                    background: PINTEREST.primary,
                    color: "white",
                    border: "none",
                    borderRadius: "24px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    margin: "0 auto",
                  }}
                >
                  <FaPlus />
                  Share First Book
                </motion.button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {filteredOffers.map((offer) => (
                <PinterestCard key={offer.id} offer={offer} />
              ))}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Global Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        * { -webkit-tap-highlight-color: transparent; }
        input:focus { outline: none; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${PINTEREST.border}; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: ${PINTEREST.textLight}; }
        @media (max-width: 768px) {
          aside { display: none; }
          main { grid-template-columns: repeat(2, 1fr) !important; padding: 12px !important; }
        }
        @media (min-width: 1200px) { main { grid-template-columns: repeat(5, 1fr) !important; } }
        @media (min-width: 1600px) { main { grid-template-columns: repeat(6, 1fr) !important; } }
      `}</style>
    </div>
  );
}