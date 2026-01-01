// src/pages/HomeScreen.tsx - UPDATED TO HANDLE BASE64 IMAGES
import { useEffect, useState } from "react";
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
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

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
  imageBase64: string | null; // NEW: Add base64 field
  latitude: number | null;
  longitude: number | null;
  ownerName?: string;
  distance?: string | null;
  description?: string;
  genre?: string;
  author?: string;
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
};

export default function HomeScreen({
  currentUser,
  onAddPress,
  onProfilePress,
  onMapPress,
}: Props) {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
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

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Location access denied:", error);
          // Default to a central location if permission denied
          setUserLocation({ lat: 40.7128, lng: -74.006 });
        }
      );
    } else {
      setUserLocation({ lat: 40.7128, lng: -74.006 });
    }
  }, []);

  // Fetch offers from backend
  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/offers`);
        if (!response.ok) throw new Error("Failed to fetch offers");

        const data = await response.json();
        console.log("Fetched offers:", data.length);

        // Process offers with images
        const processedOffers = data.map((offer: Offer) => {
          // If image is base64, ensure it's properly formatted
          let processedImage = offer.imageUrl;
          
          // Check if image is a base64 string (starts with data:image)
          if (offer.imageUrl && offer.imageUrl.startsWith('data:image')) {
            // Already base64, use as is
            processedImage = offer.imageUrl;
          } 
          // Some backends might store base64 in a different field
          else if (offer.imageBase64) {
            processedImage = offer.imageBase64;
          }
          
          // Calculate distance if user location is available
          if (userLocation && offer.latitude && offer.longitude) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              offer.latitude,
              offer.longitude
            );
            return {
              ...offer,
              imageUrl: processedImage,
              distance:
                distance < 1
                  ? `${Math.round(distance * 1000)}m`
                  : `${distance.toFixed(1)}km`,
            };
          }
          return { ...offer, imageUrl: processedImage, distance: null };
        });

        setOffers(processedOffers);
        setFilteredOffers(processedOffers);
      } catch (err) {
        console.error("Error fetching offers:", err);
        setError(err instanceof Error ? err.message : "Failed to load offers");
        // For demo purposes, show some mock data
        const mockOffers = getMockOffers();
        setOffers(mockOffers);
        setFilteredOffers(mockOffers);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [userLocation]);

  // Filter offers based on search and filter
  useEffect(() => {
    let result = offers;

    // Apply type filter
    if (selectedFilter !== "all") {
      result = result.filter((offer) => offer.type === selectedFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (offer) =>
          offer.bookTitle.toLowerCase().includes(query) ||
          offer.description?.toLowerCase().includes(query) ||
          offer.author?.toLowerCase().includes(query) ||
          offer.genre?.toLowerCase().includes(query) ||
          (offer.exchangeBook &&
            offer.exchangeBook.toLowerCase().includes(query))
      );
    }

    setFilteredOffers(result);
  }, [searchQuery, selectedFilter, offers]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
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
  };

  // Get image source - handles both URLs and base64
  const getImageSource = (offer: Offer): string => {
    // If imageUrl is base64, use it directly
    if (offer.imageUrl && offer.imageUrl.startsWith('data:image')) {
      return offer.imageUrl;
    }
    
    // If there's a base64 field, use it
    if (offer.imageBase64) {
      return offer.imageBase64;
    }
    
    // Otherwise use the imageUrl or fallback
    return offer.imageUrl || "https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
  };

  // Mock data for demo
  const getMockOffers = (): Offer[] => {
    return [
      {
        id: 1,
        type: "sell",
        bookTitle: "The Great Gatsby",
        exchangeBook: null,
        price: 12.99,
        condition: "Excellent",
        ownerEmail: "john@example.com",
        imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        imageBase64: null,
        latitude: 40.7128,
        longitude: -74.006,
        ownerName: "John Doe",
        distance: "1.2km",
        description: "Classic novel in perfect condition",
        genre: "Fiction",
        author: "F. Scott Fitzgerald",
      },
      {
        id: 2,
        type: "exchange",
        bookTitle: "To Kill a Mockingbird",
        exchangeBook: "1984 by George Orwell",
        price: null,
        condition: "Good",
        ownerEmail: "jane@example.com",
        imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        imageBase64: null,
        latitude: 40.758,
        longitude: -73.9855,
        ownerName: "Jane Smith",
        distance: "2.5km",
        description: "Looking to exchange for dystopian novels",
        genre: "Fiction",
        author: "Harper Lee",
      },
      {
        id: 3,
        type: "buy",
        bookTitle: "Atomic Habits",
        exchangeBook: null,
        price: 15.5,
        condition: "Like New",
        ownerEmail: "alex@example.com",
        imageUrl: "https://images.unsplash.com/photo-1531346688376-ab6275c4725e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        imageBase64: null,
        latitude: 40.7505,
        longitude: -73.9934,
        ownerName: "Alex Johnson",
        distance: "0.8km",
        description: "Self-help book in excellent condition",
        genre: "Non-fiction",
        author: "James Clear",
      },
      {
        id: 4,
        type: "sell",
        bookTitle: "The Hobbit",
        exchangeBook: null,
        price: 18.75,
        condition: "Very Good",
        ownerEmail: "sam@example.com",
        imageUrl: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        imageBase64: null,
        latitude: 40.7648,
        longitude: -73.9808,
        ownerName: "Sam Wilson",
        distance: "3.1km",
        description: "Fantasy adventure book",
        genre: "Fantasy",
        author: "J.R.R. Tolkien",
      },
    ];
  };

  const handleOfferPress = (offerId: number) => {
    navigate(`/offer/${offerId}`);
  };

  const handleLike = async (offerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Liked offer:", offerId);
    // TODO: Implement like functionality
  };

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
            title: offer.bookTitle.substring(0, 50), // Limit title length
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
      // Fallback: navigate to offer detail
      navigate(`/offer/${offer.id}`);
    }
  };

  const renderOfferCard = (offer: Offer) => (
    <motion.div
      key={offer.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "16px",
        marginBottom: "16px",
        boxShadow: "0 4px 20px rgba(205, 127, 50, 0.1)",
        border: `1px solid ${BRONZE.pale}`,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
      onClick={() => handleOfferPress(offer.id)}
    >
      {/* Bronze accent line */}
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

      {/* Top row: Image and basic info */}
      <div style={{ display: "flex", gap: "16px" }}>
        {/* Book Image */}
        <div
          style={{
            width: "100px",
            height: "140px",
            borderRadius: "12px",
            overflow: "hidden",
            flexShrink: 0,
            border: `2px solid ${BRONZE.pale}`,
            position: "relative",
          }}
        >
          <img
            src={getImageSource(offer)}
            alt={offer.bookTitle}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.src = "https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
            }}
          />
          {/* Loading indicator for base64 images */}
          {offer.imageUrl && offer.imageUrl.startsWith('data:image') && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(255,255,255,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                color: BRONZE.primary,
              }}
            >
              Loading...
            </div>
          )}
        </div>

        {/* Book Info */}
        <div style={{ flex: 1 }}>
          {/* Type badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "20px",
              background:
                offer.type === "sell"
                  ? `${BRONZE.primary}15`
                  : offer.type === "exchange"
                  ? `${BRONZE.dark}15`
                  : `${BRONZE.light}15`,
              color:
                offer.type === "sell"
                  ? BRONZE.primary
                  : offer.type === "exchange"
                  ? BRONZE.dark
                  : BRONZE.light,
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "8px",
              border: `1px solid ${
                offer.type === "sell"
                  ? BRONZE.primary
                  : offer.type === "exchange"
                  ? BRONZE.dark
                  : BRONZE.light
              }30`,
            }}
          >
            {offer.type === "sell" && <FaDollarSign size={10} />}
            {offer.type === "exchange" && <FaExchangeAlt size={10} />}
            {offer.type === "buy" && <FaTag size={10} />}
            {offer.type.charAt(0).toUpperCase() + offer.type.slice(1)}
          </div>

          {/* Book Title */}
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              margin: "0 0 4px",
              color: BRONZE.dark,
            }}
          >
            {offer.bookTitle}
          </h3>

          {/* Author */}
          {offer.author && (
            <p
              style={{
                fontSize: "14px",
                color: BRONZE.dark,
                opacity: 0.8,
                margin: "0 0 4px",
              }}
            >
              by {offer.author}
            </p>
          )}

          {/* Condition */}
          {offer.condition && (
            <p
              style={{
                fontSize: "13px",
                color: BRONZE.primary,
                margin: "0 0 8px",
                fontWeight: 500,
              }}
            >
              Condition: {offer.condition}
            </p>
          )}

          {/* Price or Exchange */}
          <div style={{ marginBottom: "8px" }}>
            {offer.type === "sell" && offer.price && (
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: BRONZE.primary,
                }}
              >
                ${offer.price.toFixed(2)}
              </div>
            )}
            {offer.type === "exchange" && offer.exchangeBook && (
              <div
                style={{
                  fontSize: "14px",
                  color: BRONZE.dark,
                  fontWeight: 600,
                }}
              >
                For: {offer.exchangeBook}
              </div>
            )}
          </div>

          {/* Location */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              color: BRONZE.dark,
              opacity: 0.7,
            }}
          >
            <FaMapMarkerAlt size={10} />
            {offer.distance || "Nearby"}
            {offer.ownerName && ` • ${offer.ownerName}`}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginTop: "16px",
          paddingTop: "12px",
          borderTop: `1px solid ${BRONZE.pale}`,
        }}
      >
        <button
          onClick={(e) => handleLike(offer.id, e)}
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
          onClick={(e) => handleChat(offer, e)}
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
          onClick={(e) => handleShare(offer.id, e)}
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
  );

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: BRONZE.bgLight,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "60px 20px 20px 20px",
          background: `linear-gradient(135deg, ${BRONZE.dark} 0%, ${BRONZE.primary} 100%)`,
          color: "white",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `radial-gradient(${BRONZE.light}20 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
            opacity: 0.2,
          }}
        />

        {/* Welcome message */}
        <div style={{ marginBottom: "16px", position: "relative", zIndex: 1 }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              margin: "0 0 4px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            <FaBookOpen />
            Welcome back, {currentUser.name}!
          </h1>
          <p style={{ fontSize: "14px", opacity: 0.9, margin: 0 }}>
            Discover books near you
          </p>
        </div>

        {/* Search bar */}
        <div
          style={{
            position: "relative",
            marginBottom: "16px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: BRONZE.primary,
            }}
          >
            <FaSearch />
          </div>
          <input
            type="text"
            placeholder="Search books, authors, genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 14px 14px 44px",
              borderRadius: "12px",
              border: "none",
              fontSize: "16px",
              background: "white",
              boxShadow: "0 4px 20px rgba(205, 127, 50, 0.15)",
              fontFamily: "'Georgia', serif",
            }}
          />
        </div>

        {/* Filter buttons */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "4px",
            scrollbarWidth: "none",
            zIndex: 1,
          }}
        >
          {[
            { id: "all", label: "All", icon: <FaFilter /> },
            { id: "sell", label: "For Sale", icon: <FaDollarSign /> },
            { id: "exchange", label: "Exchange", icon: <FaExchangeAlt /> },
            { id: "buy", label: "Wanted", icon: <FaTag /> },
          ].map((filter) => (
            <button
              key={filter.id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={() => setSelectedFilter(filter.id as any)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: `2px solid ${
                  selectedFilter === filter.id
                    ? "white"
                    : "rgba(255,255,255,0.3)"
                }`,
                background:
                  selectedFilter === filter.id ? "white" : "transparent",
                color: selectedFilter === filter.id ? BRONZE.primary : "white",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.3s ease",
              }}
            >
              {filter.icon}
              {filter.label}
            </button>
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
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div
              style={{
                width: "50px",
                height: "50px",
                border: `3px solid ${BRONZE.primary}`,
                borderTopColor: "transparent",
                borderRadius: "50%",
                margin: "0 auto 20px",
                animation: "spin 1s linear infinite",
              }}
            />
            <p style={{ color: BRONZE.primary }}>Loading books...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "#d32f2f" }}>{error}</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <FaBookOpen
              size={48}
              color={BRONZE.light}
              style={{ marginBottom: "16px", opacity: 0.5 }}
            />
            <h3 style={{ color: BRONZE.dark, marginBottom: "8px" }}>
              No books found
            </h3>
            <p style={{ color: BRONZE.dark, opacity: 0.7 }}>
              {searchQuery
                ? "Try a different search"
                : "Be the first to post a book!"}
            </p>
            {!searchQuery && (
              <button
                onClick={onAddPress}
                style={{
                  marginTop: "20px",
                  padding: "12px 24px",
                  background: BRONZE.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  margin: "20px auto 0",
                }}
              >
                <FaPlus />
                Post a Book
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filteredOffers.map(renderOfferCard)}
          </AnimatePresence>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "12px 0",
          borderTop: `1px solid ${BRONZE.pale}`,
          background: "white",
          position: "fixed",
          bottom: 0,
          width: "100%",
          zIndex: 100,
          boxShadow: "0 -4px 20px rgba(205, 127, 50, 0.1)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            color: BRONZE.primary,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: "24px",
            cursor: "pointer",
            padding: "8px",
          }}
        >
          <FaBookOpen />
          <span style={{ fontSize: "10px", marginTop: "4px" }}>Home</span>
        </button>

        <button
          onClick={onMapPress}
          style={{
            background: "none",
            border: "none",
            color: BRONZE.dark,
            opacity: 0.7,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: "24px",
            cursor: "pointer",
            padding: "8px",
          }}
        >
          <FaMapMarkedAlt />
          <span style={{ fontSize: "10px", marginTop: "4px" }}>Map</span>
        </button>

        <button
          onClick={onAddPress}
          style={{
            background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
            border: "none",
            color: "white",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            cursor: "pointer",
            marginTop: "-20px",
            boxShadow: `0 4px 20px ${BRONZE.primary}40`,
          }}
        >
          <FaPlus />
        </button>

        <button
          onClick={() => navigate("/chat")}
          style={{
            background: "none",
            border: "none",
            color: BRONZE.dark,
            opacity: 0.7,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: "24px",
            cursor: "pointer",
            padding: "8px",
          }}
        >
          <FaComments />
          <span style={{ fontSize: "10px", marginTop: "4px" }}>Chat</span>
        </button>

        <button
          onClick={onProfilePress}
          style={{
            background: "none",
            border: "none",
            color: BRONZE.dark,
            opacity: 0.7,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: "24px",
            cursor: "pointer",
            padding: "8px",
          }}
        >
          <FaUser />
          <span style={{ fontSize: "10px", marginTop: "4px" }}>Profile</span>
        </button>
      </nav>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: ${BRONZE.pale};
        }
        ::-webkit-scrollbar-thumb {
          background: ${BRONZE.light};
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${BRONZE.primary};
        }
      `}</style>
    </div>
  );
}