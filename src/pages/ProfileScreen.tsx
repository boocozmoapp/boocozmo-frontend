/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ProfileScreen.tsx - FINAL CLEAN & FULLY WORKING VERSION
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaHome,
  FaCompass,
  FaBookOpen,
  FaBookmark,
  FaUsers,
  FaMapMarkedAlt,
  FaComments,
  FaBell,
  FaStar,
  FaCog,
  FaSignOutAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaChartLine,
  FaDollarSign,
  FaExchangeAlt,
  FaEllipsisH,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

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

type Offer = {
  id: number;
  bookTitle: string;
  price: number | null;
  imageUrl: string | null;
  state: string;
  exchangeBook?: string | null;
  condition?: "Excellent" | "Very Good" | "Good" | "Fair" | null;
  type?: "sell" | "exchange";
  genre?: string;
  author?: string;
};

type Props = {
  onLogout?: () => void;
  currentUser: { email: string; name?: string; token: string };
};

export default function ProfileScreen({ currentUser, onLogout }: Props) {
  const [publicOffers, setPublicOffers] = useState<Offer[]>([]);
  const [savedOffers, setSavedOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"books" | "saved" | "stats">("books");
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCondition, setEditCondition] = useState<"Excellent" | "Very Good" | "Good" | "Fair">("Excellent");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const username = currentUser.name || currentUser.email.split("@")[0];

  const stats = {
    books: publicOffers.length,
    saved: savedOffers.length,
    sold: Math.floor(publicOffers.length * 0.3),
    posts: publicOffers.length + savedOffers.length,
    rating: 4.8,
    badges: 3,
    followers: 128,
    following: 56,
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const myOffersRes = await fetch(`${API_BASE}/my-offers`, {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        if (myOffersRes.ok) {
          const data = await myOffersRes.json();
          const offers = Array.isArray(data) ? data : data.offers || [];
          setPublicOffers(offers.filter((o: Offer) => o.state === "open"));
        }

        const savedRes = await fetch(`${API_BASE}/saved-offers`, {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        if (savedRes.ok) {
          const data = await savedRes.json();
          const saved = Array.isArray(data) ? data : data.offers || [];
          setSavedOffers(saved);
        }
      } catch (err) {
        console.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser.token]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this public offer permanently?")) return;

    try {
      const res = await fetch(`${API_BASE}/offers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });

      if (res.ok) {
        setPublicOffers(prev => prev.filter(o => o.id !== id));
      } else {
        alert("Failed to delete offer");
      }
    } catch {
      alert("Error deleting offer");
    }
  };

  const handleUnsave = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/unsave-offer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offer_id: id }),
      });

      if (res.ok) {
        setSavedOffers(prev => prev.filter(o => o.id !== id));
      }
    } catch {
      alert("Failed to unsave");
    }
  };

  const startEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setEditTitle(offer.bookTitle);
    setEditPrice(offer.price?.toString() || "");
    setEditCondition(offer.condition || "Excellent");
    setOpenMenuId(null);
  };

  const saveEdit = async () => {
    if (!editingOffer || !editTitle.trim()) return alert("Title required");

    const priceValue = editPrice ? Number(editPrice) : null;

    try {
      const res = await fetch(`${API_BASE}/offers/${editingOffer.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookTitle: editTitle.trim(),
          price: priceValue,
          condition: editCondition,
        }),
      });

      if (res.ok) {
        setPublicOffers(prev =>
          prev.map(o =>
            o.id === editingOffer.id
              ? { ...o, bookTitle: editTitle.trim(), price: priceValue, condition: editCondition }
              : o
          )
        );
        setEditingOffer(null);
      } else {
        alert("Failed to update offer");
      }
    } catch {
      alert("Error updating offer");
    }
  };

  const getOfferTypeColor = (type?: string) => {
    switch (type) {
      case "sell": return "#D1FAE5";
      case "exchange": return "#E0E7FF";
      default: return PINTEREST.grayLight;
    }
  };

  const getOfferTypeTextColor = (type?: string) => {
    switch (type) {
      case "sell": return "#065F46";
      case "exchange": return "#3730A3";
      default: return PINTEREST.textDark;
    }
  };

  const getOfferTypeLabel = (type?: string) => {
    switch (type) {
      case "sell": return "For Sale";
      case "exchange": return "Exchange";
      default: return "Active";
    }
  };

  const getOfferTypeIcon = (type?: string) => {
    switch (type) {
      case "sell": return <FaDollarSign size={10} />;
      case "exchange": return <FaExchangeAlt size={10} />;
      default: return null;
    }
  };

  const formatPrice = (price: number | null): string => price ? `$${price.toFixed(2)}` : "Free";

  const getRandomBookCover = () => {
    const covers = [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    ];
    return covers[Math.floor(Math.random() * covers.length)];
  };

  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBookOpen, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaBookmark, label: "Saved", onClick: () => setActiveTab("saved") },
    { icon: FaUsers, label: "Following", onClick: () => {} },
    { icon: FaMapMarkedAlt, label: "Map", onClick: () => navigate("/map") },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
    { icon: FaBell, label: "Notifications", onClick: () => {} },
    { icon: FaStar, label: "Top Picks", onClick: () => {} },
  ];

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: PINTEREST.bg }}>
        <p style={{ color: PINTEREST.textLight }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100vw", background: PINTEREST.bg, display: "flex", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 25 }}
        style={{
          width: "240px",
          background: PINTEREST.sidebarBg,
          borderRight: `1px solid ${PINTEREST.border}`,
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
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
              background: PINTEREST.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "700",
              fontSize: "14px",
            }}>
              B
            </div>
            <span style={{ fontSize: "20px", fontWeight: "800", color: PINTEREST.primary }}>
              boocozmo
            </span>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px",
            borderRadius: "12px",
            background: PINTEREST.hoverBg,
            marginBottom: "24px",
          }}
        >
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${PINTEREST.primary}, ${PINTEREST.dark})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "600",
            fontSize: "18px",
          }}>
            {username[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: PINTEREST.textDark }}>
              {username.split(" ")[0]}
            </div>
            <div style={{ fontSize: "12px", color: PINTEREST.textLight }}>
              {currentUser.email}
            </div>
          </div>
        </motion.div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <motion.button
              key={item.label}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={item.onClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "12px",
                background: item.label === "My Library" ? PINTEREST.redLight : "transparent",
                border: "none",
                color: item.label === "My Library" ? PINTEREST.primary : PINTEREST.textDark,
                fontSize: "14px",
                fontWeight: item.label === "My Library" ? "600" : "500",
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
          onClick={() => navigate("/offer")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px",
            background: PINTEREST.primary,
            color: "white",
            border: "none",
            borderRadius: "24px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            width: "100%",
            justifyContent: "center",
            marginTop: "20px",
          }}
        >
          <FaPlus /> Share a Book
        </motion.button>

        <motion.button
          whileHover={{ x: 4 }}
          onClick={() => setShowSettings(!showSettings)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            padding: "12px",
            background: "transparent",
            border: "none",
            color: PINTEREST.textLight,
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
      <div style={{ flex: 1, marginLeft: sidebarOpen ? "240px" : "0", transition: "margin-left 0.3s ease", display: "flex", flexDirection: "column" }}>
        {/* Top Bar */}
        <header style={{
          padding: "16px 20px",
          background: PINTEREST.bg,
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: `1px solid ${PINTEREST.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: PINTEREST.hoverBg,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: PINTEREST.textDark,
                cursor: "pointer",
              }}
            >
              {sidebarOpen ? <FaTimes /> : <FaEllipsisH />}
            </motion.button>

            <div>
              <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: PINTEREST.textDark }}>
                My Profile
              </h1>
              <p style={{ fontSize: "13px", color: PINTEREST.textLight, margin: "4px 0 0" }}>
                Manage your books and activity
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/chat")}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: PINTEREST.hoverBg,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: PINTEREST.textDark,
                cursor: "pointer",
              }}
            >
              <FaComments />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/offer")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: PINTEREST.primary,
                color: "white",
                border: "none",
                borderRadius: "24px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <FaPlus size={14} />
              Add Book
            </motion.button>
          </div>
        </header>

        {/* Profile Header */}
        <div style={{
          padding: "24px 20px",
          background: "linear-gradient(135deg, #E60023, #A3081A)",
          color: "white",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "20px" }}>
            <div style={{ position: "relative" }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "36px",
                  color: "white",
                  fontWeight: "bold",
                  border: "3px solid rgba(255,255,255,0.3)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                }}
              >
                {username[0].toUpperCase()}
              </motion.div>
            </div>

            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 8px" }}>
                {username}
              </h2>
              <p style={{ fontSize: "14px", opacity: 0.9, margin: "0 0 12px" }}>
                {currentUser.email}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaStar size={14} />
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>
                    {stats.rating}/5 • {stats.badges} Badges
                  </span>
                </div>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "bold" }}>{stats.followers}</div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>Followers</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "bold" }}>{stats.following}</div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>Following</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
          }}>
            {[
              { value: stats.books, label: "Books", icon: "📚" },
              { value: stats.saved, label: "Saved", icon: "🔖" },
              { value: stats.sold, label: "Sold", icon: "💰" },
              { value: stats.posts, label: "Posts", icon: "📝" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -3 }}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "14px",
                  padding: "16px 12px",
                  textAlign: "center",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>
                  {stat.icon}
                </div>
                <div style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "4px" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "12px", opacity: 0.9, fontWeight: 500 }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: PINTEREST.bg, padding: "0 20px", borderBottom: `1px solid ${PINTEREST.border}` }}>
          <div style={{ display: "flex", gap: "24px", overflowX: "auto" }}>
            {[
              { key: "books" as const, label: "My Books", icon: <FaBookOpen size={16} /> },
              { key: "saved" as const, label: "Saved", icon: <FaBookmark size={16} /> },
              { key: "stats" as const, label: "Stats", icon: <FaChartLine size={16} /> },
            ].map(({ key, label, icon }) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "none",
                  border: "none",
                  color: activeTab === key ? PINTEREST.primary : PINTEREST.textLight,
                  fontSize: "14px",
                  fontWeight: activeTab === key ? "600" : "500",
                  cursor: "pointer",
                  padding: "16px 0",
                  position: "relative",
                }}
              >
                {icon}
                {label}
                {activeTab === key && (
                  <motion.div
                    layoutId="profileTabIndicator"
                    style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: PINTEREST.primary, borderRadius: "2px" }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <main style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          <AnimatePresence mode="wait">
            {activeTab === "books" && (
              <motion.div
                key="books"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}
              >
                {publicOffers.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "16px", border: `1px solid ${PINTEREST.border}` }}>
                    <FaBookOpen size={60} style={{ color: PINTEREST.textLight, opacity: 0.5, marginBottom: 20 }} />
                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: PINTEREST.textDark, marginBottom: 8 }}>
                      No Public Books Yet
                    </h3>
                    <p style={{ fontSize: "14px", color: PINTEREST.textLight, marginBottom: 24 }}>
                      Publish books from your library to show them here
                    </p>
                  </div>
                ) : (
                  publicOffers.map((offer) => {
                    const imageUrl = offer.imageUrl || getRandomBookCover();

                    return (
                      <motion.div
                        key={offer.id}
                        whileHover={{ y: -4 }}
                        style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", position: "relative" }}
                      >
                        <div style={{ position: "relative", paddingTop: "150%" }}>
                          <img src={imageUrl} alt={offer.bookTitle} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            background: getOfferTypeColor(offer.type),
                            color: getOfferTypeTextColor(offer.type),
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}>
                            {getOfferTypeIcon(offer.type)}
                            {getOfferTypeLabel(offer.type)}
                          </div>
                        </div>

                        <div style={{ padding: "12px" }}>
                          <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 6px", lineHeight: 1.3 }}>
                            {offer.bookTitle}
                          </h3>
                          {offer.price && <div style={{ fontSize: "16px", fontWeight: "700", color: PINTEREST.primary }}>{formatPrice(offer.price)}</div>}
                          {offer.condition && <span style={{ fontSize: "11px", color: PINTEREST.textLight, background: PINTEREST.grayLight, padding: "2px 6px", borderRadius: "8px" }}>{offer.condition}</span>}

                          <div style={{ position: "absolute", top: 8, right: 8 }}>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === offer.id ? null : offer.id);
                              }}
                              style={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <FaEllipsisH size={14} />
                            </motion.button>

                            <AnimatePresence>
                              {openMenuId === offer.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  style={{ position: "absolute", right: 0, top: 40, background: "white", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: 140, zIndex: 100 }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button onClick={() => startEdit(offer)} style={{ width: "100%", padding: "10px 12px", textAlign: "left", borderBottom: `1px solid ${PINTEREST.border}` }}>
                                    <FaEdit style={{ marginRight: 8 }} /> Edit
                                  </button>
                                  <button onClick={() => handleDelete(offer.id)} style={{ width: "100%", padding: "10px 12px", textAlign: "left", color: "#D32F2F" }}>
                                    <FaTrash style={{ marginRight: 8 }} /> Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}

            {activeTab === "saved" && (
              <motion.div
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}
              >
                {savedOffers.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "16px", border: `1px solid ${PINTEREST.border}` }}>
                    <FaBookmark size={60} style={{ color: PINTEREST.textLight, opacity: 0.5, marginBottom: 20 }} />
                    <h3>No Saved Books</h3>
                    <p>Save books you're interested in for later</p>
                  </div>
                ) : (
                  savedOffers.map((offer) => {
                    const imageUrl = offer.imageUrl || getRandomBookCover();

                    return (
                      <motion.div
                        key={offer.id}
                        whileHover={{ y: -4 }}
                        style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                        onClick={() => navigate(`/offer/${offer.id}`)}
                      >
                        <div style={{ position: "relative", paddingTop: "150%" }}>
                          <img src={imageUrl} alt={offer.bookTitle} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            background: PINTEREST.primary,
                            color: "white",
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                            <FaBookmark size={14} />
                          </div>
                        </div>

                        <div style={{ padding: "12px" }}>
                          <h3 style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 6px" }}>
                            {offer.bookTitle.length > 25 ? offer.bookTitle.slice(0, 25) + "..." : offer.bookTitle}
                          </h3>
                          {offer.price && <div style={{ fontSize: "16px", fontWeight: "700", color: PINTEREST.primary }}>{formatPrice(offer.price)}</div>}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnsave(offer.id);
                            }}
                            style={{
                              width: "100%",
                              padding: "8px",
                              background: PINTEREST.redLight,
                              color: PINTEREST.primary,
                              border: `1px solid ${PINTEREST.primary}`,
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: "600",
                              cursor: "pointer",
                              marginTop: "8px",
                            }}
                          >
                            Unsave
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}

            {activeTab === "stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}
              >
                <div style={{ background: "white", borderRadius: "16px", padding: "24px", border: `1px solid ${PINTEREST.border}` }}>
                  <h3 style={{ fontSize: "20px", fontWeight: 700, color: PINTEREST.textDark, marginBottom: "20px" }}>
                    <FaChartLine style={{ marginRight: 8 }} /> Your Activity
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[
                      { label: "Books Shared", value: stats.books },
                      { label: "Books Saved", value: stats.saved },
                      { label: "Books Sold", value: stats.sold },
                      { label: "Total Posts", value: stats.posts },
                      { label: "Community Rating", value: `${stats.rating}/5 ⭐` },
                      { label: "Badges Earned", value: stats.badges },
                      { label: "Followers", value: stats.followers },
                      { label: "Following", value: stats.following },
                    ].map((stat) => (
                      <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", padding: "14px", background: PINTEREST.grayLight, borderRadius: "12px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600 }}>{stat.label}</span>
                        <span style={{ fontSize: "16px", fontWeight: 800, color: PINTEREST.primary }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingOffer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: PINTEREST.overlay, zIndex: 1000 }}
              onClick={() => setEditingOffer(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "white",
                borderRadius: "16px",
                padding: "24px",
                width: "90%",
                maxWidth: "400px",
                boxShadow: "0 32px 64px rgba(0,0,0,0.25)",
                zIndex: 1001,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: "20px", fontWeight: 700, textAlign: "center", marginBottom: "20px" }}>
                Edit Book Offer
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: `1px solid ${PINTEREST.border}`,
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                    Price ($)
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Leave empty for free"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: `1px solid ${PINTEREST.border}`,
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                    Condition
                  </label>
                  <select
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      border: `1px solid ${PINTEREST.border}`,
                      fontSize: "14px",
                      background: "white",
                    }}
                  >
                    <option>Excellent</option>
                    <option>Very Good</option>
                    <option>Good</option>
                    <option>Fair</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  onClick={() => setEditingOffer(null)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: PINTEREST.grayLight,
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  style={{
                    flex: 2,
                    padding: "14px",
                    background: PINTEREST.primary,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                  }}
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
              padding: "12px",
              minWidth: "160px",
              zIndex: 1000,
              border: `1px solid ${PINTEREST.border}`,
            }}
          >
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setShowSettings(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px",
                background: "none",
                border: "none",
                color: PINTEREST.textDark,
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: "8px",
              }}
            >
              <FaCog size={14} /> Settings
            </motion.button>
            <div style={{ height: "1px", background: PINTEREST.border, margin: "6px 0" }} />
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => {
                setShowSettings(false);
                onLogout?.();
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
            >
              <FaSignOutAlt size={14} /> Logout
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}