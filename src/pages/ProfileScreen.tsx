/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ProfileScreen.tsx - Fixed with collapsible sidebar
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

// FIXED: Added 'closed' to the state type
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
  state?: OfferState; // FIXED: Now includes 'closed'
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
};

type Props = {
  currentUser: {
    email: string;
    name: string;
    token: string;
  };
  onBack?: () => void;
  onLogout?: () => void;
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

export default function ProfileScreen({ currentUser, onBack }: Props) {
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
  const [, setShowEditOfferModal] = useState(false);
  // eslint-disable-next-line no-empty-pattern
  const [] = useState(false);
   
  const [, setSelectedOffer] = useState<Offer | null>(null);
  const [, setEditOfferForm] = useState({
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
  
  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "public" | "private">("all");
  
  // FIXED: Sidebar width state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    }
  };

  // Edit offer

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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.bookTitle.toLowerCase().includes(q) ||
          o.author?.toLowerCase().includes(q) ||
          o.description?.toLowerCase().includes(q) ||
          o.genre?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [myOffers, filterType, searchQuery]);

  // Filter stores
  const filteredStores = useMemo(() => {
    let result = stores;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((store) =>
        store.name.toLowerCase().includes(q)
      );
    }

    return result;
  }, [stores, searchQuery]);

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
      flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px",
        background: "white",
        borderBottom: `1px solid ${PINTEREST.border}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={onBack ? onBack : () => navigate(-1)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "white",
              border: `1px solid ${PINTEREST.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: PINTEREST.textDark,
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            <FaArrowLeft />
          </button>
          <h1 style={{
            fontSize: "24px",
            fontWeight: "700",
            color: PINTEREST.textDark,
            margin: 0,
          }}>
            My Profile
          </h1>
        </div>
      </div>

      <div style={{ 
        flex: 1,
        display: "flex",
        overflow: "hidden",
      }}>
        {/* Left Sidebar - Profile Info - NOW COLLAPSIBLE */}
        <motion.div
          animate={{ width: sidebarCollapsed ? "60px" : "280px" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{
            background: PINTEREST.sidebarBg,
            borderRight: `1px solid ${PINTEREST.border}`,
            padding: sidebarCollapsed ? "24px 12px" : "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: sidebarCollapsed ? "center" : "flex-start",
            gap: sidebarCollapsed ? "20px" : "24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Collapse/Expand Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              position: "absolute",
              top: "20px",
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
              width: sidebarCollapsed ? "48px" : "120px",
              height: sidebarCollapsed ? "48px" : "120px",
              borderRadius: "50%",
              background: profile?.profilePhoto 
                ? `url(${profile.profilePhoto}) center/cover no-repeat`
                : `linear-gradient(135deg, ${PINTEREST.primary}, ${PINTEREST.dark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: profile?.profilePhoto ? "transparent" : "white",
              fontSize: sidebarCollapsed ? "20px" : "48px",
              fontWeight: "600",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
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
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: PINTEREST.primary,
                  color: "white",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "14px",
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
                style={{ textAlign: "center", width: "100%" }}
              >
                {loadingProfile ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      width: "30px",
                      height: "30px",
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
                      fontSize: "22px",
                      fontWeight: "700",
                      color: PINTEREST.textDark,
                      margin: "0 0 8px",
                    }}>
                      {profile.name}
                    </h2>
                    
                    <p style={{
                      fontSize: "14px",
                      color: PINTEREST.textLight,
                      margin: "0 0 12px",
                      lineHeight: 1.5,
                    }}>
                      {profile.bio || "No bio yet"}
                    </p>
                    
                    <div style={{ 
                      display: "flex", 
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "16px",
                      width: "100%",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: PINTEREST.textDark }}>
                        <FaMapMarkerAlt size={12} color={PINTEREST.textLight} />
                        <span>{profile.location || "Unknown location"}</span>
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

          {/* Stats Cards - Compact when collapsed */}
          <AnimatePresence>
            {!sidebarCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr", 
                  gap: "12px", 
                  width: "100%",
                  marginTop: "16px",
                }}
              >
                <div style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "16px",
                  textAlign: "center",
                  border: `1px solid ${PINTEREST.border}`,
                  boxShadow: PINTEREST.cardShadow,
                }}>
                  <div style={{ 
                    fontSize: "28px", 
                    fontWeight: "700", 
                    color: PINTEREST.primary,
                    marginBottom: "4px",
                  }}>
                    {profile?.offersPosted || 0}
                  </div>
                  <div style={{ fontSize: "12px", color: PINTEREST.textLight }}>
                    Offers Posted
                  </div>
                </div>
                
                <div style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "16px",
                  textAlign: "center",
                  border: `1px solid ${PINTEREST.border}`,
                  boxShadow: PINTEREST.cardShadow,
                }}>
                  <div style={{ 
                    fontSize: "28px", 
                    fontWeight: "700", 
                    color: PINTEREST.success,
                    marginBottom: "4px",
                  }}>
                    {profile?.dealsCompleted || 0}
                  </div>
                  <div style={{ fontSize: "12px", color: PINTEREST.textLight }}>
                    Deals Completed
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
                <div style={{ fontSize: "11px", color: PINTEREST.textLight, marginBottom: "4px" }}>
                  Offers
                </div>
                <div style={{ 
                  fontSize: "20px", 
                  fontWeight: "700", 
                  color: PINTEREST.primary,
                  marginBottom: "12px",
                }}>
                  {profile?.offersPosted || 0}
                </div>
                
                <div style={{ fontSize: "11px", color: PINTEREST.textLight, marginBottom: "4px" }}>
                  Deals
                </div>
                <div style={{ 
                  fontSize: "20px", 
                  fontWeight: "700", 
                  color: PINTEREST.success,
                }}>
                  {profile?.dealsCompleted || 0}
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
                  padding: "14px",
                  background: PINTEREST.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "16px",
                }}
              >
                <FaEdit size={14} />
                Edit Profile
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Main Content - NOW WIDER */}
        <div style={{ 
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0, // Prevents overflow
        }}>
          {/* Tabs */}
          <div style={{
            padding: "0 24px",
            background: "white",
            borderBottom: `1px solid ${PINTEREST.border}`,
          }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "16px 24px",
                    background: "transparent",
                    border: "none",
                    borderBottom: `3px solid ${activeTab === tab.id ? PINTEREST.primary : "transparent"}`,
                    color: activeTab === tab.id ? PINTEREST.primary : PINTEREST.textLight,
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{
                      background: activeTab === tab.id ? PINTEREST.primary : PINTEREST.grayLight,
                      color: activeTab === tab.id ? "white" : PINTEREST.textLight,
                      fontSize: "12px",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      fontWeight: "600",
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div style={{ 
            flex: 1, 
            overflowY: "auto", 
            padding: "24px",
            minWidth: 0, // Prevents overflow
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
                      Manage your book offers, publish them publicly, or keep them private
                    </p>
                  </div>
                  
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        placeholder="Search offers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          padding: "10px 12px 10px 36px",
                          borderRadius: "8px",
                          border: `1px solid ${PINTEREST.border}`,
                          background: PINTEREST.grayLight,
                          fontSize: "14px",
                          width: "240px",
                          minWidth: "200px",
                        }}
                      />
                    </div>
                    
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
                      Create your first book offer to get started
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
                      Create Offer
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
                                  transition: "background 0.2s ease",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = PINTEREST.hoverBg}
                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
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
                                  transition: "background 0.2s ease",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = PINTEREST.hoverBg}
                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                              >
                                <FaLock size={14} />
                                Make Private
                              </button>
                            )}
                            
                            <button
                              onClick={() => {
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
                                transition: "background 0.2s ease",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = PINTEREST.hoverBg}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
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
                                  transition: "background 0.2s ease",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = PINTEREST.hoverBg}
                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
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
                                transition: "background 0.2s ease",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = PINTEREST.hoverBg}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
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
                              
                              {/* FIXED: Now offer.state can be 'closed' */}
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
                  
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder="Search libraries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: `1px solid ${PINTEREST.border}`,
                        background: PINTEREST.grayLight,
                        fontSize: "14px",
                        width: "240px",
                        minWidth: "200px",
                      }}
                    />
                    
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
                ) : filteredStores.length === 0 ? (
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
                    {filteredStores.map((store) => (
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
                zIndex: 1000,
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
              zIndex: 1001,
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
      `}</style>
    </div>
  );
}