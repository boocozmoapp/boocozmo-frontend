/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ProfileScreen.tsx - Profile with Collapsible Sidebar Navigation
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEdit,
  FaCamera,
  FaBook,
  FaDollarSign,
  FaExchangeAlt,
  FaTag,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaCheck,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaFolder,
  FaPlus,
  FaEllipsisV,
  FaGlobe,
  FaLock,
  FaChartLine,
  FaHome,
  FaMapMarkedAlt,
  FaComments,
  FaBell,
  FaBookmark,
  FaCog,
  FaBookOpen,
  FaUsers,
  FaCompass,
  FaStar,
  FaTimes,
  FaBars,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

const PINTEREST = {
  primary: "#E60023",
  dark: "#A3081A",
  light: "#FF4D6D",
  bg: "#FFFFFF",
  sidebarBg: "#FAFAFA",
  textDark: "#1A1A1A",
  textLight: "#666666",
  textMuted: "#8A8A8A",
  border: "#E5E5E5",
  hoverBg: "#F0F0F0",
  icon: "#767676",
  redLight: "#FFE2E6",
  grayLight: "#F5F5F5",
  overlay: "rgba(0, 0, 0, 0.5)",
  success: "#00A86B",
  warning: "#FF9500",
  cardShadow: "0 1px 3px rgba(0,0,0,0.08)",
  cardShadowHover: "0 4px 12px rgba(0,0,0,0.12)",
};

type OfferState = "open" | "draft" | "private" | "closed";

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
  description?: string;
  genre?: string;
  author?: string;
  lastUpdated?: string;
  state?: OfferState;
  visibility?: "public" | "private";
  publishedAt?: string;
  created_at?: string;
};

type Store = {
  id: number;
  name: string;
  ownerEmail: string;
  created_at: string;
  offerIds?: number[];
  offers?: Offer[];
};

type UserProfile = {
  name: string;
  profilePhoto: string | null;
  bio: string | null;
  location: string | null;
  joinedAt: string;
  offersPosted: number;
  dealsCompleted: number;
  rating?: number;
  followers?: number;
  following?: number;
};

type Props = {
  currentUser: {
    email: string;
    name: string;
    token: string;
    id: string;
  };
  onAddPress?: () => void;
  onMapPress?: () => void;
  onBack?: () => void;
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

export default function ProfileScreen({ currentUser, onAddPress, onMapPress, onBack }: Props) {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  
  // Edit profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    profilePhoto: "",
    bio: "",
    location: "",
  });
  
  // Edit offer modal
  const [showEditOfferModal, setShowEditOfferModal] = useState(false);
  const [deletingOffer, setDeletingOffer] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [editOfferForm, setEditOfferForm] = useState({
    bookTitle: "",
    author: "",
    genre: "Fiction",
    condition: "Good",
    price: "",
    exchangeBook: "",
    description: "",
  });
  
  // Actions menu
  const [showOfferMenu, setShowOfferMenu] = useState<number | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"offers" | "libraries" | "stats">("offers");
  
  // Filter state
  const [filterType, setFilterType] = useState<"all" | "public" | "private">("all");
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Navigation items
  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress || (() => navigate("/map")) },
    { icon: FaBookOpen, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBookmark, label: "Saved", onClick: () => navigate("/saved") },
    { icon: FaUsers, label: "Following", onClick: () => {} },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
    { icon: FaBell, label: "Notifications", onClick: () => {} },
    { icon: FaStar, label: "Top Picks", onClick: () => {} },
  ];

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/profile/${currentUser.email}`, {
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
        },
      }, 10000);

      if (!response.ok) {
        throw new Error("Failed to load profile");
      }

      const data = await response.json();
      setProfile(data);
      setEditForm({
        profilePhoto: data.profilePhoto || "",
        bio: data.bio || "",
        location: data.location || "",
      });
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      // Set default profile if API fails
      setProfile({
        name: currentUser.name,
        profilePhoto: null,
        bio: "No bio yet",
        location: "Unknown location",
        joinedAt: new Date().toISOString(),
        offersPosted: 0,
        dealsCompleted: 0,
        rating: 4.5,
        followers: 0,
        following: 0,
      });
    } finally {
      setLoadingProfile(false);
    }
  }, [currentUser.email, currentUser.token, currentUser.name]);

  // Fetch user's offers
  const fetchMyOffers = useCallback(async () => {
    setLoadingOffers(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/my-offers`, {
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
        },
      }, 10000);

      if (!response.ok) {
        throw new Error("Failed to load your offers");
      }

      const data = await response.json();
      setMyOffers(Array.isArray(data.offers) ? data.offers : []);
    } catch (err: any) {
      console.error("Error fetching my offers:", err);
      setMyOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  }, [currentUser.token]);

  // Fetch user's stores (libraries)
  const fetchStores = useCallback(async () => {
    setLoadingStores(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/stores?includeOffers=true`, {
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
        },
      }, 10000);

      if (!response.ok) {
        throw new Error("Failed to load libraries");
      }

      const data = await response.json();
      setStores(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching stores:", err);
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  }, [currentUser.token]);

  useEffect(() => {
    fetchProfile();
    fetchMyOffers();
    fetchStores();
  }, [fetchProfile, fetchMyOffers, fetchStores]);

  // Update profile
  const handleUpdateProfile = async () => {
    setEditingProfile(true);
    
    try {
      const response = await fetchWithTimeout(`${API_BASE}/update-profile`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      }, 10000);

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      await fetchProfile();
      setShowEditModal(false);
      alert("✅ Profile updated successfully!");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      alert(err.message || "Failed to update profile");
    } finally {
      setEditingProfile(false);
    }
  };

  // Publish offer
  const handlePublishOffer = async (offerId: number) => {
    if (!confirm("Publish this offer to make it public?")) return;

    try {
      const offer = myOffers.find(o => o.id === offerId);
      if (!offer) return;

      const response = await fetchWithTimeout(`${API_BASE}/publish-offer/${offerId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: offer.type,
          price: offer.price,
          exchangeBook: offer.exchangeBook,
          latitude: offer.latitude || 40.7128,
          longitude: offer.longitude || -74.0060,
        }),
      }, 10000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to publish offer");
      }

      await fetchMyOffers();
      alert("✅ Offer published successfully!");
    } catch (err: any) {
      console.error("Error publishing offer:", err);
      alert(err.message || "Failed to publish offer");
    }
  };

  // Unpublish offer
  const handleUnpublishOffer = async (offerId: number) => {
    if (!confirm("Unpublish this offer? It will become private.")) return;

    try {
      const response = await fetchWithTimeout(`${API_BASE}/unpublish-offer/${offerId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
        },
      }, 10000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to unpublish offer");
      }

      await fetchMyOffers();
      alert("✅ Offer unpublished!");
    } catch (err: any) {
      console.error("Error unpublishing offer:", err);
      alert(err.message || "Failed to unpublish offer");
    }
  };

  // Delete offer
  const handleDeleteOffer = async (offerId: number) => {
    if (!confirm("Delete this offer permanently? This action cannot be undone.")) return;

    setDeletingOffer(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/delete-offer/${offerId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
        },
      }, 10000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete offer");
      }

      await fetchMyOffers();
      await fetchProfile(); // Refresh stats
      alert("✅ Offer deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting offer:", err);
      alert(err.message || "Failed to delete offer");
    } finally {
      setDeletingOffer(false);
    }
  };

  // Edit offer
  const handleEditOffer = (offerId: number) => {
    const offer = myOffers.find(o => o.id === offerId);
    if (!offer) return;
    
    setSelectedOffer(offer);
    setEditOfferForm({
      bookTitle: offer.bookTitle,
      author: offer.author || "",
      genre: offer.genre || "Fiction",
      condition: offer.condition || "Good",
      price: offer.price ? offer.price.toString() : "",
      exchangeBook: offer.exchangeBook || "",
      description: offer.description || "",
    });
    setShowEditOfferModal(true);
  };

  // Save edited offer
  const handleSaveEditedOffer = async () => {
    if (!selectedOffer) return;
    
    alert("Edit offer functionality would be implemented here with API call");
    setShowEditOfferModal(false);
  };

  // Close deal
  const handleCloseDeal = async (offerId: number) => {
    if (!confirm("Mark this deal as completed?")) return;

    try {
      const response = await fetchWithTimeout(`${API_BASE}/close-deal`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offer_id: offerId }),
      }, 10000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to close deal");
      }

      await fetchMyOffers();
      await fetchProfile(); // Refresh stats
      alert("✅ Deal marked as completed!");
    } catch (err: any) {
      console.error("Error closing deal:", err);
      alert(err.message || "Failed to close deal");
    }
  };

  // Helper functions
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

  const getImageSource = (offer: Offer) => {
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
  };

  const formatPrice = (price: number | null) => price ? `$${price.toFixed(2)}` : "Free";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Filter offers
  const filteredOffers = useMemo(() => {
    let result = myOffers;

    if (filterType !== "all") {
      result = result.filter((o) => 
        filterType === "public" ? o.visibility === "public" : o.visibility === "private"
      );
    }

    return result;
  }, [myOffers, filterType]);

  const tabs = [
    { id: "offers" as const, label: "My Offers", count: myOffers.length },
    { id: "libraries" as const, label: "Libraries", count: stores.length },
    { id: "stats" as const, label: "Statistics", count: 0 },
  ];

  return (
    <div style={{ 
      height: "100vh", 
      width: "100vw", 
      background: PINTEREST.bg, 
      display: "flex", 
      overflow: "hidden",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Sidebar Navigation */}
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
          zIndex: 1000,
          padding: "20px 16px",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${PINTEREST.primary}, ${PINTEREST.dark})`,
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
              fontWeight: "800", 
              color: PINTEREST.textDark,
              letterSpacing: "-0.5px",
            }}>
              boocozmo
            </span>
          </div>
        </div>

        {/* User Profile Mini */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => setSidebarOpen(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px",
            borderRadius: "12px",
            background: PINTEREST.hoverBg,
            marginBottom: "24px",
            cursor: "pointer",
          }}
        >
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${PINTEREST.primary}, ${PINTEREST.dark})`,
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
            <div style={{ fontSize: "14px", fontWeight: "600", color: PINTEREST.textDark }}>
              {currentUser.name.split(" ")[0]}
            </div>
            <div style={{ fontSize: "12px", color: PINTEREST.textLight }}>My Profile</div>
          </div>
        </motion.div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <motion.button
              key={item.label}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                item.onClick();
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
                color: PINTEREST.textDark,
                fontSize: "14px",
                fontWeight: "500",
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

        {/* Create Button */}
        {onAddPress && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onAddPress();
              setSidebarOpen(false);
            }}
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
              boxShadow: "0 4px 20px rgba(230, 0, 35, 0.3)",
            }}
          >
            <FaPlus /> Share a Book
          </motion.button>
        )}

        {/* Settings */}
        <motion.button
          whileHover={{ x: 4 }}
          onClick={() => setSidebarOpen(false)}
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
        overflow: "hidden",
      }}>
        {/* Header */}
        <header style={{
          padding: "12px 20px",
          background: "white",
          borderBottom: `1px solid ${PINTEREST.border}`,
          flexShrink: 0,
          zIndex: 100,
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            marginBottom: "12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
              {/* Menu Button */}
              <div
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: PINTEREST.hoverBg,
                  border: `1px solid ${PINTEREST.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {sidebarOpen ? (
                  <FaTimes 
                    size={16} 
                    color={PINTEREST.textDark}
                    style={{ display: 'block' }}
                  />
                ) : (
                  <FaBars 
                    size={16} 
                    color={PINTEREST.textDark}
                    style={{ display: 'block' }}
                  />
                )}
              </div>

              <h1 style={{
                fontSize: "20px",
                fontWeight: "700",
                color: PINTEREST.textDark,
                margin: 0,
              }}>
                My Profile
              </h1>
            </div>

            {/* Back Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                onClick={onBack || (() => navigate(-1))}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: PINTEREST.hoverBg,
                  border: `1px solid ${PINTEREST.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <FaArrowLeft size={16} color={PINTEREST.textDark} />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ 
            display: "flex", 
            gap: "6px",
            overflowX: "auto",
            paddingBottom: "2px",
            scrollbarWidth: "none",
          }}>
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "16px",
                  background: activeTab === tab.id ? PINTEREST.primary : PINTEREST.hoverBg,
                  color: activeTab === tab.id ? "white" : PINTEREST.textDark,
                  fontSize: "12px",
                  fontWeight: activeTab === tab.id ? "600" : "500",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                  border: "none",
                  flexShrink: 0,
                }}
              >
                {tab.id === "offers" && <FaBook size={12} />}
                {tab.id === "libraries" && <FaFolder size={12} />}
                {tab.id === "stats" && <FaChartLine size={12} />}
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    background: activeTab === tab.id ? "rgba(255,255,255,0.3)" : PINTEREST.grayLight,
                    color: activeTab === tab.id ? "white" : PINTEREST.textLight,
                    fontSize: "11px",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontWeight: "600",
                    marginLeft: "4px",
                  }}>
                    {tab.count}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </header>

        <div style={{ 
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}>
          {/* Left Profile Panel - Collapsible */}
          <motion.div
            animate={{ width: sidebarCollapsed ? "60px" : "280px" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{
              background: PINTEREST.sidebarBg,
              borderRight: `1px solid ${PINTEREST.border}`,
              padding: sidebarCollapsed ? "20px 12px" : "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: sidebarCollapsed ? "center" : "flex-start",
              gap: sidebarCollapsed ? "16px" : "20px",
              position: "relative",
              overflowY: "auto",
              flexShrink: 0,
            }}
          >
            {/* Collapse/Expand Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                position: "absolute",
                top: "16px",
                right: "-12px",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "white",
                border: `1px solid ${PINTEREST.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: PINTEREST.textDark,
                cursor: "pointer",
                fontSize: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                zIndex: 10,
              }}
            >
              {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>

            {/* Profile Photo */}
            <div style={{ position: "relative", textAlign: sidebarCollapsed ? "center" : "left" }}>
              <div style={{
                width: sidebarCollapsed ? "48px" : "100px",
                height: sidebarCollapsed ? "48px" : "100px",
                borderRadius: "50%",
                background: profile?.profilePhoto 
                  ? `url(${profile.profilePhoto}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${PINTEREST.primary}, ${PINTEREST.dark})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: profile?.profilePhoto ? "transparent" : "white",
                fontSize: sidebarCollapsed ? "20px" : "36px",
                fontWeight: "600",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                marginBottom: sidebarCollapsed ? "0" : "16px",
                margin: sidebarCollapsed ? "0 auto" : "0",
              }}>
                {!profile?.profilePhoto && currentUser.name.charAt(0).toUpperCase()}
              </div>
              
              {!sidebarCollapsed && (
                <button
                  onClick={() => setShowEditModal(true)}
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "0",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: PINTEREST.primary,
                    color: "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "12px",
                    boxShadow: "0 2px 8px rgba(230,0,35,0.3)",
                  }}
                >
                  <FaCamera />
                </button>
              )}
            </div>

            {/* User Info - Hidden when collapsed */}
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  style={{ width: "100%" }}
                >
                  {loadingProfile ? (
                    <div style={{ textAlign: "center" }}>
                      <div style={{
                        width: "24px",
                        height: "24px",
                        border: `3px solid ${PINTEREST.primary}20`,
                        borderTopColor: PINTEREST.primary,
                        borderRadius: "50%",
                        margin: "0 auto",
                        animation: "spin 1s linear infinite",
                      }} />
                    </div>
                  ) : profile && (
                    <>
                      <h2 style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: PINTEREST.textDark,
                        margin: "0 0 8px",
                      }}>
                        {profile.name}
                      </h2>
                      
                      <p style={{
                        fontSize: "13px",
                        color: PINTEREST.textLight,
                        margin: "0 0 16px",
                        lineHeight: 1.5,
                      }}>
                        {profile.bio || "No bio yet"}
                      </p>
                      
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column",
                        gap: "8px",
                        marginBottom: "16px",
                        width: "100%",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: PINTEREST.textDark }}>
                          <FaMapMarkerAlt size={12} color={PINTEREST.textLight} />
                          <span>{profile.location || "Unknown"}</span>
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: PINTEREST.textDark }}>
                          <FaCalendarAlt size={12} color={PINTEREST.textLight} />
                          <span>Joined {formatDate(profile.joinedAt)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats - Compact when collapsed */}
            <AnimatePresence>
              {!sidebarCollapsed ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr", 
                    gap: "10px", 
                    width: "100%",
                    marginTop: "12px",
                  }}
                >
                  <div style={{
                    background: "white",
                    borderRadius: "10px",
                    padding: "14px",
                    textAlign: "center",
                    border: `1px solid ${PINTEREST.border}`,
                  }}>
                    <div style={{ 
                      fontSize: "20px", 
                      fontWeight: "700", 
                      color: PINTEREST.primary,
                      marginBottom: "4px",
                    }}>
                      {profile?.offersPosted || 0}
                    </div>
                    <div style={{ fontSize: "11px", color: PINTEREST.textLight }}>
                      Offers
                    </div>
                  </div>
                  
                  <div style={{
                    background: "white",
                    borderRadius: "10px",
                    padding: "14px",
                    textAlign: "center",
                    border: `1px solid ${PINTEREST.border}`,
                  }}>
                    <div style={{ 
                      fontSize: "20px", 
                      fontWeight: "700", 
                      color: PINTEREST.success,
                      marginBottom: "4px",
                    }}>
                      {profile?.dealsCompleted || 0}
                    </div>
                    <div style={{ fontSize: "11px", color: PINTEREST.textLight }}>
                      Deals
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ textAlign: "center", width: "100%" }}
                >
                  <div style={{ 
                    fontSize: "18px", 
                    fontWeight: "700", 
                    color: PINTEREST.primary,
                    marginBottom: "4px",
                  }}>
                    {profile?.offersPosted || 0}
                  </div>
                  <div style={{ fontSize: "10px", color: PINTEREST.textLight, marginBottom: "12px" }}>
                    Offers
                  </div>
                  
                  <div style={{ 
                    fontSize: "18px", 
                    fontWeight: "700", 
                    color: PINTEREST.success,
                  }}>
                    {profile?.dealsCompleted || 0}
                  </div>
                  <div style={{ fontSize: "10px", color: PINTEREST.textLight }}>
                    Deals
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Edit Profile Button - Hidden when collapsed */}
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowEditModal(true)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: PINTEREST.primary,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "16px",
                  }}
                >
                  <FaEdit size={12} />
                  Edit Profile
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Main Content Area */}
          <div style={{ 
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
          }}>
            {/* Tab Content */}
            <div style={{ 
              flex: 1, 
              overflowY: "auto", 
              padding: "24px",
              minWidth: 0,
            }}>
              {activeTab === "offers" && (
                <>
                  {/* Offers Header */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}>
                    <div style={{ flex: 1, minWidth: "300px" }}>
                      <h3 style={{ 
                        fontSize: "20px", 
                        fontWeight: "700", 
                        color: PINTEREST.textDark,
                        margin: "0 0 8px",
                      }}>
                        My Book Offers
                      </h3>
                      <p style={{ 
                        fontSize: "14px", 
                        color: PINTEREST.textLight,
                        margin: 0,
                      }}>
                        {filteredOffers.length} offer{filteredOffers.length !== 1 ? 's' : ''} • {filterType === 'all' ? 'All types' : filterType}
                      </p>
                    </div>
                    
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {[
                          { id: "all" as const, label: "All" },
                          { id: "public" as const, label: "Public" },
                          { id: "private" as const, label: "Private" },
                        ].map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setFilterType(filter.id)}
                            style={{
                              padding: "10px 16px",
                              borderRadius: "8px",
                              background: filterType === filter.id ? PINTEREST.primary : PINTEREST.hoverBg,
                              color: filterType === filter.id ? "white" : PINTEREST.textDark,
                              fontSize: "14px",
                              fontWeight: "600",
                              border: "none",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => navigate("/submit-offer")}
                        style={{
                          padding: "10px 20px",
                          background: PINTEREST.primary,
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <FaPlus size={14} />
                        Create Offer
                      </button>
                    </div>
                  </div>

                  {/* Offers Grid */}
                  {loadingOffers ? (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        border: `3px solid ${PINTEREST.primary}20`,
                        borderTopColor: PINTEREST.primary,
                        borderRadius: "50%",
                        margin: "0 auto",
                        animation: "spin 1s linear infinite",
                      }} />
                    </div>
                  ) : filteredOffers.length === 0 ? (
                    <div style={{
                      textAlign: "center",
                      padding: "80px 40px",
                      background: "white",
                      borderRadius: "16px",
                      border: `2px dashed ${PINTEREST.border}`,
                      maxWidth: "600px",
                      margin: "0 auto",
                    }}>
                      <FaBook size={60} style={{ color: PINTEREST.textLight, opacity: 0.5, marginBottom: "20px" }} />
                      <h3 style={{ fontSize: "22px", fontWeight: "600", color: PINTEREST.textDark, marginBottom: "12px" }}>
                        No offers yet
                      </h3>
                      <p style={{ color: PINTEREST.textLight, fontSize: "16px", marginBottom: "24px", lineHeight: 1.5 }}>
                        {filterType !== 'all' 
                          ? `You don't have any ${filterType} offers`
                          : "Create your first book offer to get started"}
                      </p>
                      <button
                        onClick={() => navigate("/submit-offer")}
                        style={{
                          padding: "14px 32px",
                          background: PINTEREST.primary,
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          fontSize: "16px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Create Your First Offer
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                      gap: "24px",
                    }}>
                      {filteredOffers.map((offer) => (
                        <motion.div
                          key={offer.id}
                          whileHover={{ y: -4 }}
                          style={{
                            background: "white",
                            borderRadius: "16px",
                            border: `1px solid ${PINTEREST.border}`,
                            padding: "20px",
                            boxShadow: PINTEREST.cardShadow,
                            position: "relative",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {/* Offer Menu */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowOfferMenu(showOfferMenu === offer.id ? null : offer.id);
                            }}
                            style={{
                              position: "absolute",
                              top: "16px",
                              right: "16px",
                              width: "36px",
                              height: "36px",
                              borderRadius: "8px",
                              background: "white",
                              border: `1px solid ${PINTEREST.border}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: PINTEREST.textDark,
                              cursor: "pointer",
                              fontSize: "16px",
                              zIndex: 10,
                            }}
                          >
                            <FaEllipsisV />
                          </button>

                          {showOfferMenu === offer.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              style={{
                                position: "absolute",
                                top: "60px",
                                right: "16px",
                                background: "white",
                                borderRadius: "12px",
                                boxShadow: PINTEREST.cardShadowHover,
                                border: `1px solid ${PINTEREST.border}`,
                                zIndex: 20,
                                minWidth: "200px",
                                overflow: "hidden",
                              }}
                            >
                              {offer.visibility === "private" ? (
                                <button
                                  onClick={() => {
                                    handlePublishOffer(offer.id);
                                    setShowOfferMenu(null);
                                  }}
                                  style={{
                                    width: "100%",
                                    padding: "14px 18px",
                                    background: "transparent",
                                    border: "none",
                                    borderBottom: `1px solid ${PINTEREST.border}`,
                                    color: PINTEREST.textDark,
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    textAlign: "left",
                                  }}
                                >
                                  <FaGlobe size={14} />
                                  Publish Publicly
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    handleUnpublishOffer(offer.id);
                                    setShowOfferMenu(null);
                                  }}
                                  style={{
                                    width: "100%",
                                    padding: "14px 18px",
                                    background: "transparent",
                                    border: "none",
                                    borderBottom: `1px solid ${PINTEREST.border}`,
                                    color: PINTEREST.textDark,
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    textAlign: "left",
                                  }}
                                >
                                  <FaLock size={14} />
                                  Make Private
                                </button>
                              )}
                              
                              <button
                                onClick={() => {
                                  handleEditOffer(offer.id);
                                  setShowOfferMenu(null);
                                }}
                                style={{
                                  width: "100%",
                                  padding: "14px 18px",
                                  background: "transparent",
                                  border: "none",
                                  borderBottom: `1px solid ${PINTEREST.border}`,
                                  color: PINTEREST.textDark,
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  textAlign: "left",
                                }}
                              >
                                <FaEdit size={14} />
                                Edit Offer
                              </button>
                              
                              {offer.visibility === "public" && offer.state === "open" && (
                                <button
                                  onClick={() => {
                                    handleCloseDeal(offer.id);
                                    setShowOfferMenu(null);
                                  }}
                                  style={{
                                    width: "100%",
                                    padding: "14px 18px",
                                    background: "transparent",
                                    border: "none",
                                    borderBottom: `1px solid ${PINTEREST.border}`,
                                    color: PINTEREST.success,
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    textAlign: "left",
                                  }}
                                >
                                  <FaCheck size={14} />
                                  Mark as Completed
                                </button>
                              )}
                              
                              <button
                                onClick={() => {
                                  handleDeleteOffer(offer.id);
                                  setShowOfferMenu(null);
                                }}
                                style={{
                                  width: "100%",
                                  padding: "14px 18px",
                                  background: "transparent",
                                  border: "none",
                                  color: PINTEREST.primary,
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  textAlign: "left",
                                }}
                              >
                                <FaTrash size={14} />
                                Delete Offer
                              </button>
                            </motion.div>
                          )}

                          {/* Offer Content */}
                          <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                            <div style={{
                              width: "100px",
                              height: "140px",
                              borderRadius: "10px",
                              overflow: "hidden",
                              flexShrink: 0,
                              background: PINTEREST.grayLight,
                            }}>
                              <img
                                src={getImageSource(offer)}
                                alt={offer.bookTitle}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>
                            
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                                <div style={{
                                  background: getTypeColor(offer.type),
                                  color: "white",
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}>
                                  {getTypeIcon(offer.type)}
                                  {getTypeLabel(offer.type)}
                                </div>
                                
                                <div style={{
                                  background: offer.visibility === "public" ? PINTEREST.success : PINTEREST.warning,
                                  color: "white",
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}>
                                  {offer.visibility === "public" ? <FaEye size={12} /> : <FaEyeSlash size={12} />}
                                  {offer.visibility === "public" ? "Public" : "Private"}
                                </div>
                                
                                {offer.state === "closed" && (
                                  <div style={{
                                    background: PINTEREST.textLight,
                                    color: "white",
                                    padding: "6px 10px",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                  }}>
                                    Completed
                                  </div>
                                )}
                              </div>
                              
                              <h4 style={{
                                fontSize: "18px",
                                fontWeight: "600",
                                color: PINTEREST.textDark,
                                margin: "0 0 8px",
                                lineHeight: 1.3,
                              }}>
                                {offer.bookTitle}
                              </h4>
                              
                              {offer.author && (
                                <p style={{
                                  fontSize: "14px",
                                  color: PINTEREST.textLight,
                                  margin: "0 0 12px",
                                  fontStyle: "italic",
                                }}>
                                  {offer.author}
                                </p>
                              )}
                              
                              <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: PINTEREST.textLight, flexWrap: "wrap" }}>
                                <span style={{ 
                                  background: PINTEREST.grayLight,
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                }}>
                                  {offer.genre || "Fiction"}
                                </span>
                                <span>{offer.condition || "Good"}</span>
                                {offer.price && (
                                  <span style={{ fontWeight: "600", color: PINTEREST.primary }}>
                                    {formatPrice(offer.price)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div style={{
                            fontSize: "13px",
                            color: PINTEREST.textMuted,
                            display: "flex",
                            justifyContent: "space-between",
                            paddingTop: "16px",
                            borderTop: `1px solid ${PINTEREST.border}`,
                            flexWrap: "wrap",
                            gap: "8px",
                          }}>
                            <span>Created {formatDate(offer.created_at || offer.lastUpdated || "")}</span>
                            {offer.publishedAt && (
                              <span>Published {formatDate(offer.publishedAt)}</span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "libraries" && (
                <>
                  {/* Libraries Header */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}>
                    <div style={{ flex: 1, minWidth: "300px" }}>
                      <h3 style={{ 
                        fontSize: "20px", 
                        fontWeight: "700", 
                        color: PINTEREST.textDark,
                        margin: "0 0 8px",
                      }}>
                        My Libraries
                      </h3>
                      <p style={{ 
                        fontSize: "14px", 
                        color: PINTEREST.textLight,
                        margin: 0,
                      }}>
                        Organize your books in private collections
                      </p>
                    </div>
                    
                    <button
                      onClick={() => navigate("/my-library")}
                      style={{
                        padding: "10px 20px",
                        background: PINTEREST.primary,
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <FaPlus size={14} />
                      Manage Libraries
                    </button>
                  </div>

                  {/* Libraries Grid */}
                  {loadingStores ? (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        border: `3px solid ${PINTEREST.primary}20`,
                        borderTopColor: PINTEREST.primary,
                        borderRadius: "50%",
                        margin: "0 auto",
                        animation: "spin 1s linear infinite",
                      }} />
                    </div>
                  ) : stores.length === 0 ? (
                    <div style={{
                      textAlign: "center",
                      padding: "80px 40px",
                      background: "white",
                      borderRadius: "16px",
                      border: `2px dashed ${PINTEREST.border}`,
                      maxWidth: "600px",
                      margin: "0 auto",
                    }}>
                      <FaFolder size={60} style={{ color: PINTEREST.textLight, opacity: 0.5, marginBottom: "20px" }} />
                      <h3 style={{ fontSize: "22px", fontWeight: "600", color: PINTEREST.textDark, marginBottom: "12px" }}>
                        No libraries yet
                      </h3>
                      <p style={{ color: PINTEREST.textLight, fontSize: "16px", marginBottom: "24px", lineHeight: 1.5 }}>
                        Create your first library to organize your books
                      </p>
                      <button
                        onClick={() => navigate("/my-library")}
                        style={{
                          padding: "14px 32px",
                          background: PINTEREST.primary,
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          fontSize: "16px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Create Library
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                      gap: "24px",
                    }}>
                      {stores.map((store) => (
                        <motion.div
                          key={store.id}
                          whileHover={{ y: -4 }}
                          onClick={() => navigate("/my-library")}
                          style={{
                            background: "white",
                            borderRadius: "16px",
                            border: `1px solid ${PINTEREST.border}`,
                            padding: "24px",
                            boxShadow: PINTEREST.cardShadow,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                            <div style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "12px",
                              background: PINTEREST.redLight,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: PINTEREST.primary,
                              fontSize: "24px",
                            }}>
                              <FaFolder />
                            </div>
                            
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{
                                fontSize: "18px",
                                fontWeight: "600",
                                color: PINTEREST.textDark,
                                margin: "0 0 6px",
                                lineHeight: 1.3,
                              }}>
                                {store.name}
                              </h4>
                              <div style={{ fontSize: "14px", color: PINTEREST.textLight }}>
                                {store.offerIds?.length || 0} books • Private Collection
                              </div>
                            </div>
                          </div>
                          
                          <div style={{
                            fontSize: "13px",
                            color: PINTEREST.textMuted,
                            paddingTop: "16px",
                            borderTop: `1px solid ${PINTEREST.border}`,
                          }}>
                            Created {formatDate(store.created_at)}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "stats" && profile && (
                <div style={{
                  maxWidth: "800px",
                  margin: "0 auto",
                }}>
                  <div style={{
                    background: "white",
                    borderRadius: "20px",
                    border: `1px solid ${PINTEREST.border}`,
                    padding: "40px",
                    boxShadow: PINTEREST.cardShadow,
                  }}>
                    <h3 style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: PINTEREST.textDark,
                      margin: "0 0 32px",
                      textAlign: "center",
                    }}>
                      Your Statistics
                    </h3>
                    
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "24px",
                      marginBottom: "40px",
                    }}>
                      <div style={{
                        textAlign: "center",
                        padding: "32px",
                        background: `linear-gradient(135deg, ${PINTEREST.redLight}, #FFEDEF)`,
                        borderRadius: "16px",
                        border: `1px solid ${PINTEREST.border}`,
                      }}>
                        <div style={{
                          fontSize: "64px",
                          fontWeight: "700",
                          color: PINTEREST.primary,
                          marginBottom: "12px",
                        }}>
                          {profile.offersPosted}
                        </div>
                        <div style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: PINTEREST.textDark,
                        }}>
                          Offers Posted
                        </div>
                        <p style={{
                          fontSize: "14px",
                          color: PINTEREST.textLight,
                          margin: "12px 0 0",
                        }}>
                          Books you've listed for exchange or sale
                        </p>
                      </div>
                      
                      <div style={{
                        textAlign: "center",
                        padding: "32px",
                        background: `linear-gradient(135deg, #E6FFF4, #F0FFF8)`,
                        borderRadius: "16px",
                        border: `1px solid ${PINTEREST.border}`,
                      }}>
                        <div style={{
                          fontSize: "64px",
                          fontWeight: "700",
                          color: PINTEREST.success,
                          marginBottom: "12px",
                        }}>
                          {profile.dealsCompleted}
                        </div>
                        <div style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: PINTEREST.textDark,
                        }}>
                          Deals Completed
                        </div>
                        <p style={{
                          fontSize: "14px",
                          color: PINTEREST.textLight,
                          margin: "12px 0 0",
                        }}>
                          Successful exchanges and sales
                        </p>
                      </div>
                    </div>
                    
                    <div style={{
                      background: PINTEREST.redLight,
                      padding: "24px",
                      borderRadius: "16px",
                      marginBottom: "32px",
                      border: `1px solid ${PINTEREST.border}`,
                    }}>
                      <div style={{
                        fontSize: "16px",
                        color: PINTEREST.dark,
                        lineHeight: 1.6,
                        textAlign: "center",
                      }}>
                        <strong>📈 Growth Tip:</strong> Complete more deals to increase your rating and visibility on Boocozmo! 
                        Active traders get more offers and better matches.
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: "14px",
                      color: PINTEREST.textLight,
                      textAlign: "center",
                      paddingTop: "24px",
                      borderTop: `1px solid ${PINTEREST.border}`,
                    }}>
                      Last updated: {formatDate(new Date().toISOString())}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && profile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: PINTEREST.overlay,
                zIndex: 2000,
              }}
            />
            
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
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  width: "90%",
                  maxWidth: "500px",
                  background: "white",
                  borderRadius: "20px",
                  padding: "32px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: PINTEREST.textDark,
                  margin: "0 0 24px",
                  textAlign: "center",
                }}>
                  Edit Profile
                </h3>
                
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: PINTEREST.textDark }}>
                    Profile Photo URL
                  </label>
                  <input
                    type="text"
                    value={editForm.profilePhoto}
                    onChange={(e) => setEditForm(prev => ({ ...prev, profilePhoto: e.target.value }))}
                    placeholder="https://example.com/photo.jpg"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${PINTEREST.border}`,
                      fontSize: "14px",
                    }}
                  />
                  <p style={{ fontSize: "12px", color: PINTEREST.textMuted, marginTop: "6px" }}>
                    Enter a direct image URL (optional)
                  </p>
                </div>
                
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: PINTEREST.textDark }}>
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell others about yourself..."
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${PINTEREST.border}`,
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: "32px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: PINTEREST.textDark }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${PINTEREST.border}`,
                      fontSize: "14px",
                    }}
                  />
                </div>
                
                <div style={{ display: "flex", gap: "16px" }}>
                  <button
                    onClick={() => setShowEditModal(false)}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: PINTEREST.grayLight,
                      color: PINTEREST.textDark,
                      border: `1px solid ${PINTEREST.border}`,
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleUpdateProfile}
                    disabled={editingProfile}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: editingProfile ? PINTEREST.textLight : PINTEREST.primary,
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: editingProfile ? "not-allowed" : "pointer",
                    }}
                  >
                    {editingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Offer Modal */}
      <AnimatePresence>
        {showEditOfferModal && selectedOffer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditOfferModal(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: PINTEREST.overlay,
                zIndex: 2000,
              }}
            />
            
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
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  width: "90%",
                  maxWidth: "500px",
                  background: "white",
                  borderRadius: "20px",
                  padding: "32px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: PINTEREST.textDark,
                  margin: "0 0 24px",
                  textAlign: "center",
                }}>
                  Edit Offer
                </h3>
                
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: PINTEREST.textDark }}>
                    Book Title
                  </label>
                  <input
                    type="text"
                    value={editOfferForm.bookTitle}
                    onChange={(e) => setEditOfferForm(prev => ({ ...prev, bookTitle: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${PINTEREST.border}`,
                      fontSize: "14px",
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: PINTEREST.textDark }}>
                    Author
                  </label>
                  <input
                    type="text"
                    value={editOfferForm.author}
                    onChange={(e) => setEditOfferForm(prev => ({ ...prev, author: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${PINTEREST.border}`,
                      fontSize: "14px",
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: "32px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: PINTEREST.textDark }}>
                    Description
                  </label>
                  <textarea
                    value={editOfferForm.description}
                    onChange={(e) => setEditOfferForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${PINTEREST.border}`,
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>
                
                <div style={{ display: "flex", gap: "16px" }}>
                  <button
                    onClick={() => setShowEditOfferModal(false)}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: PINTEREST.grayLight,
                      color: PINTEREST.textDark,
                      border: `1px solid ${PINTEREST.border}`,
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleSaveEditedOffer}
                    disabled={deletingOffer}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: deletingOffer ? PINTEREST.textLight : PINTEREST.primary,
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: deletingOffer ? "not-allowed" : "pointer",
                    }}
                  >
                    {deletingOffer ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: ${PINTEREST.primary} !important;
          box-shadow: 0 0 0 3px rgba(230, 0, 35, 0.1);
        }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${PINTEREST.grayLight};
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${PINTEREST.border};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${PINTEREST.textLight};
        }
        
        div::-webkit-scrollbar {
          display: none;
        }
        
        button:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}