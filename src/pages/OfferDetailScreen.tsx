// src/pages/OfferDetailScreen.tsx
import { useEffect, useState } from "react";
import { FaArrowLeft, FaDollarSign, FaExchangeAlt, FaTag, FaMapMarkerAlt, FaUser, FaComments } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";

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
  latitude: number | null;
  longitude: number | null;
  ownerName?: string;
  distance?: string | null;
  description?: string;
  genre?: string;
  author?: string;
};

type OfferDetailScreenProps = {
  currentUser: { email: string; name: string; id: string };
};

export default function OfferDetailScreen({ currentUser }: OfferDetailScreenProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        // Try to fetch from backend
        const response = await fetch(`${API_BASE}/offers/${id}`);
        if (response.ok) {
          const data = await response.json();
          setOffer(data);
        } else {
          // Fallback to mock data
          setOffer(getMockOffer(parseInt(id || "1")));
        }
      } catch (err) {
        console.error("Error fetching offer:", err);
        setOffer(getMockOffer(parseInt(id || "1")));
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [id]);

  const getMockOffer = (offerId: number): Offer => {
  const mockOffers: Offer[] = [  // Add type annotation here
    {
      id: 1,
      type: "sell" as const,  // Add "as const"
      bookTitle: "The Great Gatsby",
      exchangeBook: null,
      price: 12.99,
      condition: "Excellent",
      ownerEmail: "john@example.com",
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      latitude: 40.7128,
      longitude: -74.0060,
      ownerName: "John Doe",
      distance: "1.2km",
      description: "Classic novel in perfect condition. Hardcover edition.",
      genre: "Fiction, Classic",
      author: "F. Scott Fitzgerald"
    },
    {
      id: 2,
      type: "exchange" as const,  // Add "as const"
      bookTitle: "To Kill a Mockingbird",
      exchangeBook: "1984 by George Orwell",
      price: null,
      condition: "Good",
      ownerEmail: "jane@example.com",
      imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      latitude: 40.7580,
      longitude: -73.9855,
      ownerName: "Jane Smith",
      distance: "2.5km",
      description: "Looking to exchange for dystopian novels.",
      genre: "Fiction, Classic",
      author: "Harper Lee"
    },
  ];
  return mockOffers.find(o => o.id === offerId) || mockOffers[0];
};

  const handleChat = () => {
    if (!offer) return;
    
    // Navigate to chat with offer info
    const mockChatId = Date.now();
    navigate(`/chat/${mockChatId}`, {
      state: {
        chat: {
          id: mockChatId,
          user1: currentUser.email,
          user2: offer.ownerEmail,
          other_user_name: offer.ownerName || "Book Seller",
          offer_title: offer.bookTitle,
          offer_id: offer.id
        }
      }
    });
  };

  if (loading) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#f5f0e6"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "3px solid #CD7F32",
            borderTopColor: "transparent",
            borderRadius: "50%",
            margin: "0 auto 20px",
            animation: "spin 1s linear infinite",
          }} />
          <p style={{ color: "#CD7F32" }}>Loading offer details...</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#f5f0e6"
      }}>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p style={{ color: "#d32f2f", marginBottom: "20px" }}>Offer not found</p>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "12px 24px",
              background: "#CD7F32",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#f5f0e6",
      fontFamily: "'Georgia', 'Times New Roman', serif" 
    }}>
      {/* Header */}
      <header style={{
        background: "white",
        padding: "16px",
        borderBottom: "1px solid #e0e0e0",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            color: "#CD7F32",
            cursor: "pointer",
          }}
        >
          <FaArrowLeft />
        </button>
        <h1 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, flex: 1 }}>
          Book Details
        </h1>
      </header>

      {/* Content */}
      <main style={{ padding: "20px" }}>
        {/* Book Image */}
        <div style={{
          height: "300px",
          background: `url(${offer.imageUrl || "https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: "12px",
          marginBottom: "20px",
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            background: "rgba(255,255,255,0.9)",
            padding: "8px 16px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "bold",
            color: offer.type === "sell" ? "#CD7F32" : 
                  offer.type === "exchange" ? "#B87333" : "#E6B17E"
          }}>
            {offer.type === "sell" && <FaDollarSign />}
            {offer.type === "exchange" && <FaExchangeAlt />}
            {offer.type === "buy" && <FaTag />}
            {offer.type.charAt(0).toUpperCase() + offer.type.slice(1)}
            {offer.type === "sell" && offer.price && ` • $${offer.price.toFixed(2)}`}
          </div>
        </div>

        {/* Book Info */}
        <div style={{ 
          background: "white", 
          borderRadius: "12px", 
          padding: "20px",
          marginBottom: "16px",
          boxShadow: "0 2px 8px rgba(205, 127, 50, 0.1)"
        }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 8px", color: "#1a1a1a" }}>
            {offer.bookTitle}
          </h1>
          
          {offer.author && (
            <p style={{ fontSize: "16px", color: "#666", margin: "0 0 16px" }}>
              by {offer.author}
            </p>
          )}

          {offer.description && (
            <div style={{ marginTop: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 8px", color: "#1a1a1a" }}>
                Description
              </h3>
              <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.6 }}>
                {offer.description}
              </p>
            </div>
          )}

          {offer.condition && (
            <div style={{ marginTop: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 8px", color: "#1a1a1a" }}>
                Condition
              </h3>
              <p style={{ fontSize: "15px", color: "#CD7F32" }}>
                {offer.condition}
              </p>
            </div>
          )}

          {offer.type === "exchange" && offer.exchangeBook && (
            <div style={{ marginTop: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 8px", color: "#1a1a1a" }}>
                Looking to exchange for
              </h3>
              <p style={{ fontSize: "15px", color: "#B87333", fontWeight: "600" }}>
                {offer.exchangeBook}
              </p>
            </div>
          )}
        </div>

        {/* Seller Info */}
        <div style={{ 
          background: "white", 
          borderRadius: "12px", 
          padding: "20px",
          marginBottom: "16px",
          boxShadow: "0 2px 8px rgba(205, 127, 50, 0.1)"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 16px", color: "#1a1a1a" }}>
            Seller Information
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "#CD7F32",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: "18px",
            }}>
              <FaUser />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 4px", color: "#1a1a1a" }}>
                {offer.ownerName || "Unknown User"}
              </p>
              {offer.distance && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#666" }}>
                  <FaMapMarkerAlt size={12} />
                  {offer.distance} away
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Action Button */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "white",
        padding: "16px 20px",
        borderTop: "1px solid #e0e0e0",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
      }}>
        <button
          onClick={handleChat}
          style={{
            width: "100%",
            padding: "16px",
            background: "linear-gradient(135deg, #CD7F32, #B87333)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(205, 127, 50, 0.3)",
          }}
        >
          <FaComments />
          Chat with Seller
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}