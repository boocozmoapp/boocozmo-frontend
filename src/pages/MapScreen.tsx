/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/MapScreen.tsx - GREEN ENERGY THEME: Full Navigation Fixed
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
  FaComments,
  FaFilter,
  FaSync,
  FaPlus,
  FaBookOpen,
  FaHome,
  FaMapMarkedAlt,
  FaCompass,
  FaUsers,
  FaBell,
  FaCog,
  FaStar,
  FaBars,
  FaBookmark as FaBookmarkSolid,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api";

const GREEN = {
  dark: "#0F2415",
  medium: "#1A3A2A",
  accent: "#4A7C59",
  accentLight: "#6BA87A",
  textPrimary: "#E8F0E8",
  textSecondary: "#A8B8A8",
  textMuted: "#80A080",
  border: "rgba(74, 124, 89, 0.3)",
  grayLight: "#2A4A3A",
  hoverBg: "#255035",
  icon: "#80A080",
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
  visibility: "public" | "private";
  state: "open" | "closed";
  publishedAt?: string;
};

type Props = {
  currentUser: { 
    email: string; 
    name: string; 
    id: string;
    token: string;
  };
  onAddPress?: () => void;
  onProfilePress?: () => void;
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

const createMarkerIcon = (() => {
  const iconCache = new Map<string, L.DivIcon>();
  
  return (type: string, isSelected: boolean = false) => {
    const cacheKey = `${type}_${isSelected}`;
    
    if (iconCache.has(cacheKey)) {
      return iconCache.get(cacheKey)!;
    }

    const colors = {
      sell: GREEN.accent,
      buy: "#1D9BF0",
      exchange: "#00A86B"
    };

    const icons = {
      sell: '$',
      buy: '📖',
      exchange: '⇄'
    };

    const color = colors[type as keyof typeof colors] || GREEN.accent;
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
          alignItems: center;
          justify-content: center;
          color: white;
          font-size: ${isSelected ? '20px' : '16px'};
          font-weight: ${isSelected ? 'bold' : 'normal'};
          box-shadow: 0 ${isSelected ? '4px' : '2px'} ${isSelected ? '16px' : '8px'} rgba(0,0,0,0.4);
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

export default function MapScreen({ currentUser, onProfilePress }: Props) {
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

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
    
    setImageErrors({});

    try {
      let endpoint = `${API_BASE}/offers`;
      if (searchQuery.trim()) {
        endpoint = `${API_BASE}/search-offers?query=${encodeURIComponent(searchQuery)}&`;
      } else {
        endpoint += "?";
      }
      endpoint += `limit=100`;

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

      setOffers(processed);
      
      const likes: Record<number, boolean> = {};
      const saves: Record<number, boolean> = {};
      processed.forEach(offer => {
        likes[offer.id] = Math.random() > 0.5;
        saves[offer.id] = Math.random() > 0.7;
      });
      setIsLiked(likes);
      setIsSaved(saves);
      setError(null);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error:", err);
        setError(err.message || "Failed to load books");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser.token, searchQuery]);

  useEffect(() => {
    fetchOffers();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchOffers]);

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

  const filteredOffers = useMemo(() => {
    let result = offers.filter(offer => 
      offer.latitude && 
      offer.longitude &&
      offer.visibility === "public" && 
      offer.state === "open"
    );

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

  const handleMarkerClick = useCallback((offer: Offer) => {
    setSelectedOffer(offer);
    
    if (mapInstance.current && offer.latitude && offer.longitude) {
      mapInstance.current.setView([offer.latitude, offer.longitude], 15, {
        animate: true,
        duration: 0.5
      });
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || loading) return;

    let centerLat = 40.7128;
    let centerLng = -74.0060;
    
    if (userLocation) {
      centerLat = userLocation.lat;
      centerLng = userLocation.lng;
    } else if (filteredOffers.length > 0) {
      centerLat = filteredOffers[0].latitude!;
      centerLng = filteredOffers[0].longitude!;
    }

    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
      }).setView([centerLat, centerLng], 13);
      
      mapInstance.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);
    }

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

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

  // Full navigation items - same as other screens
  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaMapMarkedAlt, label: "Map", active: true, onClick: () => {} },
    { icon: FaBookOpen, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaCompass, label: "Discover", onClick: () => navigate("/discover") },
    { icon: FaBookmark, label: "Saved", onClick: () => navigate("/saved") },
    { icon: FaUsers, label: "Following", onClick: () => navigate("/following") },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
    { icon: FaBell, label: "Notifications", onClick: () => navigate("/notifications") },
    { icon: FaStar, label: "Top Picks", onClick: () => navigate("/top-picks") },
  ];

  const filterButtons = [
    { id: "all" as const, label: "All", icon: <FaFilter size={12} /> },
    { id: "sell" as const, label: "For Sale", icon: <FaDollarSign size={12} /> },
    { id: "exchange" as const, label: "Exchange", icon: <FaExchangeAlt size={12} /> },
    { id: "buy" as const, label: "Wanted", icon: <FaTag size={12} /> },
  ];

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

  const handleCloseDetail = useCallback(() => {
    setSelectedOffer(null);
  }, []);

  return (
    <div style={{ 
      height: "100vh", 
      width: "100vw", 
      background: GREEN.dark,
      display: "flex", 
      overflow: "hidden",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Sidebar Navigation - Now fully functional */}
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
          zIndex: 2000,
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
          onClick={onProfilePress || (() => navigate("/profile"))}
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
              onClick={() => {
                item.onClick();
                setSidebarOpen(false); // ← Closes sidebar after navigation
              }}
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
          onClick={() => {
            navigate("/offer"); // ← Fixed: navigates to OfferScreen
            setSidebarOpen(false);
          }}
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
          onClick={() => {
            navigate("/settings");
            setSidebarOpen(false);
          }}
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
          zIndex: 1000,
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
                      fetchOffers();
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
            {filterButtons.map((filterBtn) => (
              <motion.button
                key={filterBtn.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setFilter(filterBtn.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "16px",
                  background: filter === filterBtn.id ? GREEN.accent : GREEN.grayLight,
                  color: filter === filterBtn.id ? "white" : GREEN.textPrimary,
                  fontSize: "12px",
                  fontWeight: filter === filterBtn.id ? "600" : "500",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                  border: "none",
                  flexShrink: 0,
                }}
              >
                {filterBtn.icon}
                {filterBtn.label}
              </motion.button>
            ))}
          </div>
        </header>

        {/* Map Container */}
        <div 
          ref={mapRef} 
          style={{ 
            flex: 1,
            width: "100%",
            position: "relative",
          }} 
        />

        {/* Refresh Button */}
        <div style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
        }}>
          <button
            onClick={() => fetchOffers(true)}
            disabled={refreshing}
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: GREEN.accent,
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "20px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <FaSync className={refreshing ? "spin" : ""} />
          </button>
        </div>

        {/* Offers count */}
        {!loading && !error && (
          <div style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(26, 58, 42, 0.9)",
            padding: "10px 20px",
            borderRadius: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 1000,
            border: `1px solid ${GREEN.border}`,
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: "14px",
              fontWeight: "600",
              color: GREEN.textPrimary,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <FaMapMarkerAlt /> {filteredOffers.length} books nearby
            </p>
          </div>
        )}
      </div>

      {/* Selected Offer Detail Modal */}
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
                zIndex: 3000,
              }}
            />
            <div style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 3001,
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
          background: "rgba(15, 36, 21, 0.9)",
          zIndex: 4000,
        }}>
          <div style={{
            background: GREEN.medium,
            padding: "30px",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            textAlign: "center",
            border: `1px solid ${GREEN.border}`,
          }}>
            <div style={{ 
              width: "50px", 
              height: "50px", 
              border: `3px solid ${GREEN.accent}`,
              borderTopColor: "transparent",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite"
            }} />
            <p style={{ 
              margin: 0, 
              color: GREEN.textPrimary,
              fontSize: "16px",
              fontWeight: "600",
            }}>
              Loading Map...
            </p>
            <p style={{ 
              margin: "8px 0 0", 
              color: GREEN.textSecondary,
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
          zIndex: 4000,
        }}>
          <div style={{
            background: GREEN.medium,
            padding: "30px",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            textAlign: "center",
            border: `1px solid ${GREEN.border}`,
            maxWidth: "300px",
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(255, 107, 107, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "24px",
              color: "#FF6B6B",
            }}>
              <FaBookOpen />
            </div>
            <h3 style={{ 
              fontSize: "18px", 
              fontWeight: "600", 
              color: GREEN.textPrimary, 
              marginBottom: "8px" 
            }}>
              Unable to load map
            </h3>
            <p style={{ 
              color: GREEN.textSecondary, 
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
                  background: GREEN.accent,
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
                  background: GREEN.grayLight,
                  color: GREEN.textPrimary,
                  border: `1px solid ${GREEN.border}`,
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
        
        .custom-marker {
          transition: transform 0.3s ease !important;
        }
        
        .custom-marker:hover {
          transform: scale(1.2);
        }
        
        input:focus {
          outline: none;
          border-color: ${GREEN.accent} !important;
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