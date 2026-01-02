// src/pages/MapScreen.tsx - COMPLETELY FIXED VERSION
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaTimes, 
  FaSearch, 
  FaMapMarkerAlt,
  FaDollarSign,
  FaExchangeAlt,
  FaTag,
  FaHeart,
  FaBookmark,
  FaShareAlt,
  FaComments,
  FaCheck,
  FaFilter,
  FaSync,
  FaPlus,
  FaBookOpen,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

const PINTEREST = {
  primary: "#E60023",
  dark: "#A3081A",
  light: "#FF4D6D",
  bg: "#FFFFFF",
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
  currentUser: { 
    email: string; 
    name: string; 
    id: string;  // FIXED: Added missing id field
    token: string;
  };
};

// Retry wrapper with timeout - EXACT SAME AS HOMESCREEN
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

// Custom marker icons
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

export default function MapScreen({ currentUser }: Props) {
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
  const [chatLoading, setChatLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLiked, setIsLiked] = useState<Record<number, boolean>>({});
  const [isSaved, setIsSaved] = useState<Record<number, boolean>>({});
  const [, setImageErrors] = useState<Record<number, boolean>>({});

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch offers - FIXED to match HomeScreen exactly
  const fetchOffers = useCallback(async (silent = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (!silent) {
      setLoading(true);
      setError(null);
    } else {
      setRefreshing(true);
    }
    
    setImageErrors({}); // FIXED: Reset image errors

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

      // Process offers - EXACT SAME AS HOMESCREEN
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
      setError(null); // FIXED: Reset error on success like HomeScreen
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error:", err);
        setError(err.message || "Failed to load books");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser.token]);

  useEffect(() => {
    fetchOffers();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchOffers]);

  // Get user location
  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => {
            setUserLocation({ lat: 40.7128, lng: -74.006 });
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

  // Filter offers
  const filteredOffers = useMemo(() => {
    let result = offers.filter(offer => offer.latitude && offer.longitude);

    if (filter !== "all") {
      result = result.filter(offer => offer.type === filter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        offer =>
          offer.bookTitle.toLowerCase().includes(q) ||
          offer.author?.toLowerCase().includes(q) ||
          offer.description?.toLowerCase().includes(q) ||
          offer.genre?.toLowerCase().includes(q) ||
          offer.exchangeBook?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [offers, filter, searchQuery]);

  // Handle marker click
  const handleMarkerClick = useCallback((offer: Offer) => {
    setSelectedOffer(offer);
    
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

  }, [filteredOffers, loading, userLocation, selectedOffer, handleMarkerClick]);

  // Helper functions - EXACT SAME AS HOMESCREEN
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

  // ==================== EXACT CHAT FUNCTIONALITY FROM HOMESCREEN ====================
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

  const handleCloseDetail = useCallback(() => {
    setSelectedOffer(null);
  }, []);

  const filterButtons = [
    { id: "all" as const, label: "All", icon: <FaFilter size={12} /> },
    { id: "sell" as const, label: "For Sale", icon: <FaDollarSign size={12} /> },
    { id: "exchange" as const, label: "Exchange", icon: <FaExchangeAlt size={12} /> },
    { id: "buy" as const, label: "Wanted", icon: <FaTag size={12} /> },
  ];

  return (
    <div style={{ 
      width: "100%", 
      height: "100vh",
      position: "relative",
    }}>
      {/* Simple Header */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: "16px",
        zIndex: 1000,
        background: "rgba(255, 255, 255, 0.9)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: PINTEREST.primary,
            border: "none",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          <FaTimes />
        </button>
        
        <div style={{ flex: 1, position: "relative" }}>
          <FaSearch style={{ 
            position: "absolute", 
            left: "12px", 
            top: "50%", 
            transform: "translateY(-50%)", 
            color: PINTEREST.icon,
            zIndex: 1,
          }} />
          <input
            type="text"
            placeholder="Search books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 10px 10px 36px",
              borderRadius: "20px",
              border: `1px solid ${PINTEREST.border}`,
              background: "white",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>

        <button
          onClick={() => fetchOffers(true)}
          disabled={refreshing}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: PINTEREST.primary,
            border: "none",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "16px",
            opacity: refreshing ? 0.7 : 1,
          }}
        >
          <FaSync className={refreshing ? "spin" : ""} />
        </button>

        <button
          onClick={() => navigate("/offer")}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: PINTEREST.primary,
            border: "none",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          <FaPlus />
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{
        position: "absolute",
        top: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "6px",
        zIndex: 1000,
        background: "rgba(255, 255, 255, 0.9)",
        padding: "8px",
        borderRadius: "20px",
        backdropFilter: "blur(10px)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}>
        {filterButtons.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: "6px 12px",
              borderRadius: "16px",
              background: filter === f.id ? PINTEREST.primary : "transparent",
              color: filter === f.id ? "white" : PINTEREST.textDark,
              fontSize: "12px",
              fontWeight: "600",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              border: "none",
            }}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        style={{ 
          width: "100%", 
          height: "100%",
        }} 
      />

      {/* Offers count */}
      {!loading && !error && (
        <div style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255, 255, 255, 0.95)",
          padding: "10px 20px",
          borderRadius: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          zIndex: 1001,
          backdropFilter: "blur(10px)",
          border: `1px solid ${PINTEREST.border}`,
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: "14px",
            fontWeight: "600",
            color: PINTEREST.textDark,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <FaMapMarkerAlt /> {filteredOffers.length} books nearby
          </p>
        </div>
      )}

      {/* Selected Offer Detail Modal */}
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
                width: "100%",
                height: "100%",
                background: PINTEREST.overlay,
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

                {/* Content */}
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
                      icon: FaBookmark, 
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

      {/* Loading */}
      {loading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255, 255, 255, 0.9)",
          zIndex: 2002,
        }}>
          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            textAlign: "center",
            border: `1px solid ${PINTEREST.border}`,
          }}>
            <div style={{ 
              width: "50px", 
              height: "50px", 
              border: `3px solid ${PINTEREST.primary}`,
              borderTopColor: "transparent",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite"
            }} />
            <p style={{ 
              margin: 0, 
              color: PINTEREST.textDark,
              fontSize: "16px",
              fontWeight: "600",
            }}>
              Loading Map...
            </p>
            <p style={{ 
              margin: "8px 0 0", 
              color: PINTEREST.textLight,
              fontSize: "14px",
            }}>
              Finding books near you
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2002,
        }}>
          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            textAlign: "center",
            border: `1px solid ${PINTEREST.border}`,
            maxWidth: "300px",
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
            <h3 style={{ 
              fontSize: "18px", 
              fontWeight: "600", 
              color: PINTEREST.textDark, 
              marginBottom: "8px" 
            }}>
              Unable to load map
            </h3>
            <p style={{ 
              color: PINTEREST.textLight, 
              marginBottom: "20px", 
              fontSize: "14px",
              lineHeight: 1.5,
            }}>
              {error}
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => fetchOffers()}
                style={{
                  padding: "10px 20px",
                  background: PINTEREST.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => navigate(-1)}
                style={{
                  padding: "10px 20px",
                  background: PINTEREST.grayLight,
                  color: PINTEREST.textDark,
                  border: `1px solid ${PINTEREST.border}`,
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

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
        
        input:focus {
          outline: none;
          border-color: ${PINTEREST.primary} !important;
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
      `}</style>
    </div>
  );
}