// src/pages/ProfileScreen.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaBookOpen, 
  FaMapMarkedAlt, 
  FaPlus, 
  FaComments, 
  FaUser, 
  FaCamera, 
  FaEdit, 
  FaTrash, 
  FaHeart, 
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaBook,
  FaBookmark,
  FaStar,
  FaDollarSign
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onLogout?: () => void;
  currentUser: { email: string; name?: string };
};

type Offer = {
  id: number;
  bookTitle: string;
  price: number | null;
  imageUrl: string | null;
  state: string;
  exchangeBook?: string | null;
  condition?: "Excellent" | "Very Good" | "Good" | "Fair" | null;
  type?: "buy" | "sell" | "exchange";
  genre?: string;
  author?: string;
};

export default function ProfileScreen({ currentUser, onLogout }: Props) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [savedOffers, setSavedOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"books" | "saved" | "stats">("books");
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCondition, setEditCondition] = useState<"Excellent" | "Very Good" | "Good" | "Fair">("Excellent");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  // Bronze color palette
  const BRONZE = {
    primary: "#CD7F32",
    light: "#E6B17E",
    dark: "#B87333",
    pale: "#F5E7D3",
    shimmer: "#FFD700",
    bg: "#F9F5F0",
  };

  const username = currentUser.name || currentUser.email.split("@")[0];
  const userEmail = currentUser.email;

  // Mock stats - fetch real if backend supports
  const stats = {
    books: offers.length,
    saved: savedOffers.length,
    sold: 2, // Mock data
    posts: offers.length + savedOffers.length,
    rating: 4.8, // Mock data
    badges: 3, // Mock data
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch my offers
        const myOffersRes = await fetch(`${API_BASE}/my-offers?email=${encodeURIComponent(userEmail)}`);
        if (myOffersRes.ok) {
          const myOffersData: Offer[] = await myOffersRes.json();
          setOffers(myOffersData.filter((o: Offer) => o.state === "open"));
        }

        // Fetch saved offers
        const savedRes = await fetch(`${API_BASE}/saved-offers?email=${encodeURIComponent(userEmail)}`);
        if (savedRes.ok) {
          const savedData: Offer[] = await savedRes.json();
          setSavedOffers(savedData);
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        console.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userEmail]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;

    try {
      const res = await fetch(`${API_BASE}/my-offers/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      if (res.ok) {
        setOffers((prev) => prev.filter((o) => o.id !== id));
      } else {
        alert("Failed to delete offer");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Error deleting offer");
    }
  };

  const handleUnsave = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/unsave-offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_id: id, user_email: userEmail }),
      });

      if (res.ok) {
        setSavedOffers((prev) => prev.filter((o) => o.id !== id));
      } else {
        alert("Failed to unsave");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Error unsaving offer");
    }
  };

  const startEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setEditTitle(offer.bookTitle);
    setEditPrice(offer.price?.toString() ?? "");
    setEditCondition(offer.condition ?? "Excellent");
    setOpenMenuId(null);
  };

  const saveEdit = async () => {
    if (!editingOffer || !editTitle.trim()) return alert("Title is required");

    const priceValue = editPrice ? Number(editPrice) : null;

    try {
      const payload = {
        bookTitle: editTitle,
        price: priceValue,
        condition: editCondition,
      };

      const res = await fetch(`${API_BASE}/offers/${editingOffer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setOffers((prev) =>
          prev.map((o) =>
            o.id === editingOffer.id
              ? { ...o, bookTitle: editTitle, price: priceValue, condition: editCondition }
              : o
          )
        );
        setEditingOffer(null);
      } else {
        alert("Failed to update offer");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Error updating offer");
    }
  };

  const getOfferTypeColor = (type?: string) => {
    switch (type) {
      case "sell": return "#D1FAE5";
      case "buy": return "#FEF3C7";
      case "exchange": return "#E0E7FF";
      default: return BRONZE.pale;
    }
  };

  const getOfferTypeTextColor = (type?: string) => {
    switch (type) {
      case "sell": return "#065F46";
      case "buy": return "#92400E";
      case "exchange": return "#3730A3";
      default: return BRONZE.dark;
    }
  };

  const getOfferTypeLabel = (type?: string) => {
    switch (type) {
      case "sell": return "For Sale";
      case "buy": return "Wanted";
      case "exchange": return "Exchange";
      default: return "Active";
    }
  };

  if (loading) {
    return (
      <div style={{ 
        flex: 1, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: BRONZE.bg,
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            fontSize: "48px",
            color: BRONZE.primary,
          }}
        >
          📚
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: BRONZE.bg, 
      display: "flex", 
      flexDirection: "column",
      fontFamily: "'Georgia', 'Times New Roman', serif",
    }}>
      {/* Fixed Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ 
          background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
          padding: "24px 16px 32px",
          color: "white",
          position: "relative",
          borderBottomLeftRadius: "24px",
          borderBottomRightRadius: "24px",
          boxShadow: "0 8px 32px rgba(205, 127, 50, 0.3)",
        }}
      >
        {/* Settings and Chat Buttons */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "24px",
        }}>
          <h1 style={{ 
            fontSize: "32px", 
            fontWeight: 800, 
            margin: 0,
            fontFamily: "'Playfair Display', serif",
          }}>
            My Library
          </h1>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/chat")}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                cursor: "pointer",
                backdropFilter: "blur(4px)",
              }}
            >
              <FaComments size={20} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                cursor: "pointer",
                backdropFilter: "blur(4px)",
              }}
            >
              <FaCog size={20} />
            </motion.button>
          </div>
        </div>

        {/* User Profile Section */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div style={{ position: "relative" }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${BRONZE.light}, white)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "42px",
                color: BRONZE.dark,
                fontWeight: "bold",
                border: `4px solid white`,
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
              }}
            >
              {username[0].toUpperCase()}
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                position: "absolute",
                bottom: "0px",
                right: "0px",
                background: BRONZE.primary,
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "3px solid white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              }}
            >
              <FaCamera size={16} />
            </motion.button>
          </div>

          <div style={{ flex: 1 }}>
            <motion.h2 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ 
                fontSize: "28px", 
                fontWeight: 700, 
                margin: "0 0 6px",
                color: "white",
              }}
            >
              {username}
            </motion.h2>
            <motion.p 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ 
                fontSize: "15px", 
                opacity: 0.9, 
                margin: "0 0 12px",
                color: BRONZE.pale,
              }}
            >
              {userEmail}
            </motion.p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaStar color={BRONZE.shimmer} size={16} />
              <span style={{ fontSize: "14px", fontWeight: 600 }}>
                {stats.rating} • {stats.badges} Badges
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
          }}
        >
          {[
            { value: stats.books, label: "Books", icon: "📚", color: BRONZE.light },
            { value: stats.saved, label: "Saved", icon: "🔖", color: "#E91E63" },
            { value: stats.sold, label: "Sold", icon: "💰", color: "#4CAF50" },
            { value: stats.posts, label: "Posts", icon: "📝", color: "#2196F3" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -4 }}
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: "16px",
                padding: "16px 12px",
                textAlign: "center",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ 
                fontSize: "28px", 
                fontWeight: "bold",
                marginBottom: "6px",
                color: stat.color,
              }}>
                {stat.icon}
              </div>
              <div style={{ 
                fontSize: "20px", 
                fontWeight: "bold",
                marginBottom: "4px",
              }}>
                {stat.value}
              </div>
              <div style={{ 
                fontSize: "12px", 
                opacity: 0.9,
                fontWeight: 500,
              }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.header>

      {/* Content Area */}
      <div style={{ 
        flex: 1, 
        overflowY: "auto",
        paddingBottom: "80px",
      }}>
        {/* Tabs */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ 
            background: "white", 
            padding: "16px 20px", 
            margin: "-20px 16px 20px",
            borderRadius: "20px",
            boxShadow: "0 8px 24px rgba(205, 127, 50, 0.15)",
            display: "flex",
            justifyContent: "space-around",
            position: "relative",
            zIndex: 10,
          }}
        >
          {[
            { key: "books" as const, label: "My Books", icon: <FaBook size={18} /> },
            { key: "saved" as const, label: "Saved", icon: <FaBookmark size={18} /> },
            { key: "stats" as const, label: "Stats", icon: <FaChartLine size={18} /> },
          ].map(({ key, label, icon }) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(key)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                color: activeTab === key ? BRONZE.primary : "#94A3B8",
                fontSize: "13px",
                fontWeight: activeTab === key ? 700 : 500,
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "12px",
                transition: "all 0.3s ease",
                minWidth: "80px",
              }}
            >
              <div style={{ 
                fontSize: "20px",
                color: activeTab === key ? BRONZE.primary : "#94A3B8",
              }}>
                {icon}
              </div>
              {label}
              {activeTab === key && (
                <motion.div
                  layoutId="profileTabIndicator"
                  style={{
                    width: "24px",
                    height: "3px",
                    background: BRONZE.primary,
                    borderRadius: "2px",
                    marginTop: "4px",
                  }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <div style={{ padding: "0 16px" }}>
          {/* My Books Tab */}
          <AnimatePresence mode="wait">
            {activeTab === "books" && (
              <motion.div
                key="books"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ display: "flex", flexDirection: "column", gap: "16px" }}
              >
                {offers.length === 0 ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      textAlign: "center",
                      padding: "48px 20px",
                      background: "white",
                      borderRadius: "20px",
                      boxShadow: "0 4px 20px rgba(205, 127, 50, 0.1)",
                    }}
                  >
                    <div style={{ fontSize: "64px", marginBottom: "16px", color: BRONZE.light }}>
                      📚
                    </div>
                    <h3 style={{ 
                      fontSize: "20px", 
                      fontWeight: 700, 
                      color: BRONZE.dark,
                      marginBottom: "8px",
                    }}>
                      No Books Listed Yet
                    </h3>
                    <p style={{ 
                      fontSize: "15px", 
                      color: "#666", 
                      marginBottom: "24px",
                    }}>
                      Share your first book with the community
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/offer")}
                      style={{
                        background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
                        color: "white",
                        border: "none",
                        padding: "14px 32px",
                        borderRadius: "14px",
                        fontSize: "16px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        margin: "0 auto",
                      }}
                    >
                      <FaPlus /> Add First Book
                    </motion.button>
                  </motion.div>
                ) : (
                  offers.map((offer) => {
                    const imageUrl = offer.imageUrl 
                      ? `${API_BASE}${offer.imageUrl}`
                      : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=300&fit=crop";
                    
                    return (
                      <motion.div
                        key={offer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4 }}
                        style={{
                          background: "white",
                          borderRadius: "20px",
                          padding: "20px",
                          boxShadow: "0 8px 24px rgba(205, 127, 50, 0.12)",
                          display: "flex",
                          gap: "16px",
                          alignItems: "center",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {/* Book Image */}
                        <div style={{ position: "relative" }}>
                          <img
                            src={imageUrl}
                            alt={offer.bookTitle}
                            style={{ 
                              width: "80px", 
                              height: "110px", 
                              borderRadius: "12px", 
                              objectFit: "cover",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=300&fit=crop";
                            }}
                          />
                          {/* Status Badge */}
                          <div style={{
                            position: "absolute",
                            top: "-6px",
                            left: "-6px",
                            background: getOfferTypeColor(offer.type),
                            color: getOfferTypeTextColor(offer.type),
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: "700",
                            border: `2px solid white`,
                          }}>
                            {getOfferTypeLabel(offer.type)}
                          </div>
                        </div>

                        {/* Book Details */}
                        <div style={{ flex: 1 }}>
                          <h3 style={{ 
                            fontSize: "17px", 
                            fontWeight: 700, 
                            margin: "0 0 8px", 
                            color: BRONZE.dark,
                            lineHeight: 1.3,
                          }}>
                            {offer.bookTitle.length > 30 ? offer.bookTitle.slice(0, 30) + "..." : offer.bookTitle}
                          </h3>
                          
                          {offer.price && (
                            <p style={{ 
                              fontSize: "22px", 
                              fontWeight: "800", 
                              color: BRONZE.primary, 
                              margin: "0 0 8px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}>
                              <FaDollarSign size={16} /> {offer.price}
                            </p>
                          )}
                          
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "8px",
                            flexWrap: "wrap",
                          }}>
                            {offer.condition && (
                              <span style={{
                                background: BRONZE.pale,
                                color: BRONZE.dark,
                                padding: "6px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}>
                                {offer.condition}
                              </span>
                            )}
                            {offer.genre && (
                              <span style={{
                                background: BRONZE.pale,
                                color: BRONZE.dark,
                                padding: "6px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}>
                                {offer.genre}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Menu */}
                        <div style={{ position: "relative" }}>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setOpenMenuId(openMenuId === offer.id ? null : offer.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: BRONZE.dark,
                              fontSize: "24px",
                              cursor: "pointer",
                              padding: "8px",
                              borderRadius: "8px",
                            }}
                          >
                            ⋯
                          </motion.button>
                          
                          <AnimatePresence>
                            {openMenuId === offer.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                style={{
                                  position: "absolute",
                                  right: "0",
                                  top: "40px",
                                  background: "white",
                                  borderRadius: "16px",
                                  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2)",
                                  padding: "12px",
                                  minWidth: "140px",
                                  zIndex: 100,
                                  border: `1px solid ${BRONZE.pale}`,
                                }}
                              >
                                <motion.button
                                  whileHover={{ x: 4 }}
                                  onClick={() => startEdit(offer)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    width: "100%",
                                    padding: "10px 12px",
                                    background: "none",
                                    border: "none",
                                    color: BRONZE.dark,
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    borderRadius: "8px",
                                    transition: "all 0.3s ease",
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = BRONZE.pale}
                                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                                >
                                  <FaEdit /> Edit
                                </motion.button>
                                <motion.button
                                  whileHover={{ x: 4 }}
                                  onClick={() => handleDelete(offer.id)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    width: "100%",
                                    padding: "10px 12px",
                                    background: "none",
                                    border: "none",
                                    color: "#D32F2F",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    borderRadius: "8px",
                                    transition: "all 0.3s ease",
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = "#FFEBEE"}
                                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                                >
                                  <FaTrash /> Delete
                                </motion.button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}

            {/* Saved Tab */}
            {activeTab === "saved" && (
              <motion.div
                key="saved"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ display: "flex", flexDirection: "column", gap: "16px" }}
              >
                {savedOffers.length === 0 ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      textAlign: "center",
                      padding: "48px 20px",
                      background: "white",
                      borderRadius: "20px",
                      boxShadow: "0 4px 20px rgba(205, 127, 50, 0.1)",
                    }}
                  >
                    <div style={{ fontSize: "64px", marginBottom: "16px", color: BRONZE.light }}>
                      🔖
                    </div>
                    <h3 style={{ 
                      fontSize: "20px", 
                      fontWeight: 700, 
                      color: BRONZE.dark,
                      marginBottom: "8px",
                    }}>
                      No Saved Books
                    </h3>
                    <p style={{ 
                      fontSize: "15px", 
                      color: "#666", 
                      marginBottom: "24px",
                    }}>
                      Save books you're interested in for later
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/")}
                      style={{
                        background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
                        color: "white",
                        border: "none",
                        padding: "14px 32px",
                        borderRadius: "14px",
                        fontSize: "16px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        margin: "0 auto",
                      }}
                    >
                      <FaHeart /> Browse Books
                    </motion.button>
                  </motion.div>
                ) : (
                  savedOffers.map((offer) => {
                    const imageUrl = offer.imageUrl 
                      ? `${API_BASE}${offer.imageUrl}`
                      : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=300&fit=crop";
                    
                    return (
                      <motion.div
                        key={offer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4 }}
                        style={{
                          background: "white",
                          borderRadius: "20px",
                          padding: "20px",
                          boxShadow: "0 8px 24px rgba(205, 127, 50, 0.12)",
                          display: "flex",
                          gap: "16px",
                          alignItems: "center",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={offer.bookTitle}
                          style={{ 
                            width: "80px", 
                            height: "110px", 
                            borderRadius: "12px", 
                            objectFit: "cover",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=300&fit=crop";
                          }}
                        />
                        
                        <div style={{ flex: 1 }}>
                          <h3 style={{ 
                            fontSize: "17px", 
                            fontWeight: 700, 
                            margin: "0 0 8px", 
                            color: BRONZE.dark,
                            lineHeight: 1.3,
                          }}>
                            {offer.bookTitle.length > 30 ? offer.bookTitle.slice(0, 30) + "..." : offer.bookTitle}
                          </h3>
                          
                          {offer.price && (
                            <p style={{ 
                              fontSize: "22px", 
                              fontWeight: "800", 
                              color: BRONZE.primary, 
                              margin: "0 0 8px",
                            }}>
                              ${offer.price}
                            </p>
                          )}
                          
                          <span style={{
                            background: "#FFEBEE",
                            color: "#D32F2F",
                            padding: "6px 14px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "700",
                          }}>
                            Saved ❤️
                          </span>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleUnsave(offer.id)}
                          style={{
                            background: BRONZE.pale,
                            color: BRONZE.dark,
                            border: `2px solid ${BRONZE.light}`,
                            padding: "10px 16px",
                            borderRadius: "12px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <FaHeart /> Unsave
                        </motion.button>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}

            {/* Stats Tab */}
            {activeTab === "stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ display: "flex", flexDirection: "column", gap: "24px" }}
              >
                <div style={{
                  background: "white",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: "0 8px 24px rgba(205, 127, 50, 0.12)",
                }}>
                  <h3 style={{ 
                    fontSize: "22px", 
                    fontWeight: 700, 
                    color: BRONZE.dark,
                    marginBottom: "20px",
                    textAlign: "center",
                  }}>
                    📊 Your Reading Journey
                  </h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {[
                      { label: "Books Shared", value: stats.books, color: BRONZE.primary },
                      { label: "Books Saved", value: stats.saved, color: "#E91E63" },
                      { label: "Books Sold", value: stats.sold, color: "#4CAF50" },
                      { label: "Total Posts", value: stats.posts, color: "#2196F3" },
                      { label: "Community Rating", value: stats.rating, color: BRONZE.shimmer },
                      { label: "Badges Earned", value: stats.badges, color: "#9C27B0" },
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "16px",
                          background: BRONZE.pale,
                          borderRadius: "14px",
                        }}
                      >
                        <span style={{ fontSize: "16px", color: BRONZE.dark, fontWeight: 600 }}>
                          {stat.label}
                        </span>
                        <span style={{ 
                          fontSize: "18px", 
                          fontWeight: 800, 
                          color: stat.color,
                        }}>
                          {stat.label.includes("Rating") ? `${stat.value}/5 ⭐` : stat.value}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{
                      marginTop: "24px",
                      padding: "20px",
                      background: `linear-gradient(135deg, ${BRONZE.pale}, ${BRONZE.light}20)`,
                      borderRadius: "16px",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ 
                      fontSize: "15px", 
                      color: BRONZE.dark,
                      fontStyle: "italic",
                      margin: 0,
                    }}>
                      "Every book shared creates a new chapter in someone's story."
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Navigation */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "white",
          borderTop: `1px solid ${BRONZE.pale}`,
          display: "flex",
          justifyContent: "space-around",
          padding: "12px 0",
          boxShadow: "0 -4px 20px rgba(205, 127, 50, 0.1)",
          zIndex: 100,
        }}
      >
        {[
          { Icon: FaBookOpen, label: "Home", path: "/", color: "#4CAF50" },
          { Icon: FaMapMarkedAlt, label: "Map", path: "/map", color: "#2196F3" },
          { Icon: FaPlus, label: "Post", path: "/offer", color: "#FF9800" },
          { Icon: FaComments, label: "Community", path: "/community", color: "#9C27B0" },
          { Icon: FaUser, label: "Profile", path: "/profile", color: BRONZE.primary, active: true },
        ].map(({ Icon, label, path, color, active }) => (
          <motion.button
            key={label}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(path)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              color: active ? color : "#94A3B8",
              fontSize: "12px",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: active ? `${color}15` : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: active ? `2px solid ${color}30` : "none",
            }}>
              <Icon size={22} color={active ? color : "#94A3B8"} />
            </div>
            {label}
            {active && (
              <motion.div
                layoutId="navIndicator"
                style={{
                  position: "absolute",
                  bottom: "-2px",
                  width: "20px",
                  height: "3px",
                  background: color,
                  borderRadius: "2px",
                }}
              />
            )}
          </motion.button>
        ))}
      </motion.nav>

      {/* Settings Dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: "absolute",
              top: "80px",
              right: "20px",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2)",
              padding: "16px",
              minWidth: "180px",
              zIndex: 1000,
              border: `1px solid ${BRONZE.pale}`,
            }}
          >
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => {
                setShowSettings(false);
                // Navigate to settings page or show settings modal
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "12px",
                background: "none",
                border: "none",
                color: BRONZE.dark,
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: "8px",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = BRONZE.pale}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              <FaCog /> Settings
            </motion.button>
            
            <div style={{ 
              height: "1px", 
              background: BRONZE.pale, 
              margin: "8px 0" 
            }} />
            
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => {
                setShowSettings(false);
                if (onLogout) onLogout();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "12px",
                background: "none",
                border: "none",
                color: "#D32F2F",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: "8px",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#FFEBEE"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              <FaSignOutAlt /> Logout
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Offer Modal */}
      <AnimatePresence>
        {editingOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 1000,
            }}
            onClick={() => setEditingOffer(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
              style={{
                background: "white",
                borderRadius: "24px",
                padding: "28px",
                width: "100%",
                maxWidth: "400px",
                boxShadow: "0 40px 80px rgba(0, 0, 0, 0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ 
                fontSize: "24px", 
                fontWeight: 800, 
                color: BRONZE.dark,
                margin: "0 0 24px",
                textAlign: "center",
              }}>
                Edit Book Offer
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "14px", 
                    fontWeight: 600, 
                    color: BRONZE.dark,
                    marginBottom: "8px",
                  }}>
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter book title"
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "12px",
                      border: `1px solid ${BRONZE.light}`,
                      fontSize: "16px",
                      color: "#333",
                      transition: "all 0.3s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => e.target.style.borderColor = BRONZE.primary}
                    onBlur={(e) => e.target.style.borderColor = BRONZE.light}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "14px", 
                    fontWeight: 600, 
                    color: BRONZE.dark,
                    marginBottom: "8px",
                  }}>
                    Price ($)
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Enter price"
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "12px",
                      border: `1px solid ${BRONZE.light}`,
                      fontSize: "16px",
                      color: "#333",
                      transition: "all 0.3s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => e.target.style.borderColor = BRONZE.primary}
                    onBlur={(e) => e.target.style.borderColor = BRONZE.light}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "14px", 
                    fontWeight: 600, 
                    color: BRONZE.dark,
                    marginBottom: "8px",
                  }}>
                    Condition
                  </label>
                  <select
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value as "Excellent" | "Very Good" | "Good" | "Fair")}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "12px",
                      border: `1px solid ${BRONZE.light}`,
                      fontSize: "16px",
                      color: "#333",
                      background: "white",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      outline: "none",
                    }}
                  >
                    {["Excellent", "Very Good", "Good", "Fair"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={saveEdit}
                  style={{
                    flex: 2,
                    background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
                    color: "white",
                    border: "none",
                    padding: "16px",
                    borderRadius: "14px",
                    fontSize: "16px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditingOffer(null)}
                  style={{
                    flex: 1,
                    background: BRONZE.pale,
                    color: BRONZE.dark,
                    border: `2px solid ${BRONZE.light}`,
                    padding: "16px",
                    borderRadius: "14px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}