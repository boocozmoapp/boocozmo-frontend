// src/pages/ProfileScreen.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaBookOpen, 
  FaMapMarkedAlt, 
  FaPlus, 
  FaComments, 
  FaEdit, 
  FaTrash, 
  FaHeart, 
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaBook,
  FaBookmark,
  FaStar,
  FaDollarSign,
  FaUsers
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
    bgLight: "#FDF8F3",
    bgDark: "#F5F0E6",
    textDark: "#2C1810",
    textLight: "#5D4037",
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
        background: BRONZE.bgLight,
        flexDirection: "column",
        gap: "20px",
      }}>
        {/* Horizontal loading bar */}
        <div style={{
          width: "200px",
          height: "4px",
          background: BRONZE.pale,
          borderRadius: "2px",
          overflow: "hidden",
          position: "relative",
        }}>
          <motion.div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "30%",
              background: `linear-gradient(90deg, ${BRONZE.primary}, ${BRONZE.dark})`,
              borderRadius: "2px",
            }}
            animate={{ x: ["0%", "200%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        <p style={{ 
          color: BRONZE.textLight, 
          fontSize: "14px", 
          fontWeight: 500,
          textAlign: "center",
        }}>
          Loading your library...
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      height: "100vh",
      width: "100vw",
      background: BRONZE.bgLight,
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflow: "hidden",
    }}>
      {/* Fixed Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ 
          background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
          padding: "20px 20px 24px 20px",
          color: "white",
          position: "sticky",
          top: 0,
          zIndex: 50,
          flexShrink: 0,
          boxShadow: "0 2px 20px rgba(205, 127, 50, 0.3)",
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
            fontSize: "28px", 
            fontWeight: 700, 
            margin: 0,
            fontFamily: "'Merriweather', serif",
          }}>
            My Library
          </h1>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/chat")}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                cursor: "pointer",
              }}
            >
              <FaComments size={18} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                cursor: "pointer",
              }}
            >
              <FaCog size={18} />
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
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div style={{ position: "relative" }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${BRONZE.light}, white)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                color: BRONZE.dark,
                fontWeight: "bold",
                border: `3px solid white`,
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
              }}
            >
              {username[0].toUpperCase()}
            </motion.div>
          </div>

          <div style={{ flex: 1 }}>
            <motion.h2 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ 
                fontSize: "24px", 
                fontWeight: 700, 
                margin: "0 0 4px",
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
                fontSize: "14px", 
                opacity: 0.9, 
                margin: "0 0 8px",
                color: BRONZE.pale,
              }}
            >
              {userEmail}
            </motion.p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FaStar color={BRONZE.shimmer} size={14} />
              <span style={{ fontSize: "13px", fontWeight: 600 }}>
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
            gap: "10px",
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
              whileHover={{ y: -3 }}
              style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: "14px",
                padding: "12px 8px",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ 
                fontSize: "24px", 
                fontWeight: "bold",
                marginBottom: "4px",
                color: stat.color,
              }}>
                {stat.icon}
              </div>
              <div style={{ 
                fontSize: "18px", 
                fontWeight: "bold",
                marginBottom: "2px",
              }}>
                {stat.value}
              </div>
              <div style={{ 
                fontSize: "11px", 
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
        paddingBottom: "90px",
        WebkitOverflowScrolling: "touch",
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
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(205, 127, 50, 0.1)",
            display: "flex",
            justifyContent: "space-around",
            position: "relative",
            zIndex: 10,
          }}
        >
          {[
            { key: "books" as const, label: "My Books", icon: <FaBook size={16} /> },
            { key: "saved" as const, label: "Saved", icon: <FaBookmark size={16} /> },
            { key: "stats" as const, label: "Stats", icon: <FaChartLine size={16} /> },
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
                color: activeTab === key ? BRONZE.primary : BRONZE.textLight,
                fontSize: "12px",
                fontWeight: activeTab === key ? 700 : 500,
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: "12px",
                transition: "all 0.3s ease",
                minWidth: "70px",
              }}
            >
              <div style={{ 
                fontSize: "18px",
                color: activeTab === key ? BRONZE.primary : BRONZE.textLight,
              }}>
                {icon}
              </div>
              {label}
              {activeTab === key && (
                <motion.div
                  layoutId="profileTabIndicator"
                  style={{
                    width: "20px",
                    height: "3px",
                    background: BRONZE.primary,
                    borderRadius: "2px",
                    marginTop: "2px",
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
                      borderRadius: "16px",
                      boxShadow: "0 4px 16px rgba(205, 127, 50, 0.08)",
                      border: `1px solid ${BRONZE.pale}`,
                    }}
                  >
                    <div style={{ 
                      width: "80px", 
                      height: "80px", 
                      borderRadius: "50%",
                      background: `${BRONZE.primary}10`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                      fontSize: "36px",
                      color: BRONZE.primary,
                    }}>
                      <FaBookOpen />
                    </div>
                    <h3 style={{ 
                      fontSize: "18px", 
                      fontWeight: 700, 
                      color: BRONZE.textDark,
                      marginBottom: "8px",
                    }}>
                      No Books Listed Yet
                    </h3>
                    <p style={{ 
                      fontSize: "14px", 
                      color: BRONZE.textLight, 
                      marginBottom: "24px",
                      maxWidth: "280px",
                      margin: "0 auto",
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
                        padding: "14px 28px",
                        borderRadius: "12px",
                        fontSize: "15px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        margin: "0 auto",
                        boxShadow: `0 4px 16px ${BRONZE.primary}40`,
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
                          borderRadius: "16px",
                          padding: "16px",
                          boxShadow: "0 4px 16px rgba(205, 127, 50, 0.08)",
                          display: "flex",
                          gap: "16px",
                          alignItems: "center",
                          position: "relative",
                          overflow: "hidden",
                          border: `1px solid ${BRONZE.pale}`,
                        }}
                      >
                        {/* Book Image */}
                        <div style={{ position: "relative" }}>
                          <img
                            src={imageUrl}
                            alt={offer.bookTitle}
                            style={{ 
                              width: "70px", 
                              height: "100px", 
                              borderRadius: "10px", 
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=300&fit=crop";
                            }}
                          />
                          {/* Status Badge */}
                          <div style={{
                            position: "absolute",
                            top: "-4px",
                            left: "-4px",
                            background: getOfferTypeColor(offer.type),
                            color: getOfferTypeTextColor(offer.type),
                            padding: "3px 8px",
                            borderRadius: "10px",
                            fontSize: "9px",
                            fontWeight: "700",
                            border: `1.5px solid white`,
                          }}>
                            {getOfferTypeLabel(offer.type)}
                          </div>
                        </div>

                        {/* Book Details */}
                        <div style={{ flex: 1 }}>
                          <h3 style={{ 
                            fontSize: "16px", 
                            fontWeight: 600, 
                            margin: "0 0 6px", 
                            color: BRONZE.textDark,
                            lineHeight: 1.3,
                          }}>
                            {offer.bookTitle.length > 25 ? offer.bookTitle.slice(0, 25) + "..." : offer.bookTitle}
                          </h3>
                          
                          {offer.price && (
                            <p style={{ 
                              fontSize: "20px", 
                              fontWeight: "700", 
                              color: BRONZE.primary, 
                              margin: "0 0 6px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}>
                              <FaDollarSign size={14} /> {offer.price}
                            </p>
                          )}
                          
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "6px",
                            flexWrap: "wrap",
                          }}>
                            {offer.condition && (
                              <span style={{
                                background: BRONZE.pale,
                                color: BRONZE.dark,
                                padding: "4px 10px",
                                borderRadius: "10px",
                                fontSize: "11px",
                                fontWeight: "600",
                              }}>
                                {offer.condition}
                              </span>
                            )}
                            {offer.genre && (
                              <span style={{
                                background: BRONZE.pale,
                                color: BRONZE.dark,
                                padding: "4px 10px",
                                borderRadius: "10px",
                                fontSize: "11px",
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
                              fontSize: "20px",
                              cursor: "pointer",
                              padding: "6px",
                              borderRadius: "6px",
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
                                  top: "32px",
                                  background: "white",
                                  borderRadius: "14px",
                                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                                  padding: "10px",
                                  minWidth: "120px",
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
                                    gap: "8px",
                                    width: "100%",
                                    padding: "8px 10px",
                                    background: "none",
                                    border: "none",
                                    color: BRONZE.dark,
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    borderRadius: "6px",
                                    transition: "all 0.3s ease",
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = BRONZE.pale}
                                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                                >
                                  <FaEdit size={12} /> Edit
                                </motion.button>
                                <motion.button
                                  whileHover={{ x: 4 }}
                                  onClick={() => handleDelete(offer.id)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    width: "100%",
                                    padding: "8px 10px",
                                    background: "none",
                                    border: "none",
                                    color: "#D32F2F",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    borderRadius: "6px",
                                    transition: "all 0.3s ease",
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = "#FFEBEE"}
                                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                                >
                                  <FaTrash size={12} /> Delete
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
                      borderRadius: "16px",
                      boxShadow: "0 4px 16px rgba(205, 127, 50, 0.08)",
                      border: `1px solid ${BRONZE.pale}`,
                    }}
                  >
                    <div style={{ 
                      width: "80px", 
                      height: "80px", 
                      borderRadius: "50%",
                      background: `${BRONZE.primary}10`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                      fontSize: "36px",
                      color: BRONZE.primary,
                    }}>
                      <FaBookmark />
                    </div>
                    <h3 style={{ 
                      fontSize: "18px", 
                      fontWeight: 700, 
                      color: BRONZE.textDark,
                      marginBottom: "8px",
                    }}>
                      No Saved Books
                    </h3>
                    <p style={{ 
                      fontSize: "14px", 
                      color: BRONZE.textLight, 
                      marginBottom: "24px",
                      maxWidth: "280px",
                      margin: "0 auto",
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
                        padding: "14px 28px",
                        borderRadius: "12px",
                        fontSize: "15px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        margin: "0 auto",
                        boxShadow: `0 4px 16px ${BRONZE.primary}40`,
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
                          borderRadius: "16px",
                          padding: "16px",
                          boxShadow: "0 4px 16px rgba(205, 127, 50, 0.08)",
                          display: "flex",
                          gap: "16px",
                          alignItems: "center",
                          position: "relative",
                          overflow: "hidden",
                          border: `1px solid ${BRONZE.pale}`,
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={offer.bookTitle}
                          style={{ 
                            width: "70px", 
                            height: "100px", 
                            borderRadius: "10px", 
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=300&fit=crop";
                          }}
                        />
                        
                        <div style={{ flex: 1 }}>
                          <h3 style={{ 
                            fontSize: "16px", 
                            fontWeight: 600, 
                            margin: "0 0 6px", 
                            color: BRONZE.textDark,
                            lineHeight: 1.3,
                          }}>
                            {offer.bookTitle.length > 25 ? offer.bookTitle.slice(0, 25) + "..." : offer.bookTitle}
                          </h3>
                          
                          {offer.price && (
                            <p style={{ 
                              fontSize: "20px", 
                              fontWeight: "700", 
                              color: BRONZE.primary, 
                              margin: "0 0 6px",
                            }}>
                              ${offer.price}
                            </p>
                          )}
                          
                          <span style={{
                            background: "#FFEBEE",
                            color: "#D32F2F",
                            padding: "4px 12px",
                            borderRadius: "10px",
                            fontSize: "11px",
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
                            border: `1px solid ${BRONZE.light}`,
                            padding: "8px 14px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <FaHeart size={12} /> Unsave
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
                style={{ display: "flex", flexDirection: "column", gap: "20px" }}
              >
                <div style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 4px 16px rgba(205, 127, 50, 0.08)",
                  border: `1px solid ${BRONZE.pale}`,
                }}>
                  <h3 style={{ 
                    fontSize: "20px", 
                    fontWeight: 700, 
                    color: BRONZE.textDark,
                    marginBottom: "16px",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}>
                    <FaChartLine /> Your Reading Journey
                  </h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                          padding: "14px",
                          background: BRONZE.pale,
                          borderRadius: "12px",
                        }}
                      >
                        <span style={{ fontSize: "14px", color: BRONZE.textDark, fontWeight: 600 }}>
                          {stat.label}
                        </span>
                        <span style={{ 
                          fontSize: "16px", 
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
                      marginTop: "20px",
                      padding: "16px",
                      background: `${BRONZE.primary}08`,
                      borderRadius: "14px",
                      textAlign: "center",
                      border: `1px solid ${BRONZE.primary}20`,
                    }}
                  >
                    <p style={{ 
                      fontSize: "14px", 
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

      {/* Bottom Navigation - Matching HomeScreen style */}
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
          { icon: FaBookOpen, label: "Home", onClick: () => navigate("/") },
          { icon: FaMapMarkedAlt, label: "Map", onClick: () => navigate("/map") },
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
              color: BRONZE.textLight,
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
              e.currentTarget.style.background = `${BRONZE.primary}08`;
              e.currentTarget.style.color = BRONZE.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = BRONZE.textLight;
            }}
          >
            <item.icon />
            <span style={{ 
              fontSize: "11px", 
              marginTop: "4px", 
              fontWeight: 500,
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
              borderRadius: "14px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
              padding: "14px",
              minWidth: "160px",
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
                gap: "10px",
                width: "100%",
                padding: "10px",
                background: "none",
                border: "none",
                color: BRONZE.dark,
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: "8px",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = BRONZE.pale}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              <FaCog size={14} /> Settings
            </motion.button>
            
            <div style={{ 
              height: "1px", 
              background: BRONZE.pale, 
              margin: "6px 0" 
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
                gap: "10px",
                width: "100%",
                padding: "10px",
                background: "none",
                border: "none",
                color: "#D32F2F",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: "8px",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#FFEBEE"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              <FaSignOutAlt size={14} /> Logout
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
                borderRadius: "20px",
                padding: "24px",
                width: "100%",
                maxWidth: "400px",
                boxShadow: "0 32px 64px rgba(0, 0, 0, 0.25)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ 
                fontSize: "20px", 
                fontWeight: 700, 
                color: BRONZE.dark,
                margin: "0 0 20px",
                textAlign: "center",
              }}>
                Edit Book Offer
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "13px", 
                    fontWeight: 600, 
                    color: BRONZE.dark,
                    marginBottom: "6px",
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
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${BRONZE.light}`,
                      fontSize: "15px",
                      color: BRONZE.textDark,
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
                    fontSize: "13px", 
                    fontWeight: 600, 
                    color: BRONZE.dark,
                    marginBottom: "6px",
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
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${BRONZE.light}`,
                      fontSize: "15px",
                      color: BRONZE.textDark,
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
                    fontSize: "13px", 
                    fontWeight: 600, 
                    color: BRONZE.dark,
                    marginBottom: "6px",
                  }}>
                    Condition
                  </label>
                  <select
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value as "Excellent" | "Very Good" | "Good" | "Fair")}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${BRONZE.light}`,
                      fontSize: "15px",
                      color: BRONZE.textDark,
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
              
              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={saveEdit}
                  style={{
                    flex: 2,
                    background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
                    color: "white",
                    border: "none",
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: `0 4px 12px ${BRONZE.primary}40`,
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
                    border: `1px solid ${BRONZE.light}`,
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "15px",
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