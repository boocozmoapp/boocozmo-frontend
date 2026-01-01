/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/MapScreen.tsx - PRODUCTION READY (FIXED)
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaArrowLeft, 
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
  FaBookOpen,
  FaMapMarkedAlt,
  FaPlus,
  FaUsers
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import React from "react";

// Bronze color palette
const BRONZE = {
  primary: "#CD7F32",
  light: "#E6B17E",
  dark: "#B87333",
  pale: "#F5E7D3",
  bg: "#F9F5F0",
  textDark: "#2C1810",
  textLight: "#5D4037",
  bgLight: "#FDF8F3",
};

const API_BASE = "https://boocozmo-api.onrender.com";

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
};

type Props = {
  onBack?: () => void;
  currentUser: { 
    email: string; 
    name: string;
    id: string;
  };
};

// Helper functions defined at TOP LEVEL to avoid hoisting issues
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

// Create custom markers with caching
const createMarkerIcon = (() => {
  const iconCache = new Map<string, L.DivIcon>();
  
  return (type: string, isSelected: boolean = false) => {
    const cacheKey = `${type}_${isSelected}`;
    
    if (iconCache.has(cacheKey)) {
      return iconCache.get(cacheKey)!;
    }

    const colors = {
      sell: BRONZE.primary,
      buy: "#8B4513",
      exchange: BRONZE.dark
    };

    const icons = {
      sell: '$',
      buy: '📖',
      exchange: '⇄'
    };

    const color = colors[type as keyof typeof colors] || BRONZE.primary;
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
  
  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);

  // Define clearMap BEFORE using it in useEffect
  const clearMap = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }
  }, []);

  // Cleanup on unmount - NOW clearMap is defined
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

  // Fetch offers
  const fetchOffers = useCallback(async (silent = false) => {
    if ((loading || refreshing) && !silent) return;
    
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
      
      const processedOffers = data.map((offer: Offer) => ({
        ...offer,
        lastUpdated: new Date().toISOString()
      }));

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
    return offer.imageUrl || "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=500&fit=crop";
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
      const findUrl = `${API_BASE}/find-chats?user1=${encodeURIComponent(
        currentUser.email
      )}&user2=${encodeURIComponent(offer.ownerEmail)}&offer_id=${offer.id}`;
      const findResponse = await fetch(findUrl);

      let chatId: number | null = null;

      if (findResponse.ok) {
        const chats = await findResponse.json();
        if (chats?.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          chats.sort((a: any, b: any) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          chatId = chats[0].id;
        }
      }

      if (!chatId) {
        const createResponse = await fetch(`${API_BASE}/create-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user1: currentUser.email,
            user2: offer.ownerEmail,
            offer_id: offer.id,
            title: offer.bookTitle.substring(0, 50),
          }),
        });

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? { ...offer, liked: !(offer as any).liked }
        : offer
    ));
  }, []);

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

  // Filter buttons
  const filterButtons = useMemo(() => [
    { id: "all" as const, label: "All", icon: <FaFilter /> },
    { id: "sell" as const, label: "For Sale", icon: <FaDollarSign /> },
    { id: "exchange" as const, label: "Exchange", icon: <FaExchangeAlt /> },
    { id: "buy" as const, label: "Wanted", icon: <FaTag /> },
  ], []);

  // Offer list component
  const OfferList = useMemo(() => 
    React.memo(({ offers }: { offers: Offer[] }) => (
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25 }}
        style={{
          position: "absolute",
          bottom: 80, // Increased bottom margin for bottom nav
          left: 16,
          right: 16,
          background: "rgba(255, 255, 255, 0.97)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          padding: "20px",
          maxHeight: "180px",
          overflowY: "auto",
          zIndex: 999,
          border: `1px solid ${BRONZE.pale}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ 
            fontSize: "16px", 
            fontWeight: "600", 
            margin: 0,
            color: BRONZE.textDark,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <FaMapMarkerAlt size={14} />
            Nearby Books ({offers.length})
          </h3>
          {lastRefresh && (
            <span style={{ fontSize: "11px", color: BRONZE.textLight, opacity: 0.7 }}>
              Updated {formatTimeAgo(lastRefresh.toISOString())}
            </span>
          )}
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {offers.map(offer => (
            <motion.div
              key={offer.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleMarkerClick(offer)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                borderRadius: "16px",
                background: selectedOffer?.id === offer.id ? `${BRONZE.primary}15` : BRONZE.bgLight,
                cursor: "pointer",
                border: selectedOffer?.id === offer.id ? `2px solid ${BRONZE.primary}` : `1px solid ${BRONZE.pale}`,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                overflow: "hidden",
                border: `1px solid ${BRONZE.pale}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: selectedOffer?.id === offer.id ? BRONZE.primary : BRONZE.light,
                color: "white",
                fontSize: "14px",
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
                  fontSize: "14px", 
                  fontWeight: "600", 
                  color: BRONZE.textDark,
                }}>
                  {offer.bookTitle.substring(0, 25)}{offer.bookTitle.length > 25 ? '...' : ''}
                </div>
                <div style={{ 
                  fontSize: "12px", 
                  color: BRONZE.textLight,
                  marginTop: "2px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <span>{offer.author || "Unknown author"}</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span>{offer.distance || "Nearby"}</span>
                </div>
              </div>
              {offer.price && (
                <div style={{
                  background: `${BRONZE.primary}15`,
                  color: BRONZE.primary,
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "700",
                  border: `1px solid ${BRONZE.primary}30`,
                }}>
                  ${offer.price.toFixed(2)}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    ))
  , [selectedOffer, getImageSource, formatTimeAgo, lastRefresh, handleMarkerClick]);

  // Selected offer card component
  const SelectedOfferCard = useMemo(() => 
    selectedOffer ? (
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
          borderRadius: "24px",
          padding: "20px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
          zIndex: 2000,
          overflowY: "auto",
          border: `1px solid ${BRONZE.pale}`,
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
            background: `${BRONZE.textDark}`,
            border: "none",
            color: "white",
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "20px",
            zIndex: 10,
            transition: "all 0.2s ease",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${BRONZE.dark}`;
            e.currentTarget.style.transform = "rotate(90deg) scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${BRONZE.textDark}`;
            e.currentTarget.style.transform = "rotate(0deg) scale(1)";
          }}
        >
          <FaTimes />
        </button>

        {/* Content */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ 
            fontSize: window.innerWidth < 768 ? "20px" : "22px", 
            fontWeight: "700", 
            margin: "0 0 6px",
            color: BRONZE.textDark,
            lineHeight: 1.3,
            paddingRight: "50px",
          }}>
            {selectedOffer.bookTitle}
          </h3>
          <p style={{ 
            fontSize: "15px", 
            color: BRONZE.textLight, 
            margin: "0 0 12px",
            fontStyle: "italic",
          }}>
            {selectedOffer.author ? `by ${selectedOffer.author}` : "Unknown Author"}
          </p>

          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "10px",
            fontSize: "13px",
            color: BRONZE.textLight,
            marginBottom: "16px",
            flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <FaMapMarkerAlt size={12} /> 
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
              padding: "6px 14px",
              borderRadius: "20px",
              background: `${getTypeColor(selectedOffer.type)}15`,
              color: getTypeColor(selectedOffer.type),
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "16px",
              border: `1px solid ${getTypeColor(selectedOffer.type)}30`,
            }}
          >
            {getTypeIcon(selectedOffer.type)}
            {selectedOffer.type === 'sell' ? 'For Sale' : 
             selectedOffer.type === 'buy' ? 'Wanted' : 
             'Exchange'}
          </div>
        </div>

        {selectedOffer.description && (
          <div style={{
            marginBottom: "20px",
            paddingBottom: "20px",
            borderBottom: `1px solid ${BRONZE.pale}`,
            maxHeight: "150px",
            overflowY: "auto",
          }}>
            <h4 style={{ 
              fontSize: "14px", 
              fontWeight: "600", 
              margin: "0 0 8px",
              color: BRONZE.textDark,
            }}>
              Description
            </h4>
            <p style={{
              fontSize: "14px",
              color: BRONZE.textLight,
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
          background: BRONZE.bgLight,
          borderRadius: "16px",
          border: `1px solid ${BRONZE.pale}`,
        }}>
          <div style={{ fontSize: "12px", color: BRONZE.textLight, marginBottom: "6px" }}>
            {selectedOffer.type === "sell" ? "Price" : 
             selectedOffer.type === "buy" ? "Looking for" : "Exchange for"}
          </div>
          <div style={{ 
            fontSize: window.innerWidth < 768 ? "24px" : "28px", 
            fontWeight: "800", 
            color: BRONZE.primary,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}>
            {selectedOffer.type === "sell" && selectedOffer.price ? (
              <>
                <FaDollarSign size={window.innerWidth < 768 ? 20 : 24} /> {selectedOffer.price.toFixed(2)}
              </>
            ) : selectedOffer.type === "exchange" && selectedOffer.exchangeBook ? (
              <>
                <FaExchangeAlt size={window.innerWidth < 768 ? 20 : 24} /> Exchange
              </>
            ) : (
              <>
                <FaTag size={window.innerWidth < 768 ? 20 : 24} /> Wanted
              </>
            )}
          </div>
          
          {selectedOffer.exchangeBook && (
            <div style={{ 
              fontSize: "14px", 
              color: BRONZE.textDark, 
              fontWeight: "500",
              padding: "8px 12px",
              background: "rgba(255,255,255,0.7)",
              borderRadius: "10px",
              borderLeft: `3px solid ${BRONZE.dark}`,
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
            background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
            color: "white",
            border: "none",
            padding: window.innerWidth < 768 ? "14px" : "16px",
            borderRadius: "16px",
            fontSize: window.innerWidth < 768 ? "15px" : "16px",
            fontWeight: "700",
            cursor: "pointer",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: `0 8px 24px ${BRONZE.primary}40`,
          }}
        >
          <FaComments size={window.innerWidth < 768 ? 16 : 18} />
          Contact Owner
        </motion.button>

        <div style={{
          display: "flex",
          gap: "10px",
          paddingTop: "16px",
          borderTop: `1px solid ${BRONZE.pale}`,
        }}>
          {[
            { icon: FaHeart, label: "Like", onClick: (e: React.MouseEvent) => handleLike(selectedOffer.id, e), color: BRONZE.primary },
            { icon: FaComments, label: "Chat", onClick: () => handleChat(selectedOffer), color: BRONZE.dark },
            { icon: FaShareAlt, label: "Share", onClick: (e: React.MouseEvent) => handleShare(selectedOffer.id, e), color: BRONZE.light },
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
                borderRadius: "12px",
                border: "none",
                background: `${action.color}10`,
                color: action.color,
                fontSize: window.innerWidth < 768 ? "13px" : "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minHeight: "44px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${action.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${action.color}10`;
              }}
            >
              <action.icon size={window.innerWidth < 768 ? 12 : 14} />
              {action.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    ) : null,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [selectedOffer, filteredOffers.length, handleChat, handleLike, handleShare]);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      padding: "32px",
      borderRadius: "24px",
      boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
      textAlign: "center",
      zIndex: 1002,
      border: `1px solid ${BRONZE.pale}`,
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{
          width: "60px",
          height: "60px",
          border: `4px solid ${BRONZE.primary}20`,
          borderTopColor: BRONZE.primary,
          borderRadius: "50%",
          margin: "0 auto 20px",
        }}
      />
      <p style={{ 
        color: BRONZE.textDark, 
        fontSize: "16px", 
        fontWeight: "600",
        margin: "0 0 8px",
      }}>
        Loading Map
      </p>
      <p style={{ 
        color: BRONZE.textLight, 
        fontSize: "14px",
        margin: 0,
      }}>
        Finding books near you...
      </p>
    </div>
  );

  // Error state
  const ErrorState = () => (
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      padding: "32px",
      borderRadius: "24px",
      boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
      textAlign: "center",
      zIndex: 1002,
      border: `1px solid ${BRONZE.pale}`,
      maxWidth: "300px",
    }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
      <h3 style={{ 
        color: BRONZE.dark, 
        fontSize: "18px", 
        fontWeight: "700",
        margin: "0 0 8px",
      }}>
        Unable to Load Map
      </h3>
      <p style={{ 
        color: BRONZE.textLight, 
        fontSize: "14px",
        margin: "0 0 24px",
        lineHeight: 1.5,
      }}>
        {error}
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => fetchOffers(false)}
        style={{
          padding: "14px 28px",
          background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
          color: "white",
          border: "none",
          borderRadius: "14px",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer",
          boxShadow: `0 8px 24px ${BRONZE.primary}40`,
          width: "100%",
        }}
      >
        Try Again
      </motion.button>
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

      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          background: "rgba(255, 255, 255, 0.97)",
          backdropFilter: "blur(20px)",
          padding: "20px",
          paddingTop: "20px",
          zIndex: 1000,
          borderBottom: `1px solid ${BRONZE.pale}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        }}
      >
        {/* Top Row - LARGER ICONS */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "16px",
          marginBottom: "20px",
        }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            style={{
              width: "52px", // Increased from 48px
              height: "52px", // Increased from 48px
              borderRadius: "16px", // Increased from 14px
              background: "white",
              border: `2px solid ${BRONZE.pale}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: BRONZE.dark,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              flexShrink: 0,
            }}
          >
            <FaArrowLeft size={24} /> {/* Increased from 20 */}
          </motion.button>
          
          <div style={{ flex: 1 }}>
            <h1 style={{ 
              fontSize: "26px", // Increased from 24px
              fontWeight: "800", 
              margin: 0, 
              color: BRONZE.dark,
              display: "flex",
              alignItems: "center",
              gap: "10px", // Increased from 8px
            }}>
              <FaMapMarkerAlt size={24} color={BRONZE.primary} /> {/* Increased from 20 */}
              Book Map
            </h1>
            <div style={{ 
              fontSize: "14px", // Increased from 13px
              color: BRONZE.textLight, 
              margin: "6px 0 0", // Increased margin
              display: "flex",
              alignItems: "center",
              gap: "10px", // Increased from 8px
              flexWrap: "wrap",
            }}>
              <span>{offers.length} books nearby</span>
              <span style={{ opacity: 0.3 }}>•</span>
              <span>Click markers for details</span>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ rotate: 180 }}
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              width: "52px", // Increased from 48px
              height: "52px", // Increased from 48px
              borderRadius: "16px", // Increased from 14px
              background: "white",
              border: `2px solid ${refreshing ? BRONZE.light : BRONZE.pale}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: refreshing ? BRONZE.light : BRONZE.primary,
              cursor: refreshing ? "not-allowed" : "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              flexShrink: 0,
              opacity: refreshing ? 0.7 : 1,
            }}
          >
            <FaSync className={refreshing ? "spin" : ""} size={22} /> {/* Increased from 18 */}
          </motion.button>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "20px" }}>
          <FaSearch style={{ 
            position: "absolute", 
            left: "18px", // Increased from 16px
            top: "50%", 
            transform: "translateY(-50%)", 
            color: BRONZE.primary,
            fontSize: "20px", // Increased from 18px
            zIndex: 1,
          }} />
          <input
            type="text"
            placeholder="Search books, authors, genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "16px 16px 16px 52px", // Increased padding-left
              borderRadius: "16px", // Increased from 14px
              border: `1px solid ${BRONZE.pale}`,
              background: "white",
              fontSize: "16px",
              fontFamily: "inherit",
              fontWeight: 500,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = BRONZE.primary;
              e.currentTarget.style.boxShadow = "0 4px 28px rgba(205, 127, 50, 0.2)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = BRONZE.pale;
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
            }}
          />
        </div>

        {/* Filter Tabs */}
        <div style={{ 
          display: "flex", 
          gap: "10px", // Increased from 8px
          overflowX: "auto",
          paddingBottom: "6px", // Increased from 4px
          scrollbarWidth: "none",
        }}>
          {filterButtons.map((f) => (
            <motion.button
              key={f.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "12px 20px", // Increased from 10px 18px
                borderRadius: "24px",
                background: filter === f.id ? 
                  `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})` : 
                  "white",
                color: filter === f.id ? "white" : BRONZE.textLight,
                fontSize: "14px",
                fontWeight: filter === f.id ? "700" : "600",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "10px", // Increased from 8px
                cursor: "pointer",
                boxShadow: filter === f.id ? 
                  `0 4px 20px ${BRONZE.primary}50` : 
                  "0 2px 12px rgba(0,0,0,0.08)",
                border: filter === f.id ? "none" : `1px solid ${BRONZE.pale}`,
                flexShrink: 0,
                minHeight: "48px", // Added min height
              }}
            >
              {f.icon}
              {f.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

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
            bottom: 80, // Increased from 16px
            left: 16,
            right: 16,
            background: "rgba(255, 255, 255, 0.97)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "24px",
            textAlign: "center",
            zIndex: 999,
            border: `1px solid ${BRONZE.pale}`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ 
            fontSize: "48px", 
            marginBottom: "16px",
            opacity: 0.5,
          }}>
            📚
          </div>
          <h3 style={{ 
            color: BRONZE.textDark, 
            fontSize: "18px", 
            fontWeight: "700",
            margin: "0 0 8px",
          }}>
            {searchQuery ? "No books found" : "No books with locations"}
          </h3>
          <p style={{ 
            color: BRONZE.textLight, 
            fontSize: "14px",
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

      {/* Bottom Navigation - Matching Other Screens */}
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
          zIndex: 1000,
          boxShadow: "0 -4px 20px rgba(205, 127, 50, 0.08)",
        }}
      >
        {[
          { icon: FaBookOpen, label: "Home", onClick: () => navigate("/") },
          { icon: FaMapMarkedAlt, label: "Map", active: true, onClick: () => {} }, // Current screen
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
            onClick={() => navigate("/offer")}
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
          border-radius: 16px !important;
          padding: 0 !important;
          border: 1px solid ${BRONZE.pale} !important;
          box-shadow: 0 12px 32px rgba(0,0,0,0.15) !important;
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
          background: ${BRONZE.bgLight};
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${BRONZE.light};
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${BRONZE.primary};
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