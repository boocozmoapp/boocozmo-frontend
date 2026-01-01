// src/pages/HomeScreen.tsx - FIXED DOUBLE LOADING
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaBookOpen,
  FaMapMarkedAlt,
  FaPlus,
  FaComments,
  FaUser,
  FaHeart,
  FaShareAlt,
  FaFilter,
  FaMapMarkerAlt,
  FaExchangeAlt,
  FaDollarSign,
  FaTag,
  FaSync,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import React from "react";

const API_BASE = "https://boocozmo-api.onrender.com";

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
};

type Props = {
  currentUser: { email: string; name: string; id: string };
  onAddPress?: () => void;
  onProfilePress?: () => void;
  onMapPress?: () => void;
};

// Bronze color palette
const BRONZE = {
  primary: "#CD7F32",
  light: "#E6B17E",
  dark: "#B87333",
  pale: "#F5E7D3",
  shimmer: "#FFD700",
  bgLight: "#FDF8F3",
  bgDark: "#F5F0E6",
  textDark: "#2C1810",
  textLight: "#5D4037",
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
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "sell" | "exchange" | "buy"
  >("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Refs for timers and data - FIXED TYPES
  const refreshTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitializedRef = useRef(false); // NEW: Prevent double initialization

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Get user location once - FIXED: Don't trigger re-fetch
  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (isMountedRef.current) {
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            }
          },
          () => {
            if (isMountedRef.current) {
              setUserLocation({ lat: 40.7128, lng: -74.006 });
            }
          },
          { 
            timeout: 5000, 
            maximumAge: 600000, // Cache for 10 minutes
            enableHighAccuracy: false // Faster, less battery
          }
        );
      } else {
        setUserLocation({ lat: 40.7128, lng: -74.006 });
      }
    };
    
    if (!userLocation) {
      getLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - runs only once

  // Optimized fetch function
  const fetchOffers = useCallback(async (silent = false, force = false) => {
    // Don't fetch if already loading and not forced
    if ((loading || refreshing) && !force) return;
    
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/offers`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) throw new Error("Failed to fetch offers");
      const data = await response.json();

      // Process offers efficiently
      const processedOffers = data.map((offer: Offer) => {
        let imageUrl = offer.imageUrl;
        
        if (offer.imageUrl?.startsWith('data:image')) {
          imageUrl = offer.imageUrl;
        } else if (offer.imageBase64) {
          imageUrl = offer.imageBase64;
        }

        let distance = null;
        if (userLocation && offer.latitude && offer.longitude) {
          const dist = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            offer.latitude,
            offer.longitude
          );
          distance = dist < 1 
            ? `${Math.round(dist * 1000)}m`
            : `${dist.toFixed(1)}km`;
        }

        return {
          ...offer,
          imageUrl,
          distance,
          lastUpdated: new Date().toISOString()
        };
      });

      if (isMountedRef.current) {
        setOffers(processedOffers);
        setLastRefresh(new Date());
        setError(null); // Clear any previous errors
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Error fetching offers:", err);
      if (isMountedRef.current && !silent) {
        setError(err instanceof Error ? err.message : "Failed to load offers");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      abortControllerRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, loading, refreshing]); // Include loading/refreshing in deps

  // Initial load - FIXED: Only run once
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchOffers();
    }
  }, [fetchOffers]);

  // Silent background refresh every 30 seconds - FIXED: Use setTimeout instead of setInterval
  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      
      refreshTimerRef.current = window.setTimeout(() => {
        if (document.visibilityState === 'visible' && !refreshing && !loading) {
          fetchOffers(true);
        }
        scheduleRefresh(); // Schedule next refresh
      }, 30000);
    };

    // Start the refresh cycle
    scheduleRefresh();

    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [fetchOffers, refreshing, loading]);

  // Optimized filtering with useMemo
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

  // Memoized distance calculation
  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Memoized image source
  const getImageSource = useCallback((offer: Offer): string => {
    if (offer.imageUrl?.startsWith('data:image')) {
      return offer.imageUrl;
    }
    if (offer.imageBase64) {
      return offer.imageBase64;
    }
    return offer.imageUrl || "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=500&fit=crop";
  }, []);

  // Memoized event handlers
  const handleOfferPress = useCallback((offerId: number) => {
    navigate(`/offer/${offerId}`);
  }, [navigate]);

  const handleLike = useCallback(async (offerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic update
    setOffers(prev => prev.map(offer => 
      offer.id === offerId 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? { ...offer, liked: !(offer as any).liked }
        : offer
    ));
  }, []);

  const handleShare = useCallback(async (offerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this book!",
          text: "I found this great book on BookSphere",
          url: `${window.location.origin}/offer/${offerId}`,
        });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        console.log("Share cancelled");
      }
    }
  }, []);

  const handleChat = useCallback(async (offer: Offer, e: React.MouseEvent) => {
    e.stopPropagation();
    if (offer.ownerEmail === currentUser.email) {
      navigate(`/offer/${offer.id}`);
      return;
    }
    navigate(`/offer/${offer.id}`);
  }, [currentUser.email, navigate]);

  // Helper functions
  const getTypeColor = (type: string): string => {
    switch(type) {
      case 'sell': return BRONZE.primary;
      case 'exchange': return BRONZE.dark;
      case 'buy': return '#8B4513';
      default: return BRONZE.light;
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'sell': return <FaDollarSign size={10} />;
      case 'exchange': return <FaExchangeAlt size={10} />;
      case 'buy': return <FaTag size={10} />;
      default: return null;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Pull to refresh handler
  const handleRefresh = useCallback(() => {
    if (!refreshing) {
      fetchOffers(false, true); // Force refresh
    }
  }, [fetchOffers, refreshing]);

  // Filter buttons
  const filterButtons = useMemo(() => [
    { id: "all" as const, label: "All", icon: <FaFilter /> },
    { id: "sell" as const, label: "For Sale", icon: <FaDollarSign /> },
    { id: "exchange" as const, label: "Exchange", icon: <FaExchangeAlt /> },
    { id: "buy" as const, label: "Wanted", icon: <FaTag /> },
  ], []);

  // Memoized OfferCard component - MOVED OUTSIDE
  const OfferCard = useMemo(() => 
    React.memo(({ offer }: { offer: Offer }) => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "18px",
          marginBottom: "16px",
          boxShadow: "0 6px 24px rgba(205, 127, 50, 0.08)",
          border: `1px solid ${BRONZE.pale}`,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          willChange: "transform",
        }}
        onClick={() => handleOfferPress(offer.id)}
      >
        {/* Bronze accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "4px",
            background: `linear-gradient(90deg, ${BRONZE.primary}, ${BRONZE.light})`,
          }}
        />

        <div style={{ display: "flex", gap: "18px" }}>
          {/* Image Container */}
          <div
            style={{
              width: "100px",
              height: "140px",
              borderRadius: "14px",
              overflow: "hidden",
              flexShrink: 0,
              border: `2px solid ${BRONZE.pale}`,
              position: "relative",
              background: BRONZE.bgDark,
            }}
          >
            <img
              src={getImageSource(offer)}
              alt={offer.bookTitle}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
              loading="lazy"
              width={100}
              height={140}
            />
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            {/* Type badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "20px",
                background: `${getTypeColor(offer.type)}15`,
                color: getTypeColor(offer.type),
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "10px",
                border: `1px solid ${getTypeColor(offer.type)}30`,
              }}
            >
              {getTypeIcon(offer.type)}
              {offer.type.charAt(0).toUpperCase() + offer.type.slice(1)}
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                margin: "0 0 4px",
                color: BRONZE.textDark,
                lineHeight: 1.3,
              }}
            >
              {offer.bookTitle}
            </h3>

            {/* Author */}
            {offer.author && (
              <p
                style={{
                  fontSize: "14px",
                  color: BRONZE.textLight,
                  opacity: 0.9,
                  margin: "0 0 6px",
                  fontStyle: "italic",
                }}
              >
                {offer.author}
              </p>
            )}

            {/* Details */}
            <div style={{ marginBottom: "10px" }}>
              {offer.condition && (
                <span
                  style={{
                    fontSize: "13px",
                    color: BRONZE.primary,
                    fontWeight: 500,
                    marginRight: "12px",
                  }}
                >
                  {offer.condition}
                </span>
              )}
              
              {offer.type === "sell" && offer.price && (
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: BRONZE.primary,
                  }}
                >
                  ${offer.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Exchange info */}
            {offer.type === "exchange" && offer.exchangeBook && (
              <div
                style={{
                  fontSize: "14px",
                  color: BRONZE.dark,
                  fontWeight: 500,
                  marginBottom: "8px",
                  padding: "6px 10px",
                  background: `${BRONZE.dark}08`,
                  borderRadius: "8px",
                  borderLeft: `3px solid ${BRONZE.dark}`,
                }}
              >
                For: {offer.exchangeBook}
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
                color: BRONZE.textLight,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaMapMarkerAlt size={10} />
                <span>{offer.distance || "Nearby"}</span>
                {offer.ownerName && (
                  <span style={{ opacity: 0.7 }}>• {offer.ownerName}</span>
                )}
              </div>
              
              {offer.lastUpdated && (
                <span style={{ opacity: 0.5, fontSize: "11px" }}>
                  {formatTimeAgo(offer.lastUpdated)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "18px",
            paddingTop: "16px",
            borderTop: `1px solid ${BRONZE.pale}`,
          }}
        >
          {[
            { icon: FaHeart, label: "Like", onClick: (e: React.MouseEvent) => handleLike(offer.id, e), color: BRONZE.primary },
            { icon: FaComments, label: "Chat", onClick: (e: React.MouseEvent) => handleChat(offer, e), color: BRONZE.dark },
            { icon: FaShareAlt, label: "Share", onClick: (e: React.MouseEvent) => handleShare(offer.id, e), color: BRONZE.light },
          ].map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                background: `${action.color}08`,
                color: action.color,
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${action.color}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${action.color}08`;
              }}
            >
              <action.icon size={14} />
              {action.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    ))
  , [handleOfferPress, handleLike, handleChat, handleShare, getImageSource]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: BRONZE.bgLight,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "60px 20px 20px 20px",
          background: `linear-gradient(135deg, ${BRONZE.dark} 0%, ${BRONZE.primary} 100%)`,
          color: "white",
          position: "sticky",
          top: 0,
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        {/* Welcome & Refresh */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: "700",
                margin: "0 0 4px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontFamily: "'Merriweather', serif",
              }}
            >
              <FaBookOpen />
              Welcome, {currentUser.name.split(' ')[0]}!
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", opacity: 0.9 }}>
              <span>Discover books near you</span>
              {lastRefresh && (
                <span style={{ opacity: 0.7, fontSize: "12px" }}>
                  • Updated {formatTimeAgo(lastRefresh.toISOString())}
                </span>
              )}
            </div>
          </div>
          
          <motion.button
            whileTap={{ rotate: 180 }}
            onClick={handleRefresh}
            disabled={refreshing || loading}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: refreshing || loading ? "not-allowed" : "pointer",
              opacity: (refreshing || loading) ? 0.5 : 1,
            }}
          >
            <FaSync className={refreshing ? "spin" : ""} />
          </motion.button>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <div
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              color: BRONZE.primary,
              zIndex: 1,
            }}
          >
            <FaSearch size={16} />
          </div>
          <input
            type="text"
            placeholder="Search books, authors, genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "16px 16px 16px 48px",
              borderRadius: "14px",
              border: "none",
              fontSize: "16px",
              background: "white",
              boxShadow: "0 8px 32px rgba(205, 127, 50, 0.12)",
              fontFamily: "inherit",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(205, 127, 50, 0.2)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(205, 127, 50, 0.12)";
            }}
          />
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "6px",
            scrollbarWidth: "none",
          }}
        >
          {filterButtons.map((filter) => (
            <motion.button
              key={filter.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedFilter(filter.id)}
              style={{
                padding: "10px 18px",
                borderRadius: "24px",
                border: `2px solid ${
                  selectedFilter === filter.id
                    ? "white"
                    : "rgba(255,255,255,0.25)"
                }`,
                background:
                  selectedFilter === filter.id ? "white" : "rgba(255,255,255,0.1)",
                color: selectedFilter === filter.id ? BRONZE.primary : "white",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                backdropFilter: "blur(10px)",
              }}
            >
              {filter.icon}
              {filter.label}
            </motion.button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          paddingBottom: "80px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Refresh indicator - only show when refreshing (not initial load) */}
        {refreshing && !loading && (
          <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                border: `3px solid ${BRONZE.primary}30`,
                borderTopColor: BRONZE.primary,
                borderRadius: "50%",
                margin: "0 auto",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ fontSize: "14px", color: BRONZE.textLight, marginTop: "8px" }}>
              Refreshing...
            </p>
          </div>
        )}

        {/* Results count - only show when not loading */}
        {!loading && !error && filteredOffers.length > 0 && (
          <div style={{ marginBottom: "16px", padding: "0 4px" }}>
            <p style={{ fontSize: "14px", color: BRONZE.textLight, fontWeight: 500 }}>
              {filteredOffers.length} {filteredOffers.length === 1 ? 'book' : 'books'} found
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>
        )}

        {/* Content states */}
        {loading && !refreshing ? ( // Show loading only on initial load
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                border: `4px solid ${BRONZE.primary}20`,
                borderTopColor: BRONZE.primary,
                borderRadius: "50%",
                margin: "0 auto 24px",
                animation: "spin 1s ease-in-out infinite",
              }}
            />
            <p style={{ color: BRONZE.primary, fontSize: "16px", fontWeight: 500 }}>
              Loading your books...
            </p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "48px", color: BRONZE.light, marginBottom: "16px" }}>
              📚
            </div>
            <h3 style={{ color: BRONZE.dark, marginBottom: "8px", fontSize: "18px" }}>
              Something went wrong
            </h3>
            <p style={{ color: BRONZE.textLight, marginBottom: "24px", fontSize: "14px" }}>
              {error}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchOffers(false, true)}
              style={{
                padding: "14px 28px",
                background: BRONZE.primary,
                color: "white",
                border: "none",
                borderRadius: "14px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: `0 6px 20px ${BRONZE.primary}40`,
              }}
            >
              Try Again
            </motion.button>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "64px", color: BRONZE.light, marginBottom: "20px", opacity: 0.5 }}>
              📖
            </div>
            <h3 style={{ color: BRONZE.dark, marginBottom: "8px", fontSize: "20px", fontWeight: "600" }}>
              {searchQuery ? 'No matches found' : 'No books yet'}
            </h3>
            <p style={{ color: BRONZE.textLight, marginBottom: "28px", fontSize: "15px", maxWidth: "300px", margin: "0 auto 28px", lineHeight: 1.5 }}>
              {searchQuery
                ? "Try a different search term or browse all books"
                : "Be the first to share a book in your area!"}
            </p>
            {!searchQuery && onAddPress && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAddPress}
                style={{
                  padding: "16px 32px",
                  background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
                  color: "white",
                  border: "none",
                  borderRadius: "14px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: `0 8px 24px ${BRONZE.primary}50`,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  margin: "0 auto",
                }}
              >
                <FaPlus />
                Post Your First Book
              </motion.button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </AnimatePresence>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "16px 0",
          borderTop: `1px solid ${BRONZE.pale}`,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          position: "fixed",
          bottom: 0,
          width: "100%",
          zIndex: 100,
          boxShadow: "0 -8px 32px rgba(205, 127, 50, 0.08)",
        }}
      >
        {[
          { icon: FaBookOpen, label: "Home", active: true, onClick: () => navigate("/") },
          { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress },
          { icon: FaPlus, label: "Add", onClick: onAddPress, isAdd: true },
          { icon: FaComments, label: "Chat", onClick: () => navigate("/chat") },
          { icon: FaUser, label: "Profile", onClick: onProfilePress },
        ].map((item) => (
          <motion.button
            key={item.label}
            whileTap={{ scale: 0.9 }}
            onClick={item.onClick}
            style={{
              background: item.isAdd 
                ? `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`
                : "transparent",
              border: "none",
              color: item.active && !item.isAdd ? BRONZE.primary : BRONZE.textLight,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontSize: item.isAdd ? "26px" : "22px",
              cursor: "pointer",
              padding: item.isAdd ? "0" : "8px",
              width: item.isAdd ? "64px" : "auto",
              height: item.isAdd ? "64px" : "auto",
              borderRadius: item.isAdd ? "50%" : "0",
              marginTop: item.isAdd ? "-32px" : "0",
              boxShadow: item.isAdd ? `0 8px 32px ${BRONZE.primary}40` : "none",
              position: "relative",
            }}
          >
            {item.icon && <item.icon />}
            <span style={{ 
              fontSize: "11px", 
              marginTop: "4px", 
              fontWeight: item.active && !item.isAdd ? "600" : "500",
              opacity: item.active ? 1 : 0.8,
            }}>
              {item.label}
            </span>
          </motion.button>
        ))}
      </nav>

      {/* Global Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        input:focus {
          outline: none;
        }
        
        button:disabled {
          cursor: not-allowed;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${BRONZE.light};
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${BRONZE.primary};
        }
        
        @media (max-width: 480px) {
          input, button {
            font-size: 16px !important; /* Prevents iOS zoom */
          }
        }
      `}</style>
    </div>
  );
}