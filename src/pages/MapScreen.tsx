// src/pages/MapScreen.tsx - FIXED WITH CHAT FUNCTIONALITY & RESPONSIVE CARD
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
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
  FaBook
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Bronze color palette
const BRONZE = {
  primary: "#CD7F32",
  light: "#E6B17E",
  dark: "#B87333",
  pale: "#F5E7D3",
  bg: "#F9F5F0",
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
};

// Define props type
type Props = {
  onBack?: () => void;
  currentUser: { 
    email: string; 
    name: string;
    id: string;
  };
};

export default function MapScreen({ onBack, currentUser }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [filter, setFilter] = useState<"all" | "sell" | "buy" | "exchange">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get image source - handles both URLs and base64
  const getImageSource = (offer: Offer): string => {
    if (offer.imageUrl && offer.imageUrl.startsWith('data:image')) {
      return offer.imageUrl;
    }
    if (offer.imageBase64) {
      return offer.imageBase64;
    }
    return offer.imageUrl || "https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
  };

  // Fetch offers from backend
  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/offers`);
        if (!response.ok) throw new Error("Failed to fetch offers");

        const data = await response.json();
        setOffers(data);
      } catch (err) {
        console.error("Error fetching offers:", err);
        setError(err instanceof Error ? err.message : "Failed to load offers");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  // Filter offers based on search and filter
  const filteredOffers = offers.filter(offer => {
    // Apply type filter
    if (filter !== "all" && offer.type !== filter) {
      return false;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        offer.bookTitle.toLowerCase().includes(query) ||
        (offer.description && offer.description.toLowerCase().includes(query)) ||
        (offer.author && offer.author.toLowerCase().includes(query)) ||
        (offer.genre && offer.genre.toLowerCase().includes(query)) ||
        (offer.exchangeBook && offer.exchangeBook.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Filter books that have coordinates
  const offersWithCoords = filteredOffers.filter(offer => 
    offer.latitude && offer.longitude
  );

  // Initialize map with markers
  useEffect(() => {
    if (!mapRef.current || loading) return;

    // Clean up existing map
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    // Use first offer location or default center
    let centerLat = 40.7128;
    let centerLng = -74.0060;
    
    if (offersWithCoords.length > 0) {
      centerLat = offersWithCoords[0].latitude!;
      centerLng = offersWithCoords[0].longitude!;
    }

    // Create map
    const map = L.map(mapRef.current).setView([centerLat, centerLng], 13);
    mapInstance.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create custom icons for different offer types
    const createIcon = (type: string) => {
      const color = type === 'sell' ? BRONZE.primary : 
                   type === 'buy' ? '#FF9800' : 
                   '#2196F3';
      return L.divIcon({
        className: 'book-marker',
        html: `
          <div style="
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${color};
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            ${type === 'sell' ? '$' : type === 'buy' ? '📖' : '⇄'}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      });
    };

    // Add markers for each offer
    offersWithCoords.forEach(offer => {
      if (!offer.latitude || !offer.longitude) return;

      const icon = createIcon(offer.type);
      const marker = L.marker([offer.latitude, offer.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="padding: 12px; min-width: 200px; max-width: 250px;">
            <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
              <img src="${getImageSource(offer)}" 
                   style="width: 60px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid ${BRONZE.pale};"
                   onerror="this.src='https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60';"
              />
              <div>
                <h4 style="margin: 0 0 4px; color: ${BRONZE.dark}; font-size: 14px; font-weight: 600; line-height: 1.3;">
                  ${offer.bookTitle.substring(0, 30)}${offer.bookTitle.length > 30 ? '...' : ''}
                </h4>
                ${offer.author ? `<p style="margin: 0 0 4px; color: #666; font-size: 11px;">by ${offer.author}</p>` : ''}
                <div style="
                  background: ${offer.type === 'sell' ? BRONZE.primary : 
                              offer.type === 'buy' ? '#FF9800' : 
                              '#2196F3'}15;
                  color: ${offer.type === 'sell' ? BRONZE.primary : 
                          offer.type === 'buy' ? '#FF9800' : 
                          '#2196F3'};
                  padding: 3px 8px;
                  border-radius: 12px;
                  font-size: 10px;
                  font-weight: 600;
                  display: inline-block;
                  border: 1px solid ${offer.type === 'sell' ? BRONZE.primary : 
                                    offer.type === 'buy' ? '#FF9800' : 
                                    '#2196F3'}30;
                ">
                  ${offer.type === 'sell' ? 'For Sale' : 
                    offer.type === 'buy' ? 'Wanted' : 
                    'Exchange'}
                </div>
              </div>
            </div>
            
            ${offer.price ? `
              <div style="font-size: 16px; font-weight: 700; color: ${BRONZE.primary}; margin: 8px 0;">
                $${offer.price.toFixed(2)}
              </div>
            ` : ''}
            
            <div style="
              width: 100%;
              background: ${BRONZE.primary};
              color: white;
              border: none;
              padding: 8px 12px;
              border-radius: 8px;
              margin-top: 8px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
              text-align: center;
            ">
              Click marker for details
            </div>
          </div>
        `, { maxWidth: 300 });

      // Add click handler to marker
      marker.on('click', () => {
        setSelectedOffer(offer);
        map.setView([offer.latitude!, offer.longitude!], 15);
      });
    });

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [offersWithCoords, loading]);

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // EXACT SAME CHAT FUNCTIONALITY AS HOMESCREEN
  const handleChat = async (offer: Offer, e: React.MouseEvent) => {
    e.stopPropagation();

    // Don't create chat if user is viewing their own offer
    if (offer.ownerEmail === currentUser.email) {
      navigate(`/offer/${offer.id}`);
      return;
    }

    try {
      // Step 1: Try to find existing chat
      const findUrl = `${API_BASE}/find-chats?user1=${encodeURIComponent(
        currentUser.email
      )}&user2=${encodeURIComponent(offer.ownerEmail)}&offer_id=${offer.id}`;
      const findResponse = await fetch(findUrl);

      let chatId: number | null = null;

      if (findResponse.ok) {
        const chats = await findResponse.json();
        if (chats && chats.length > 0) {
          // Use the most recent chat
          chats.sort(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (a: any, b: any) =>
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime()
          );
          chatId = chats[0].id;
        }
      }

      // Step 2: If no existing chat, create one
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
          // If backend create fails, use timestamp as mock ID
          chatId = Date.now();
        }
      }

      // Step 3: Navigate to chat
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
  };

  // Handle Contact Owner button - uses the same chat function
  const handleContactOwner = () => {
    if (!selectedOffer) return;
    
    // Create a mock event object for the chat function
    const mockEvent = {
      stopPropagation: () => {},
      preventDefault: () => {}
    } as React.MouseEvent;
    
    handleChat(selectedOffer, mockEvent);
  };

  // Handle Like
  const handleLike = async (offerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Liked offer:", offerId);
    // TODO: Implement like functionality
  };

  // Handle Share
  const handleShare = async (offerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Shared offer:", offerId);
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this book!",
          text: "I found this great book on BookSphere",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    }
  };

  return (
    <div style={{ 
      width: "100%", 
      height: "100vh",
      position: "relative",
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
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(10px)",
        padding: "16px",
        zIndex: 1000,
        borderBottom: `1px solid ${BRONZE.pale}`,
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "12px",
          marginBottom: "12px",
        }}>
          <button
            onClick={handleBack}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "white",
              border: `2px solid ${BRONZE.light}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: BRONZE.dark,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <FaArrowLeft size={20} />
          </button>
          
          <div style={{ flex: 1 }}>
            <h1 style={{ 
              fontSize: "24px", 
              fontWeight: "800", 
              margin: 0, 
              color: BRONZE.dark,
            }}>
              Book Map
            </h1>
            <p style={{ 
              fontSize: "13px", 
              color: "#666", 
              margin: "2px 0 0",
            }}>
              {offers.length} books nearby • Click markers for details
            </p>
            {currentUser && (
              <p style={{ 
                fontSize: "11px", 
                color: BRONZE.primary, 
                margin: "2px 0 0",
              }}>
                Logged in as: {currentUser.name}
              </p>
            )}
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <FaSearch style={{ 
            position: "absolute", 
            left: "16px", 
            top: "50%", 
            transform: "translateY(-50%)", 
            color: BRONZE.primary,
            fontSize: "18px",
          }} />
          <input
            type="text"
            placeholder="Search books, authors, genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 12px 12px 48px",
              borderRadius: "12px",
              border: `1px solid ${BRONZE.light}`,
              background: "white",
              fontSize: "16px",
            }}
          />
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
          {(["all", "sell", "buy", "exchange"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                background: filter === f ? BRONZE.primary : BRONZE.pale,
                color: filter === f ? "white" : BRONZE.dark,
                fontSize: "14px",
                fontWeight: filter === f ? "600" : "500",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {f === "sell" && <FaDollarSign size={10} />}
              {f === "buy" && <FaTag size={10} />}
              {f === "exchange" && <FaExchangeAlt size={10} />}
              {f === "all" ? "All Books" : f === "sell" ? "For Sale" : f === "buy" ? "Wanted" : "Exchange"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading/Error State */}
      {loading && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "white",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          textAlign: "center",
          zIndex: 1002,
        }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: `3px solid ${BRONZE.primary}`,
            borderTopColor: "transparent",
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 1s linear infinite",
          }} />
          <p style={{ color: BRONZE.dark, margin: 0 }}>Loading books...</p>
        </div>
      )}

      {error && !loading && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "white",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          textAlign: "center",
          zIndex: 1002,
        }}>
          <p style={{ color: "#d32f2f", marginBottom: "16px" }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: BRONZE.primary,
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Book List Panel */}
      {!loading && !error && offersWithCoords.length > 0 && (
        <motion.div
          initial={{ y: 300 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", damping: 25 }}
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            right: 16,
            background: "white",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            padding: "16px",
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          <h3 style={{ 
            fontSize: "16px", 
            fontWeight: "600", 
            margin: "0 0 12px",
            color: BRONZE.dark,
          }}>
            Nearby Books ({offersWithCoords.length})
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {offersWithCoords.map(offer => (
              <div
                key={offer.id}
                onClick={() => {
                  setSelectedOffer(offer);
                  if (offer.latitude && offer.longitude && mapInstance.current) {
                    mapInstance.current.setView([offer.latitude, offer.longitude], 15);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "12px",
                  background: selectedOffer?.id === offer.id ? BRONZE.pale : "#f8f8f8",
                  cursor: "pointer",
                  border: selectedOffer?.id === offer.id ? `2px solid ${BRONZE.primary}` : "none",
                }}
              >
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: `1px solid ${BRONZE.pale}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: BRONZE.primary,
                  color: "white",
                  fontSize: "16px",
                }}>
                  {offer.imageUrl || offer.imageBase64 ? (
                    <img 
                      src={getImageSource(offer)} 
                      alt={offer.bookTitle}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <FaBook />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: "14px", 
                    fontWeight: "600", 
                    color: BRONZE.dark,
                  }}>
                    {offer.bookTitle.substring(0, 25)}{offer.bookTitle.length > 25 ? '...' : ''}
                  </div>
                  <div style={{ 
                    fontSize: "12px", 
                    color: "#666",
                    marginTop: "2px",
                  }}>
                    {offer.author || "Unknown"} • {offer.distance || "Nearby"}
                  </div>
                </div>
                {offer.price && (
                  <div style={{
                    background: BRONZE.pale,
                    color: BRONZE.dark,
                    padding: "4px 8px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}>
                    ${offer.price.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Offers Message */}
      {!loading && !error && offersWithCoords.length === 0 && (
        <div style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          padding: "24px",
          textAlign: "center",
          zIndex: 1000,
        }}>
          <FaBook size={32} color={BRONZE.light} style={{ marginBottom: "12px" }} />
          <h3 style={{ color: BRONZE.dark, marginBottom: "8px" }}>
            No books with location data
          </h3>
          <p style={{ color: BRONZE.dark, opacity: 0.7, fontSize: "14px" }}>
            {searchQuery ? "Try a different search" : "No books have location information yet"}
          </p>
        </div>
      )}

      {/* Selected Offer Details - RESPONSIVE CARD */}
      {selectedOffer && (
        <motion.div
          initial={{ x: window.innerWidth < 768 ? 0 : 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: window.innerWidth < 768 ? 0 : 400, opacity: 0 }}
          style={{
            position: "absolute",
            top: window.innerWidth < 768 ? "50%" : "auto",
            bottom: window.innerWidth < 768 ? "auto" : (offersWithCoords.length > 0 ? "220px" : "16px"),
            left: window.innerWidth < 768 ? "50%" : "16px",
            right: window.innerWidth < 768 ? "auto" : "auto",
            transform: window.innerWidth < 768 ? "translate(-50%, -50%)" : "none",
            width: window.innerWidth < 768 ? "calc(100% - 32px)" : "360px",
            maxWidth: "400px",
            background: "white",
            borderRadius: "20px",
            padding: "20px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
            zIndex: 1001,
            maxHeight: window.innerWidth < 768 ? "80vh" : "none",
            overflowY: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-start",
            marginBottom: "16px",
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                fontSize: "20px", 
                fontWeight: "700", 
                margin: "0 0 4px",
                color: BRONZE.dark,
              }}>
                {selectedOffer.bookTitle}
              </h3>
              <p style={{ 
                fontSize: "14px", 
                color: "#666", 
                margin: "0 0 8px",
              }}>
                {selectedOffer.author ? `by ${selectedOffer.author}` : "Unknown Author"}
              </p>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px",
                fontSize: "13px",
                color: "#666",
              }}>
                <FaMapMarkerAlt size={12} /> 
                {selectedOffer.distance ? `${selectedOffer.distance} away` : "Nearby"} • 
                {selectedOffer.ownerName || selectedOffer.ownerEmail.split("@")[0]}
              </div>
            </div>
            <button
              onClick={() => setSelectedOffer(null)}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                fontSize: "20px",
                cursor: "pointer",
                padding: "4px",
                marginLeft: "8px",
              }}
            >
              <FaTimes />
            </button>
          </div>

          {/* Description */}
          {selectedOffer.description && (
            <p style={{
              fontSize: "14px",
              color: "#666",
              lineHeight: 1.5,
              marginBottom: "16px",
              paddingBottom: "16px",
              borderBottom: `1px solid ${BRONZE.pale}`,
            }}>
              {selectedOffer.description}
            </p>
          )}

          {/* Price/Exchange */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            marginBottom: "20px",
            padding: "12px",
            background: BRONZE.pale,
            borderRadius: "12px",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            gap: window.innerWidth < 768 ? "16px" : "0",
          }}>
            <div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                {selectedOffer.type === "sell" ? "Price" : 
                 selectedOffer.type === "buy" ? "Looking for" : "Exchange for"}
              </div>
              <div style={{ 
                fontSize: "24px", 
                fontWeight: "800", 
                color: BRONZE.primary,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}>
                {selectedOffer.type === "sell" && selectedOffer.price ? (
                  <>
                    <FaDollarSign /> {selectedOffer.price.toFixed(2)}
                  </>
                ) : selectedOffer.type === "exchange" && selectedOffer.exchangeBook ? (
                  <>
                    <FaExchangeAlt /> Exchange
                  </>
                ) : (
                  <>
                    <FaTag /> Wanted
                  </>
                )}
              </div>
              {selectedOffer.exchangeBook && (
                <div style={{ fontSize: "14px", color: BRONZE.dark, marginTop: "4px" }}>
                  For: {selectedOffer.exchangeBook}
                </div>
              )}
            </div>
            
            <button
              onClick={handleContactOwner}
              style={{
                background: BRONZE.primary,
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background 0.2s",
                width: window.innerWidth < 768 ? "100%" : "auto",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = BRONZE.dark}
              onMouseLeave={(e) => e.currentTarget.style.background = BRONZE.primary}
            >
              Contact Owner
            </button>
          </div>

          {/* Action Buttons - Same as HomeScreen */}
          <div style={{
            display: "flex",
            justifyContent: "space-around",
            paddingTop: "12px",
            borderTop: `1px solid ${BRONZE.pale}`,
            flexWrap: window.innerWidth < 768 ? "wrap" : "nowrap",
            gap: window.innerWidth < 768 ? "8px" : "0",
          }}>
            <button
              onClick={(e) => handleLike(selectedOffer.id, e)}
              style={{
                background: "none",
                border: "none",
                color: BRONZE.primary,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                flex: window.innerWidth < 768 ? "1" : "auto",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${BRONZE.primary}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              <FaHeart />
              Like
            </button>

            <button
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              onClick={(e) => {
                const mockEvent = {
                  stopPropagation: () => {},
                  preventDefault: () => {}
                } as React.MouseEvent;
                handleChat(selectedOffer, mockEvent);
              }}
              style={{
                background: "none",
                border: "none",
                color: BRONZE.dark,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                flex: window.innerWidth < 768 ? "1" : "auto",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${BRONZE.dark}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              <FaComments />
              Chat
            </button>

            <button
              onClick={(e) => handleShare(selectedOffer.id, e)}
              style={{
                background: "none",
                border: "none",
                color: BRONZE.light,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                flex: window.innerWidth < 768 ? "1" : "auto",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${BRONZE.light}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              <FaShareAlt />
              Share
            </button>
          </div>
        </motion.div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .mobile-full-width {
            width: calc(100% - 32px) !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
}