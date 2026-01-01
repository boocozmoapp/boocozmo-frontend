// src/pages/HomeScreen.tsx - WITH USER PROFILE IN HEADER
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
  FaGlobe,
  FaUsers,
  FaBell,
  FaStar,
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
  
  // Refs
  const refreshTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitializedRef = useRef(false);

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

  // Get user location once
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
            maximumAge: 600000,
            enableHighAccuracy: false
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
  }, []);

  // Fetch function
  const fetchOffers = useCallback(async (silent = false, force = false) => {
    if ((loading || refreshing) && !force) return;
    
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

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
        setError(null);
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
  }, [userLocation, loading, refreshing]);

  // Initial load
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchOffers();
    }
  }, [fetchOffers]);

  // Silent background refresh
  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      
      refreshTimerRef.current = window.setTimeout(() => {
        if (document.visibilityState === 'visible' && !refreshing && !loading) {
          fetchOffers(true);
        }
        scheduleRefresh();
      }, 30000);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [fetchOffers, refreshing, loading]);

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

  const getImageSource = useCallback((offer: Offer): string => {
    if (offer.imageUrl?.startsWith('data:image')) {
      return offer.imageUrl;
    }
    if (offer.imageBase64) {
      return offer.imageBase64;
    }
    return offer.imageUrl || "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=500&fit=crop";
  }, []);

  const handleOfferPress = useCallback((offerId: number) => {
    navigate(`/offer/${offerId}`);
  }, [navigate]);

  const handleLike = useCallback(async (offerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const filterButtons = useMemo(() => [
    { id: "all" as const, label: "All", icon: <FaFilter /> },
    { id: "sell" as const, label: "For Sale", icon: <FaDollarSign /> },
    { id: "exchange" as const, label: "Exchange", icon: <FaExchangeAlt /> },
    { id: "buy" as const, label: "Wanted", icon: <FaTag /> },
  ], []);

  // OfferCard component
  const OfferCard = useMemo(() => 
    React.memo(({ offer }: { offer: Offer }) => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: "white",
          borderRadius: "16px",
          overflow: "hidden",
          marginBottom: "16px",
          boxShadow: "0 4px 20px rgba(205, 127, 50, 0.08)",
          border: `1px solid ${BRONZE.pale}`,
          cursor: "pointer",
          position: "relative",
        }}
        onClick={() => handleOfferPress(offer.id)}
      >
        <div style={{ display: "flex" }}>
          {/* Book Image */}
          <div style={{
            width: "110px",
            height: "160px",
            position: "relative",
            flexShrink: 0,
          }}>
            <img
              src={getImageSource(offer)}
              alt={offer.bookTitle}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              loading="lazy"
              width={110}
              height={160}
            />
            {/* Type Badge on Image */}
            <div style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              background: "rgba(255,255,255,0.9)",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "600",
              color: getTypeColor(offer.type),
              display: "flex",
              alignItems: "center",
              gap: "4px",
              border: `1px solid ${getTypeColor(offer.type)}30`,
            }}>
              {getTypeIcon(offer.type)}
              {offer.type.charAt(0).toUpperCase() + offer.type.slice(1)}
            </div>
          </div>

          {/* Content */}
          <div style={{ 
            flex: 1, 
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              {/* Title */}
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                margin: "0 0 6px",
                color: BRONZE.textDark,
                lineHeight: 1.3,
              }}>
                {offer.bookTitle}
              </h3>

              {/* Author */}
              {offer.author && (
                <p style={{
                  fontSize: "13px",
                  color: BRONZE.textLight,
                  margin: "0 0 8px",
                  fontStyle: "italic",
                }}>
                  {offer.author}
                </p>
              )}

              {/* Price or Exchange */}
              <div style={{ marginBottom: "10px" }}>
                {offer.type === "sell" && offer.price ? (
                  <span style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: BRONZE.primary,
                  }}>
                    ${offer.price.toFixed(2)}
                  </span>
                ) : offer.type === "exchange" && offer.exchangeBook ? (
                  <div style={{
                    fontSize: "13px",
                    color: BRONZE.dark,
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}>
                    <FaExchangeAlt size={12} />
                    For: {offer.exchangeBook}
                  </div>
                ) : (
                  <span style={{
                    fontSize: "14px",
                    color: BRONZE.textLight,
                    fontWeight: "500",
                  }}>
                    Looking for offers
                  </span>
                )}
              </div>

              {/* Condition and Genre */}
              <div style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
                {offer.condition && (
                  <span style={{
                    color: BRONZE.primary,
                    padding: "2px 8px",
                    background: `${BRONZE.primary}10`,
                    borderRadius: "10px",
                  }}>
                    {offer.condition}
                  </span>
                )}
                {offer.genre && (
                  <span style={{
                    color: BRONZE.textLight,
                    padding: "2px 8px",
                    background: `${BRONZE.textLight}08`,
                    borderRadius: "10px",
                  }}>
                    {offer.genre}
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: `1px solid ${BRONZE.pale}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                <FaMapMarkerAlt size={10} color={BRONZE.textLight} />
                <span style={{ color: BRONZE.textLight }}>{offer.distance || "Nearby"}</span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                <FaUser size={9} color={BRONZE.textLight} />
                <span style={{ color: BRONZE.textLight }}>{offer.ownerName || "Reader"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div style={{
          display: "flex",
          borderTop: `1px solid ${BRONZE.pale}`,
        }}>
          {[
            { icon: FaHeart, label: "Like", onClick: (e: React.MouseEvent) => handleLike(offer.id, e) },
            { icon: FaComments, label: "Chat", onClick: (e: React.MouseEvent) => handleChat(offer, e) },
            { icon: FaShareAlt, label: "Share", onClick: (e: React.MouseEvent) => handleShare(offer.id, e) },
            { icon: FaStar, label: "Save", onClick: (e: React.MouseEvent) => { e.stopPropagation(); } },
          ].map((action) => (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "12px",
                border: "none",
                background: "transparent",
                color: BRONZE.textLight,
                fontSize: "12px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = BRONZE.primary;
                e.currentTarget.style.background = `${BRONZE.primary}05`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = BRONZE.textLight;
                e.currentTarget.style.background = "transparent";
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
      {/* Header - Clean and Professional */}
      <header
        style={{
          padding: "16px 20px 20px 20px",
          background: "white",
          position: "sticky",
          top: 0,
          zIndex: 50,
          flexShrink: 0,
          boxShadow: "0 2px 20px rgba(205, 127, 50, 0.08)",
        }}
      >
        {/* Top Bar with User Profile and Actions */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "20px" 
        }}>
          {/* User Profile (replaces logo) */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onProfilePress}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "12px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${BRONZE.primary}08`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            {/* User Avatar */}
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "18px",
              fontWeight: "600",
              border: `2px solid ${BRONZE.pale}`,
              boxShadow: "0 4px 12px rgba(205, 127, 50, 0.1)",
            }}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            
            <div style={{ textAlign: "left" }}>
              <p style={{
                fontSize: "14px",
                fontWeight: "600",
                margin: "0",
                color: BRONZE.textDark,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}>
                Hi, {currentUser.name.split(' ')[0]}
                <span style={{ fontSize: "12px", color: BRONZE.primary }}>👋</span>
              </p>
              <p style={{
                fontSize: "12px",
                color: BRONZE.textLight,
                margin: "4px 0 0",
                opacity: 0.8,
              }}>
                Your literary journey
              </p>
            </div>
          </motion.button>

          {/* Action Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: `1px solid ${BRONZE.pale}`,
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: BRONZE.primary,
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              <FaGlobe />
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: `1px solid ${BRONZE.pale}`,
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: BRONZE.primary,
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              <FaBell />
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative", marginBottom: "20px" }}>
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
            placeholder="Search books, authors, or genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 14px 14px 48px",
              borderRadius: "12px",
              border: `1px solid ${BRONZE.light}`,
              fontSize: "15px",
              background: "white",
              color: BRONZE.textDark,
              fontFamily: "inherit",
              fontWeight: 500,
              transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(205, 127, 50, 0.05)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = BRONZE.primary;
              e.currentTarget.style.boxShadow = "0 2px 12px rgba(205, 127, 50, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = BRONZE.light;
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(205, 127, 50, 0.05)";
            }}
          />
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "4px",
            scrollbarWidth: "none",
          }}
        >
          {filterButtons.map((filter) => (
            <motion.button
              key={filter.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedFilter(filter.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                background:
                  selectedFilter === filter.id 
                    ? `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`
                    : `${BRONZE.pale}`,
                color: selectedFilter === filter.id ? "white" : BRONZE.textLight,
                fontSize: "13px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                boxShadow: selectedFilter === filter.id 
                  ? "0 4px 12px rgba(205, 127, 50, 0.2)" 
                  : "none",
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
          paddingBottom: "90px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Refresh indicator */}
        {refreshing && !loading && (
          <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                border: `2px solid ${BRONZE.primary}30`,
                borderTopColor: BRONZE.primary,
                borderRadius: "50%",
                margin: "0 auto",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        )}

        {/* Stats Bar */}
        {!loading && !error && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            padding: "12px 16px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(205, 127, 50, 0.05)",
            border: `1px solid ${BRONZE.pale}`,
          }}>
            <div>
              <p style={{ fontSize: "14px", color: BRONZE.textLight, margin: "0 0 4px" }}>
                Available Books
              </p>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: BRONZE.primary, margin: "0" }}>
                {filteredOffers.length}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "14px", color: BRONZE.textLight, margin: "0 0 4px" }}>
                Last updated
              </p>
              <p style={{ fontSize: "13px", color: BRONZE.textDark, margin: "0", fontWeight: "500" }}>
                {lastRefresh ? formatTimeAgo(lastRefresh.toISOString()) : "Just now"}
              </p>
            </div>
          </div>
        )}

        {/* Content states */}
        {loading && !refreshing ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                border: `3px solid ${BRONZE.primary}20`,
                borderTopColor: BRONZE.primary,
                borderRadius: "50%",
                margin: "0 auto 24px",
                animation: "spin 1s ease-in-out infinite",
              }}
            />
            <p style={{ color: BRONZE.primary, fontSize: "15px", fontWeight: "500" }}>
              Loading books...
            </p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "48px", color: BRONZE.light, marginBottom: "16px" }}>
              📚
            </div>
            <h3 style={{ color: BRONZE.dark, marginBottom: "8px", fontSize: "18px" }}>
              Unable to load books
            </h3>
            <p style={{ color: BRONZE.textLight, marginBottom: "24px", fontSize: "14px" }}>
              {error}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchOffers(false, true)}
              style={{
                padding: "12px 24px",
                background: BRONZE.primary,
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: `0 4px 16px ${BRONZE.primary}40`,
              }}
            >
              Try Again
            </motion.button>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ 
              width: "100px", 
              height: "100px", 
              borderRadius: "50%",
              background: `${BRONZE.primary}10`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "40px",
              color: BRONZE.primary,
            }}>
              <FaBookOpen />
            </div>
            <h3 style={{ color: BRONZE.dark, marginBottom: "8px", fontSize: "18px", fontWeight: "600" }}>
              {searchQuery ? 'No matches found' : 'No books available'}
            </h3>
            <p style={{ color: BRONZE.textLight, fontSize: "14px", maxWidth: "280px", margin: "0 auto 28px", lineHeight: 1.5 }}>
              {searchQuery
                ? "Try adjusting your search terms"
                : "Be the first to share a book in your community"}
            </p>
            {!searchQuery && onAddPress && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAddPress}
                style={{
                  padding: "14px 28px",
                  background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: `0 6px 20px ${BRONZE.primary}40`,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  margin: "0 auto",
                }}
              >
                <FaPlus />
                Share a Book
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

      {/* Bottom Navigation - Professional Design */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "12px 0",
          borderTop: `1px solid ${BRONZE.pale}`,
          background: "white",
          position: "fixed",
          bottom: 0,
          width: "100%",
          zIndex: 100,
          boxShadow: "0 -4px 20px rgba(205, 127, 50, 0.08)",
        }}
      >
        {[
          { icon: FaBookOpen, label: "Home", active: true, onClick: () => navigate("/") },
          { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress },
          { icon: FaComments, label: "Chats", onClick: () => navigate("/chat") },
          { icon: FaUsers, label: "Community", onClick: () => {} },
        ].map((item) => (
          <motion.button
            key={item.label}
            whileTap={{ scale: 0.95 }}
            onClick={item.onClick}
            style={{
              background: "transparent",
              border: "none",
              color: item.active ? BRONZE.primary : BRONZE.textLight,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontSize: "20px",
              cursor: "pointer",
              padding: "8px 12px",
              minWidth: "60px",
              borderRadius: "10px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!item.active) {
                e.currentTarget.style.background = `${BRONZE.primary}08`;
                e.currentTarget.style.color = BRONZE.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (!item.active) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = BRONZE.textLight;
              }
            }}
          >
            <item.icon />
            <span style={{ 
              fontSize: "11px", 
              marginTop: "4px", 
              fontWeight: item.active ? "600" : "500",
            }}>
              {item.label}
            </span>
          </motion.button>
        ))}

        {/* Floating Add Button */}
        <motion.div
          style={{
            position: "absolute",
            top: "-25px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <button
            onClick={onAddPress}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
              border: `3px solid white`,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(205, 127, 50, 0.4)",
            }}
          >
            <FaPlus />
          </button>
        </motion.div>
      </nav>

      {/* Global Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
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
          width: 4px;
          height: 4px;
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
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}