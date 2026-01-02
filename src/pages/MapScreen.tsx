/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/MapScreen.tsx - SIMPLIFIED ONE-SCREEN STYLE
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaMapMarkerAlt, 
  FaDollarSign,
  FaSearch,
  FaTimes,
  FaHeart,
  FaShareAlt,
  FaComments,
  FaExchangeAlt,
  FaTag,
  FaBook,
  FaFilter,
  FaSync,
  FaPlus,
  FaBookmark,

} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import React from "react";

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
  overlay: "rgba(0, 0, 0, 0.7)"
};

const API_BASE = "https://boocozmo-api.onrender.com";

// Timeout promise wrapper
const fetchWithTimeout = (url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeout}ms`));
    }, timeout);

    fetch(url, options)
      .then(response => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

// Retry wrapper with exponential backoff
const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  timeout = 10000
): Promise<Response> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);
      if (response.ok) {
        return response;
      }
      // If not OK but not timeout, throw to retry
      if (i === maxRetries - 1) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) {
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error("Max retries reached");
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
};

type Props = {
  onBack?: () => void;
  currentUser: { 
    email: string; 
    name: string;
    id: string;
  };
};

// Helper functions
const getTypeColor = (type: string): string => {
  switch(type) {
    case 'sell': return PINTEREST.primary;
    case 'exchange': return "#00A86B";
    case 'buy': return "#1D9BF0";
    default: return PINTEREST.textLight;
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

const getTypeLabel = (type: string): string => {
  switch(type) {
    case 'sell': return "For Sale";
    case 'exchange': return "Exchange";
    case 'buy': return "Wanted";
    default: return "";
  }
};

// Create custom markers with caching
const createMarkerIcon = (() => {
  const iconCache = new Map<string, L.DivIcon>();
  
  return (type: string, isSelected: boolean = false) => {
    const cacheKey = `${type}_${isSelected}`;
    
    if (iconCache.has(cacheKey)) {
      return iconCache.get(cacheKey)!;
    }

    const colors = {
      sell: PINTEREST.primary,
      buy: "#1D9BF0",
      exchange: "#00A86B"
    };

    const icons = {
      sell: '$',
      buy: '📖',
      exchange: '⇄'
    };

    const color = colors[type as keyof typeof colors] || PINTEREST.primary;
    const size = isSelected ? 50 : 40;
    const border = isSelected ? '4px solid white' : '3px solid white';

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color};
          border: ${border};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: ${isSelected ? '20px' : '16px'};
          font-weight: ${isSelected ? 'bold' : 'normal'};
          box-shadow: 0 ${isSelected ? '4px' : '2px'} ${isSelected ? '16px' : '8px'} rgba(0,0,0,0.${isSelected ? '4' : '3'});
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: ${isSelected ? '1000' : '999'};
        ">
          ${icons[type as keyof typeof icons]}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });

    iconCache.set(cacheKey, icon);
    return icon;
  };
})();

export default function MapScreen({ onBack, currentUser }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [filter, setFilter] = useState<"all" | "sell" | "buy" | "exchange">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);

  // Clear map function
  const clearMap = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearMap();
    };
  }, [clearMap]);

  // Get user location
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
  }, [userLocation]);

  // Fetch offers with retry logic
  const fetchOffers = useCallback(async (silent = false) => {
    if ((loading || refreshing) && !silent) return;
    
    if (!silent) {
      setLoading(true);
      setError(null);
    } else {
      setRefreshing(true);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetchWithRetry(
        `${API_BASE}/offers`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        },
        3, // max retries
        10000 // timeout
      );
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch offers`);
      
      const data = await response.json();
      
      const processedOffers = data.map((offer: Offer) => ({
        ...offer,
        lastUpdated: new Date().toISOString(),
        saved: Math.random() > 0.7, // Mock saved state
        liked: Math.random() > 0.5 // Mock liked state
      }));

      if (isMountedRef.current) {
        setOffers(processedOffers);
        setLastRefresh(new Date());
        setError(null);
        setRetryCount(0); // Reset retry count on success
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      
      console.error("Error fetching offers:", err);
      
      if (isMountedRef.current) {
        if (err.message.includes('timed out') || err.message.includes('Failed to fetch')) {
          setError("Backend is waking up... Please wait");
          setRetryCount(prev => prev + 1);
        } else {
          setError(err.message || "Failed to load offers");
        }
        
        if (!silent) {
          setError(err.message || "Failed to load offers");
        }
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

  // Get image source
  const getImageSource = useCallback((offer: Offer): string => {
    if (offer.imageUrl?.startsWith('data:image')) {
      return offer.imageUrl;
    }
    if (offer.imageBase64) {
      return offer.imageBase64;
    }
    // Random book covers for missing images
    const bookCovers = [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop",
    ];
    return bookCovers[Math.floor(Math.random() * bookCovers.length)];
  }, []);

  // Filter offers
  const filteredOffers = useMemo(() => {
    let result = offers;

    if (filter !== "all") {
      result = result.filter(offer => offer.type === filter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        offer =>
          offer.bookTitle.toLowerCase().includes(query) ||
          offer.description?.toLowerCase().includes(query) ||
          offer.author?.toLowerCase().includes(query) ||
          offer.genre?.toLowerCase().includes(query) ||
          offer.exchangeBook?.toLowerCase().includes(query)
      );
    }

    return result.filter(offer => offer.latitude && offer.longitude);
  }, [offers, filter, searchQuery]);

  // Handle marker click
  const handleMarkerClick = useCallback((offer: Offer) => {
    setSelectedOffer(prev => prev?.id === offer.id ? null : offer);
    
    if (mapInstance.current && offer.latitude && offer.longitude) {
      mapInstance.current.setView([offer.latitude, offer.longitude], 15, {
        animate: true,
        duration: 0.5
      });
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || loading) return;

    // Get center coordinates
    let centerLat = 40.7128;
    let centerLng = -74.0060;
    
    if (userLocation) {
      centerLat = userLocation.lat;
      centerLng = userLocation.lng;
    } else if (filteredOffers.length > 0) {
      centerLat = filteredOffers[0].latitude!;
      centerLng = filteredOffers[0].longitude!;
    }

    // Create map if doesn't exist
    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        inertia: true,
        inertiaDeceleration: 3000,
      }).setView([centerLat, centerLng], 13);
      
      mapInstance.current = map;

      // Add tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Add zoom control
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each offer
    filteredOffers.forEach(offer => {
      if (!offer.latitude || !offer.longitude) return;

      const isSelected = selectedOffer?.id === offer.id;
      const icon = createMarkerIcon(offer.type, isSelected);
      
      const marker = L.marker([offer.latitude, offer.longitude], { icon })
        .addTo(mapInstance.current!)
        .on('click', () => {
          handleMarkerClick(offer);
        });

      markersRef.current.push(marker);
    });

    // Cleanup function
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [filteredOffers, loading, userLocation, selectedOffer, handleMarkerClick]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  }, [onBack, navigate]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (!refreshing) {
      fetchOffers(true);
    }
  }, [fetchOffers, refreshing]);

  // Handle chat
  const handleChat = useCallback(async (offer: Offer) => {
    if (offer.ownerEmail === currentUser.email) {
      navigate(`/offer/${offer.id}`);
      return;
    }

    try {
      const response = await fetchWithRetry(
        `${API_BASE}/find-chats?user1=${encodeURIComponent(
          currentUser.email
        )}&user2=${encodeURIComponent(offer.ownerEmail)}&offer_id=${offer.id}`,
        {},
        2,
        5000
      );

      let chatId: number | null = null;

      if (response.ok) {
        const chats = await response.json();
        if (chats?.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          chats.sort((a: any, b: any) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          chatId = chats[0].id;
        }
      }

      if (!chatId) {
        const createResponse = await fetchWithRetry(
          `${API_BASE}/create-chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user1: currentUser.email,
              user2: offer.ownerEmail,
              offer_id: offer.id,
              title: offer.bookTitle.substring(0, 50),
            }),
          },
          2,
          5000
        );

        if (createResponse.ok) {
          const newChat = await createResponse.json();
          chatId = newChat.id;
        } else {
          chatId = Date.now();
        }
      }

      navigate(`/chat/${chatId}`, {
        state: {
          chat: {
            id: chatId,
            user1: currentUser.email,
            user2: offer.ownerEmail,
            other_user_name: offer.ownerName || offer.ownerEmail.split("@")[0],
            offer_title: offer.bookTitle,
            offer_id: offer.id,
          },
        },
      });
    } catch (error) {
      console.error("Chat error:", error);
      navigate(`/offer/${offer.id}`);
    }
  }, [currentUser.email, navigate]);

  // Handle like
  const handleLike = useCallback(async (offerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOffers(prev => prev.map(offer => 
      offer.id === offerId 
        ? { ...offer, liked: !offer.liked }
        : offer
    ));
    if (selectedOffer?.id === offerId) {
      setSelectedOffer(prev => prev ? { ...prev, liked: !prev.liked } : null);
    }
  }, [selectedOffer]);

  // Handle save
  const handleSave = useCallback(async (offerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOffers(prev => prev.map(offer => 
      offer.id === offerId 
        ? { ...offer, saved: !offer.saved }
        : offer
    ));
    if (selectedOffer?.id === offerId) {
      setSelectedOffer(prev => prev ? { ...prev, saved: !prev.saved } : null);
    }
  }, [selectedOffer]);

  // Handle share
  const handleShare = useCallback(async (offerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this book!",
          text: "I found this great book on BookSphere",
          url: `${window.location.origin}/offer/${offerId}`,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    }
  }, []);

  // Format time ago
  const formatTimeAgo = useCallback((dateString: string): string => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }, []);

  // Format price
  const formatPrice = (price: number | null): string => {
    if (!price) return "Free";
    return `$${price.toFixed(2)}`;
  };

  // Filter buttons
  const filterButtons = useMemo(() => [
    { id: "all" as const, label: "All", icon: <FaFilter size={12} /> },
    { id: "sell" as const, label: "For Sale", icon: <FaDollarSign size={12} /> },
    { id: "exchange" as const, label: "Exchange", icon: <FaExchangeAlt size={12} /> },
    { id: "buy" as const, label: "Wanted", icon: <FaTag size={12} /> },
  ], []);

  // Offer list component
  const OfferList = React.memo(({ offers }: { offers: Offer[] }) => (
    <motion.div
      initial={{ y: 300 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 25 }}
      style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        right: 16,
        background: "rgba(255, 255, 255, 0.97)",
        backdropFilter: "blur(20px)",
        borderRadius: "16px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        padding: "16px",
        maxHeight: "180px",
        overflowY: "auto",
        zIndex: 999,
        border: `1px solid ${PINTEREST.border}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h3 style={{ 
          fontSize: "14px", 
          fontWeight: "600", 
          margin: 0,
          color: PINTEREST.textDark,
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}>
          <FaMapMarkerAlt size={12} />
          Nearby Books ({offers.length})
        </h3>
        {lastRefresh && (
          <span style={{ fontSize: "10px", color: PINTEREST.textLight, opacity: 0.7 }}>
            Updated {formatTimeAgo(lastRefresh.toISOString())}
          </span>
        )}
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {offers.map((offer) => (
          <motion.div
            key={offer.id}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMarkerClick(offer)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px",
              borderRadius: "12px",
              background: selectedOffer?.id === offer.id ? PINTEREST.redLight : PINTEREST.grayLight,
              cursor: "pointer",
              border: selectedOffer?.id === offer.id ? `2px solid ${PINTEREST.primary}` : `1px solid ${PINTEREST.border}`,
              transition: "all 0.2s ease",
            }}
          >
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              overflow: "hidden",
              border: `1px solid ${PINTEREST.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: selectedOffer?.id === offer.id ? PINTEREST.primary : PINTEREST.light,
              color: "white",
              fontSize: "12px",
            }}>
              {offer.imageUrl || offer.imageBase64 ? (
                <img 
                  src={getImageSource(offer)} 
                  alt={offer.bookTitle}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
              ) : (
                <FaBook />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: "13px", 
                fontWeight: "600", 
                color: PINTEREST.textDark,
              }}>
                {offer.bookTitle.substring(0, 20)}{offer.bookTitle.length > 20 ? '...' : ''}
              </div>
              <div style={{ 
                fontSize: "11px", 
                color: PINTEREST.textLight,
                marginTop: "2px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <span>{offer.author?.substring(0, 15) || "Unknown"}</span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>{offer.distance || "Nearby"}</span>
              </div>
            </div>
            {offer.price && (
              <div style={{
                background: PINTEREST.redLight,
                color: PINTEREST.primary,
                padding: "4px 8px",
                borderRadius: "10px",
                fontSize: "11px",
                fontWeight: "700",
                border: `1px solid ${PINTEREST.primary}30`,
              }}>
                {formatPrice(offer.price)}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  ));

  // Selected offer card component
  const SelectedOfferCard = selectedOffer ? (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: window.innerWidth < 768 ? "calc(100vw - 32px)" : "400px",
        maxWidth: "500px",
        maxHeight: window.innerWidth < 768 ? "85vh" : "80vh",
        background: "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(20px)",
        borderRadius: "20px",
        padding: "20px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
        zIndex: 2000,
        overflowY: "auto",
        border: `1px solid ${PINTEREST.border}`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button */}
      <button
        onClick={() => setSelectedOffer(null)}
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
          transition: "all 0.2s ease",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}
      >
        <FaTimes />
      </button>

      {/* Content */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ 
          fontSize: window.innerWidth < 768 ? "18px" : "20px", 
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
        </div>

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

      {selectedOffer.description && (
        <div style={{
          marginBottom: "20px",
          paddingBottom: "20px",
          borderBottom: `1px solid ${PINTEREST.border}`,
          maxHeight: "120px",
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
          fontSize: window.innerWidth < 768 ? "22px" : "24px", 
          fontWeight: "800", 
          color: PINTEREST.primary,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "8px",
        }}>
          {selectedOffer.type === "sell" && selectedOffer.price ? (
            <>
              <FaDollarSign size={window.innerWidth < 768 ? 18 : 20} /> {formatPrice(selectedOffer.price)}
            </>
          ) : selectedOffer.type === "exchange" && selectedOffer.exchangeBook ? (
            <>
              <FaExchangeAlt size={window.innerWidth < 768 ? 18 : 20} /> Exchange
            </>
          ) : (
            <>
              <FaTag size={window.innerWidth < 768 ? 18 : 20} /> Wanted
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

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleChat(selectedOffer)}
        style={{
          width: "100%",
          background: PINTEREST.primary,
          color: "white",
          border: "none",
          padding: window.innerWidth < 768 ? "14px" : "16px",
          borderRadius: "12px",
          fontSize: window.innerWidth < 768 ? "14px" : "15px",
          fontWeight: "700",
          cursor: "pointer",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <FaComments size={window.innerWidth < 768 ? 14 : 16} />
        Contact Owner
      </motion.button>

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
            onClick: (e: React.MouseEvent) => handleLike(selectedOffer.id, e), 
            color: selectedOffer.liked ? PINTEREST.primary : PINTEREST.textLight 
          },
          { 
            icon: FaBookmark, 
            label: "Save", 
            onClick: (e: React.MouseEvent) => handleSave(selectedOffer.id, e), 
            color: selectedOffer.saved ? PINTEREST.primary : PINTEREST.textLight 
          },
          { 
            icon: FaShareAlt, 
            label: "Share", 
            onClick: (e: React.MouseEvent) => handleShare(selectedOffer.id, e), 
            color: PINTEREST.textLight 
          },
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
              gap: "6px",
              padding: window.innerWidth < 768 ? "10px" : "12px",
              borderRadius: "10px",
              border: "none",
              background: `${action.color}10`,
              color: action.color,
              fontSize: window.innerWidth < 768 ? "12px" : "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              minHeight: "40px",
            }}
          >
            <action.icon size={window.innerWidth < 768 ? 12 : 14} />
            {action.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  ) : null;

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      padding: "28px",
      borderRadius: "20px",
      boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
      textAlign: "center",
      zIndex: 1002,
      border: `1px solid ${PINTEREST.border}`,
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{
          width: "50px",
          height: "50px",
          border: `3px solid ${PINTEREST.primary}20`,
          borderTopColor: PINTEREST.primary,
          borderRadius: "50%",
          margin: "0 auto 16px",
        }}
      />
      <p style={{ 
        color: PINTEREST.textDark, 
        fontSize: "15px", 
        fontWeight: "600",
        margin: "0 0 8px",
      }}>
        Loading Map
      </p>
      <p style={{ 
        color: PINTEREST.textLight, 
        fontSize: "13px",
        margin: 0,
      }}>
        Finding books near you...
      </p>
    </div>
  );

  // Error state with retry
  const ErrorState = () => (
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      padding: "28px",
      borderRadius: "20px",
      boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
      textAlign: "center",
      zIndex: 1002,
      border: `1px solid ${PINTEREST.border}`,
      maxWidth: "300px",
    }}>
      <div style={{ fontSize: "40px", marginBottom: "16px", color: PINTEREST.primary }}>📚</div>
      <h3 style={{ 
        color: PINTEREST.textDark, 
        fontSize: "16px", 
        fontWeight: "700",
        margin: "0 0 8px",
      }}>
        {error?.includes("waking up") ? "Backend is Starting" : "Unable to Load Map"}
      </h3>
      <p style={{ 
        color: PINTEREST.textLight, 
        fontSize: "13px",
        margin: "0 0 20px",
        lineHeight: 1.5,
      }}>
        {error || "Please check your connection"}
        {retryCount > 0 && (
          <div style={{ marginTop: "8px", fontSize: "12px", color: PINTEREST.primary }}>
            Attempt {retryCount + 1} of 3
          </div>
        )}
      </p>
      <div style={{ display: "flex", gap: "10px" }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fetchOffers(false)}
          style={{
            flex: 2,
            padding: "12px 20px",
            background: PINTEREST.primary,
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          {error?.includes("waking up") ? "Try Again" : "Retry"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          style={{
            flex: 1,
            padding: "12px",
            background: PINTEREST.grayLight,
            color: PINTEREST.textDark,
            border: `1px solid ${PINTEREST.border}`,
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Back
        </motion.button>
      </div>
    </div>
  );

  return (
    <div style={{ 
      width: "100%", 
      height: "100vh",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Map Container */}
      <div 
        ref={mapRef} 
        style={{ 
          width: "100%", 
          height: "100%",
        }} 
      />

      {/* SIMPLIFIED TOP HEADER - Like OneScreen */}
      <motion.div
        initial={{ y: 0 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "12px 16px",
          zIndex: 1000,
          background: "transparent",
        }}
      >
        {/* Search Bar - Simple and Clean */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${PINTEREST.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: PINTEREST.textDark,
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <FaTimes size={14} />
          </motion.button>
          
          <div style={{ flex: 1, position: "relative" }}>
            <FaSearch style={{ 
              position: "absolute", 
              left: "12px", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: PINTEREST.icon,
              fontSize: "14px",
              zIndex: 1,
            }} />
            <input
              type="text"
              placeholder="Search books, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 10px 10px 36px",
                borderRadius: "24px",
                border: `1px solid ${PINTEREST.border}`,
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                fontSize: "14px",
                fontFamily: "inherit",
                fontWeight: 400,
                outline: "none",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = PINTEREST.primary;
                e.currentTarget.style.boxShadow = "0 2px 16px rgba(230, 0, 35, 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = PINTEREST.border;
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";
              }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${PINTEREST.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: showFilters ? PINTEREST.primary : PINTEREST.textDark,
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <FaFilter size={14} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${PINTEREST.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: refreshing ? PINTEREST.textLight : PINTEREST.primary,
              cursor: refreshing ? "not-allowed" : "pointer",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <FaSync className={refreshing ? "spin" : ""} size={14} />
          </motion.button>
        </div>

        {/* Filter Chips - Show/Hide based on state */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                display: "flex",
                gap: "6px",
                overflowX: "auto",
                paddingBottom: "4px",
                scrollbarWidth: "none",
              }}
            >
              {filterButtons.map((f) => (
                <motion.button
                  key={f.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "16px",
                    background: filter === f.id ? PINTEREST.primary : "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(20px)",
                    color: filter === f.id ? "white" : PINTEREST.textDark,
                    fontSize: "11px",
                    fontWeight: filter === f.id ? "700" : "600",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                    border: `1px solid ${filter === f.id ? PINTEREST.primary : PINTEREST.border}`,
                    flexShrink: 0,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  {f.icon}
                  {f.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Action Button for Profile/Menu */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/profile")}
        style={{
          position: "absolute",
          bottom: window.innerWidth < 768 ? "200px" : "180px",
          right: "16px",
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: PINTEREST.primary,
          border: "none",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 1001,
          boxShadow: "0 6px 20px rgba(230, 0, 35, 0.4)",
          fontSize: "18px",
        }}
      >
        {currentUser.name.charAt(0).toUpperCase()}
      </motion.button>

      {/* Floating Add Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/offer")}
        style={{
          position: "absolute",
          bottom: window.innerWidth < 768 ? "140px" : "120px",
          right: "16px",
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: PINTEREST.primary,
          border: "none",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 1001,
          boxShadow: "0 6px 20px rgba(230, 0, 35, 0.4)",
          fontSize: "20px",
        }}
      >
        <FaPlus />
      </motion.button>

      {/* Loading State */}
      {loading && <LoadingSkeleton />}

      {/* Error State */}
      {error && !loading && <ErrorState />}

      {/* Book List */}
      {!loading && !error && filteredOffers.length > 0 && (
        <OfferList offers={filteredOffers} />
      )}

      {/* No Results */}
      {!loading && !error && filteredOffers.length === 0 && (
        <motion.div
          initial={{ y: 300 }}
          animate={{ y: 0 }}
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            background: "rgba(255, 255, 255, 0.97)",
            backdropFilter: "blur(20px)",
            borderRadius: "16px",
            padding: "20px",
            textAlign: "center",
            zIndex: 999,
            border: `1px solid ${PINTEREST.border}`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ 
            fontSize: "40px", 
            marginBottom: "12px",
            color: PINTEREST.primary,
          }}>
            📚
          </div>
          <h3 style={{ 
            color: PINTEREST.textDark, 
            fontSize: "16px", 
            fontWeight: "700",
            margin: "0 0 8px",
          }}>
            {searchQuery ? "No books found" : "No books with locations"}
          </h3>
          <p style={{ 
            color: PINTEREST.textLight, 
            fontSize: "13px",
            margin: 0,
          }}>
            {searchQuery ? "Try a different search term" : "Check back soon for nearby books!"}
          </p>
        </motion.div>
      )}

      {/* Selected Offer Card */}
      <AnimatePresence mode="wait">
        {SelectedOfferCard}
      </AnimatePresence>

      {/* CSS Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        .custom-marker {
          transition: transform 0.3s ease !important;
        }
        
        .custom-marker:hover {
          transform: scale(1.2);
        }
        
        .leaflet-popup-content {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 0 !important;
          border: 1px solid ${PINTEREST.border} !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
        }
        
        .leaflet-popup-tip {
          background: white !important;
          box-shadow: none !important;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${PINTEREST.border};
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${PINTEREST.textLight};
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        input:focus {
          outline: none;
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .leaflet-popup {
            max-width: 280px !important;
          }
        }
      `}</style>
    </div>
  );
}