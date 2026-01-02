// src/pages/ProfileScreen.tsx - PINTEREST-STYLE REDESIGN
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaHome,
  FaCompass,
  FaBook,
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
  FaHeart,
  FaChartLine,
  FaDollarSign,
  FaExchangeAlt,
  FaTag,
  FaEllipsisH,
  FaTimes,
  FaBookOpen
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

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
    followers: 128, // Mock data
    following: 56, // Mock data
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
      default: return PINTEREST.grayLight;
    }
  };

  const getOfferTypeTextColor = (type?: string) => {
    switch (type) {
      case "sell": return "#065F46";
      case "buy": return "#92400E";
      case "exchange": return "#3730A3";
      default: return PINTEREST.textDark;
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

  const getOfferTypeIcon = (type?: string) => {
    switch (type) {
      case "sell": return <FaDollarSign size={10} />;
      case "buy": return <FaTag size={10} />;
      case "exchange": return <FaExchangeAlt size={10} />;
      default: return null;
    }
  };

  const formatPrice = (price: number | null): string => {
    if (!price) return "Free";
    return `$${price.toFixed(2)}`;
  };

  const getRandomBookCover = () => {
    const bookCovers = [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    ];
    return bookCovers[Math.floor(Math.random() * bookCovers.length)];
  };

  // Sidebar Navigation Items (same as HomeScreen)
  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBookOpen, label: "My Library",active:true,onClick: () => navigate("/my-library") },
    { icon: FaBookmark, label: "Saved", onClick: () => setActiveTab("saved") },
    { icon: FaUsers, label: "Following", onClick: () => {} },
    { icon: FaMapMarkedAlt, label: "Map", onClick: () => navigate("/map") },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
    { icon: FaBell, label: "Notifications", onClick: () => {} },
    { icon: FaStar, label: "Top Picks", onClick: () => {} },
  ];

  if (loading) {
    return (
      <div style={{ 
        flex: 1, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: PINTEREST.bg,
        flexDirection: "column",
        gap: "20px",
      }}>
        <div style={{
          width: "200px",
          height: "4px",
          background: PINTEREST.border,
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
              background: PINTEREST.primary,
              borderRadius: "2px",
            }}
            animate={{ x: ["0%", "200%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        <p style={{ 
          color: PINTEREST.textLight, 
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
      background: PINTEREST.bg,
      display: "flex",
      fontFamily: "'Inter', -apple-system, sans-serif",
      overflow: "hidden",
    }}>
      {/* Pinterest Sidebar */}
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
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sidebar Logo */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            cursor: "pointer"
          }}>
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
            <span style={{
              fontSize: "20px",
              fontWeight: "700",
              color: PINTEREST.primary,
            }}>
              BookSphere
            </span>
          </div>
        </div>

        {/* User Profile */}
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
              {username.split(' ')[0]}
            </div>
            <div style={{ fontSize: "12px", color: PINTEREST.textLight }}>
              {userEmail}
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
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
                background: item.active ? PINTEREST.redLight : "transparent",
                border: "none",
                color: item.active ? PINTEREST.primary : PINTEREST.textDark,
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

        {/* Create Pin/Book Button */}
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

        {/* Settings */}
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
      <div style={{ 
        flex: 1, 
        marginLeft: sidebarOpen ? "240px" : "0",
        transition: "margin-left 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Top Bar */}
        <header
          style={{
            padding: "16px 20px",
            background: PINTEREST.bg,
            position: "sticky",
            top: 0,
            zIndex: 50,
            borderBottom: `1px solid ${PINTEREST.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: Menu Toggle */}
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
                fontSize: "18px",
              }}
            >
              {sidebarOpen ? <FaTimes /> : <FaEllipsisH />}
            </motion.button>

            {/* Page Title */}
            <div>
              <h1 style={{ 
                fontSize: "24px", 
                fontWeight: 700, 
                margin: 0,
                color: PINTEREST.textDark,
              }}>
                My Profile
              </h1>
              <p style={{ 
                fontSize: "13px", 
                color: PINTEREST.textLight,
                margin: "4px 0 0",
              }}>
                Manage your books and activity
              </p>
            </div>
          </div>

          {/* Right: Actions */}
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
                fontSize: "18px",
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
              <motion.h2 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{ 
                  fontSize: "28px", 
                  fontWeight: 700, 
                  margin: "0 0 8px",
                }}
              >
                {username}
              </motion.h2>
              <motion.p 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{ 
                  fontSize: "14px", 
                  opacity: 0.9, 
                  margin: "0 0 12px",
                }}
              >
                {userEmail}
              </motion.p>
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

          {/* Stats Grid */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
            }}
          >
            {[
              { value: stats.books, label: "Books", icon: "📚", color: "white" },
              { value: stats.saved, label: "Saved", icon: "🔖", color: "#FFE2E6" },
              { value: stats.sold, label: "Sold", icon: "💰", color: "#D1FAE5" },
              { value: stats.posts, label: "Posts", icon: "📝", color: "#E0E7FF" },
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
                <div style={{ 
                  fontSize: "24px", 
                  fontWeight: "bold",
                  marginBottom: "6px",
                  color: stat.color,
                }}>
                  {stat.icon}
                </div>
                <div style={{ 
                  fontSize: "22px", 
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
        </div>

        {/* Tabs */}
        <div style={{ 
          background: PINTEREST.bg, 
          padding: "0 20px",
          borderBottom: `1px solid ${PINTEREST.border}`,
        }}>
          <div style={{ 
            display: "flex", 
            gap: "24px",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}>
            {[
              { key: "books" as const, label: "My Books", icon: <FaBook size={16} /> },
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
                  whiteSpace: "nowrap",
                }}
              >
                {icon}
                {label}
                {activeTab === key && (
                  <motion.div
                    layoutId="profileTabIndicator"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "3px",
                      background: PINTEREST.primary,
                      borderRadius: "2px",
                    }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <main style={{ 
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          WebkitOverflowScrolling: "touch",
        }}>
          {/* My Books Tab */}
          <AnimatePresence mode="wait">
            {activeTab === "books" && (
              <motion.div
                key="books"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "20px",
                }}
              >
                {offers.length === 0 ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: "60px 20px",
                      background: "white",
                      borderRadius: "16px",
                      border: `1px solid ${PINTEREST.border}`,
                    }}
                  >
                    <div style={{ 
                      width: "80px", 
                      height: "80px", 
                      borderRadius: "50%",
                      background: PINTEREST.redLight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                      fontSize: "36px",
                      color: PINTEREST.primary,
                    }}>
                      <FaBookOpen />
                    </div>
                    <h3 style={{ 
                      fontSize: "18px", 
                      fontWeight: 600, 
                      color: PINTEREST.textDark,
                      marginBottom: "8px",
                    }}>
                      No Books Listed Yet
                    </h3>
                    <p style={{ 
                      fontSize: "14px", 
                      color: PINTEREST.textLight, 
                      marginBottom: "24px",
                      maxWidth: "300px",
                      margin: "0 auto",
                    }}>
                      Share your first book with the community
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/offer")}
                      style={{
                        padding: "14px 28px",
                        background: PINTEREST.primary,
                        color: "white",
                        border: "none",
                        borderRadius: "24px",
                        fontSize: "15px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        margin: "0 auto",
                      }}
                    >
                      <FaPlus />
                      Add First Book
                    </motion.button>
                  </motion.div>
                ) : (
                  offers.map((offer) => {
                    const imageUrl = offer.imageUrl 
                      ? `${API_BASE}${offer.imageUrl}`
                      : getRandomBookCover();
                    
                    return (
                      <motion.div
                        key={offer.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4 }}
                        style={{
                          background: "white",
                          borderRadius: "12px",
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          border: `1px solid ${PINTEREST.border}`,
                          cursor: "pointer",
                          position: "relative",
                        }}
                        onClick={() => navigate(`/offer/${offer.id}`)}
                      >
                        {/* Book Image */}
                        <div style={{ position: "relative", paddingTop: "150%" }}>
                          <img
                            src={imageUrl}
                            alt={offer.bookTitle}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          
                          {/* Type Badge */}
                          <div style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
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

                        {/* Content */}
                        <div style={{ padding: "12px" }}>
                          <h3 style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            margin: "0 0 6px",
                            color: PINTEREST.textDark,
                            lineHeight: 1.3,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}>
                            {offer.bookTitle}
                          </h3>
                          
                          {offer.price && (
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "4px",
                              marginBottom: "8px",
                            }}>
                              <FaDollarSign size={12} color={PINTEREST.primary} />
                              <span style={{
                                fontSize: "16px",
                                fontWeight: "700",
                                color: PINTEREST.primary,
                              }}>
                                {formatPrice(offer.price)}
                              </span>
                            </div>
                          )}

                          {/* Condition & Actions */}
                          <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "8px",
                          }}>
                            {offer.condition && (
                              <span style={{
                                fontSize: "11px",
                                color: PINTEREST.textLight,
                                padding: "2px 6px",
                                background: PINTEREST.grayLight,
                                borderRadius: "8px",
                                fontWeight: "500",
                              }}>
                                {offer.condition}
                              </span>
                            )}
                            
                            {/* Action Menu */}
                            <div style={{ position: "relative" }}>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === offer.id ? null : offer.id);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: PINTEREST.textLight,
                                  fontSize: "16px",
                                  cursor: "pointer",
                                  padding: "4px",
                                  borderRadius: "4px",
                                }}
                              >
                                <FaEllipsisH />
                              </motion.button>
                              
                              <AnimatePresence>
                                {openMenuId === offer.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                    style={{
                                      position: "absolute",
                                      right: 0,
                                      top: "32px",
                                      background: "white",
                                      borderRadius: "12px",
                                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                                      padding: "8px",
                                      minWidth: "120px",
                                      zIndex: 100,
                                      border: `1px solid ${PINTEREST.border}`,
                                    }}
                                  >
                                    <motion.button
                                      whileHover={{ x: 4 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEdit(offer);
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        width: "100%",
                                        padding: "8px 10px",
                                        background: "none",
                                        border: "none",
                                        color: PINTEREST.textDark,
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        borderRadius: "6px",
                                      }}
                                    >
                                      <FaEdit size={12} /> Edit
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ x: 4 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(offer.id);
                                      }}
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
                                      }}
                                    >
                                      <FaTrash size={12} /> Delete
                                    </motion.button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "20px",
                }}
              >
                {savedOffers.length === 0 ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: "60px 20px",
                      background: "white",
                      borderRadius: "16px",
                      border: `1px solid ${PINTEREST.border}`,
                    }}
                  >
                    <div style={{ 
                      width: "80px", 
                      height: "80px", 
                      borderRadius: "50%",
                      background: PINTEREST.redLight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                      fontSize: "36px",
                      color: PINTEREST.primary,
                    }}>
                      <FaBookmark />
                    </div>
                    <h3 style={{ 
                      fontSize: "18px", 
                      fontWeight: 600, 
                      color: PINTEREST.textDark,
                      marginBottom: "8px",
                    }}>
                      No Saved Books
                    </h3>
                    <p style={{ 
                      fontSize: "14px", 
                      color: PINTEREST.textLight, 
                      marginBottom: "24px",
                      maxWidth: "300px",
                      margin: "0 auto",
                    }}>
                      Save books you're interested in for later
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/")}
                      style={{
                        padding: "14px 28px",
                        background: PINTEREST.primary,
                        color: "white",
                        border: "none",
                        borderRadius: "24px",
                        fontSize: "15px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        margin: "0 auto",
                      }}
                    >
                      <FaHeart />
                      Browse Books
                    </motion.button>
                  </motion.div>
                ) : (
                  savedOffers.map((offer) => {
                    const imageUrl = offer.imageUrl 
                      ? `${API_BASE}${offer.imageUrl}`
                      : getRandomBookCover();
                    
                    return (
                      <motion.div
                        key={offer.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4 }}
                        style={{
                          background: "white",
                          borderRadius: "12px",
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          border: `1px solid ${PINTEREST.border}`,
                          cursor: "pointer",
                        }}
                        onClick={() => navigate(`/offer/${offer.id}`)}
                      >
                        <div style={{ position: "relative", paddingTop: "150%" }}>
                          <img
                            src={imageUrl}
                            alt={offer.bookTitle}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          
                          {/* Saved Badge */}
                          <div style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            background: PINTEREST.primary,
                            color: "white",
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                          }}>
                            <FaBookmark size={14} />
                          </div>
                        </div>

                        <div style={{ padding: "12px" }}>
                          <h3 style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            margin: "0 0 6px",
                            color: PINTEREST.textDark,
                            lineHeight: 1.3,
                          }}>
                            {offer.bookTitle.length > 25 ? offer.bookTitle.slice(0, 25) + "..." : offer.bookTitle}
                          </h3>
                          
                          {offer.price && (
                            <div style={{ 
                              fontSize: "16px", 
                              fontWeight: "700", 
                              color: PINTEREST.primary, 
                              margin: "0 0 12px",
                            }}>
                              {formatPrice(offer.price)}
                            </div>
                          )}
                          
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
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            <FaBookmark size={12} />
                            Unsave
                          </motion.button>
                        </div>
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px", margin: "0 auto" }}
              >
                <div style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "24px",
                  border: `1px solid ${PINTEREST.border}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}>
                  <h3 style={{ 
                    fontSize: "20px", 
                    fontWeight: 700, 
                    color: PINTEREST.textDark,
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <FaChartLine /> Your Reading Journey
                  </h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[
                      { label: "Books Shared", value: stats.books, color: PINTEREST.primary },
                      { label: "Books Saved", value: stats.saved, color: "#E91E63" },
                      { label: "Books Sold", value: stats.sold, color: "#4CAF50" },
                      { label: "Total Posts", value: stats.posts, color: "#2196F3" },
                      { label: "Community Rating", value: stats.rating, color: "#FFC107" },
                      { label: "Badges Earned", value: stats.badges, color: "#9C27B0" },
                      { label: "Followers", value: stats.followers, color: PINTEREST.dark },
                      { label: "Following", value: stats.following, color: PINTEREST.light },
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
                          background: PINTEREST.grayLight,
                          borderRadius: "12px",
                        }}
                      >
                        <span style={{ fontSize: "14px", color: PINTEREST.textDark, fontWeight: 600 }}>
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
                    transition={{ delay: 0.8 }}
                    style={{
                      marginTop: "24px",
                      padding: "16px",
                      background: PINTEREST.redLight,
                      borderRadius: "12px",
                      textAlign: "center",
                      border: `1px solid ${PINTEREST.primary}20`,
                    }}
                  >
                    <p style={{ 
                      fontSize: "14px", 
                      color: PINTEREST.dark,
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
        </main>
      </div>

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
              onClick={() => {
                setShowSettings(false);
                // Navigate to settings page
              }}
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
            
            <div style={{ 
              height: "1px", 
              background: PINTEREST.border, 
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
                borderRadius: "16px",
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
                color: PINTEREST.textDark,
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
                    color: PINTEREST.textDark,
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
                      borderRadius: "8px",
                      border: `1px solid ${PINTEREST.border}`,
                      fontSize: "14px",
                      color: PINTEREST.textDark,
                      outline: "none",
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "13px", 
                    fontWeight: 600, 
                    color: PINTEREST.textDark,
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
                      borderRadius: "8px",
                      border: `1px solid ${PINTEREST.border}`,
                      fontSize: "14px",
                      color: PINTEREST.textDark,
                      outline: "none",
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "13px", 
                    fontWeight: 600, 
                    color: PINTEREST.textDark,
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
                      borderRadius: "8px",
                      border: `1px solid ${PINTEREST.border}`,
                      fontSize: "14px",
                      color: PINTEREST.textDark,
                      background: "white",
                      cursor: "pointer",
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
                    background: PINTEREST.primary,
                    color: "white",
                    border: "none",
                    padding: "14px",
                    borderRadius: "8px",
                    fontSize: "14px",
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
                    background: PINTEREST.grayLight,
                    color: PINTEREST.textDark,
                    border: `1px solid ${PINTEREST.border}`,
                    padding: "14px",
                    borderRadius: "8px",
                    fontSize: "14px",
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
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        input:focus {
          outline: none;
          border-color: ${PINTEREST.primary} !important;
        }
        
        select:focus {
          outline: none;
          border-color: ${PINTEREST.primary} !important;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${PINTEREST.border};
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${PINTEREST.textLight};
        }
        
        @media (max-width: 768px) {
          aside {
            display: none;
          }
          
          .main-content {
            margin-left: 0 !important;
          }
          
          main {
            grid-template-columns: repeat(2, 1fr) !important;
            padding: 12px !important;
          }
        }
        
        @media (min-width: 1200px) {
          main {
            grid-template-columns: repeat(5, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}