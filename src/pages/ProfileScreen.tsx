/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ProfileScreen.tsx - GREEN ENERGY THEME: Full Navigation + Photo Upload from Device
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  success: "#6BA87A",
  warning: "#FF9500",
  cardShadow: "0 4px 12px rgba(0,0,0,0.2)",
  cardShadowHover: "0 12px 24px rgba(0,0,0,0.4)",
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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    profilePhotoFile: null as File | null,
    profilePhotoPreview: "" as string,
    bio: "",
    location: "",
  });

  const [showOfferMenu, setShowOfferMenu] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<"offers" | "libraries" | "stats">("offers");

  const [filterType, setFilterType] = useState<"all" | "public" | "private">("all");

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

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

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/profile/${currentUser.email}`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` },
      }, 10000);
      if (!response.ok) throw new Error("Failed to load profile");
      const data = await response.json();
      setProfile(data);
      setEditForm({
        profilePhotoFile: null,
        profilePhotoPreview: data.profilePhoto || "",
        bio: data.bio || "",
        location: data.location || "",
      });
    } catch (err: any) {
      console.error("Error fetching profile:", err);
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

  const fetchMyOffers = useCallback(async () => {
    setLoadingOffers(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/my-offers`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` },
      }, 10000);
      if (!response.ok) throw new Error("Failed to load your offers");
      const data = await response.json();
      setMyOffers(Array.isArray(data.offers) ? data.offers : []);
    } catch (err: any) {
      console.error("Error fetching my offers:", err);
      setMyOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  }, [currentUser.token]);

  const fetchStores = useCallback(async () => {
    setLoadingStores(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/stores?includeOffers=true`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` },
      }, 10000);
      if (!response.ok) throw new Error("Failed to load libraries");
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

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Photo too large (max 5MB)");
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert("Please select an image file");
      return;
    }

    setEditForm(prev => ({ ...prev, profilePhotoFile: file }));

    const reader = new FileReader();
    reader.onload = () => {
      setEditForm(prev => ({ ...prev, profilePhotoPreview: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setEditForm(prev => ({
      ...prev,
      profilePhotoFile: null,
      profilePhotoPreview: "",
    }));
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleUpdateProfile = async () => {
    setEditingProfile(true);
    try {
      let photoBase64: string | null = null;
      if (editForm.profilePhotoFile) {
        const reader = new FileReader();
        photoBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(editForm.profilePhotoFile!);
        });
      }

      const payload: any = {
        bio: editForm.bio.trim() || null,
        location: editForm.location.trim() || null,
      };

      if (photoBase64) {
        payload.profilePhoto = photoBase64;
      } else if (editForm.profilePhotoPreview === "" && profile?.profilePhoto) {
        payload.profilePhoto = null; // Remove photo
      }

      const response = await fetchWithTimeout(`${API_BASE}/update-profile`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }, 10000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update profile");
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

  const handleUnpublishOffer = async (offerId: number) => {
    if (!confirm("Unpublish this offer? It will become private.")) return;
    try {
      const response = await fetchWithTimeout(`${API_BASE}/unpublish-offer/${offerId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${currentUser.token}` },
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

  const handleDeleteOffer = async (offerId: number) => {
    if (!confirm("Delete this offer permanently? This action cannot be undone.")) return;
    try {
      const response = await fetchWithTimeout(`${API_BASE}/delete-offer/${offerId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${currentUser.token}` },
      }, 10000);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete offer");
      }
      await fetchMyOffers();
      await fetchProfile();
      alert("✅ Offer deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting offer:", err);
      alert(err.message || "Failed to delete offer");
    }
  };

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
      await fetchProfile();
      alert("✅ Deal marked as completed!");
    } catch (err: any) {
      console.error("Error closing deal:", err);
      alert(err.message || "Failed to close deal");
    }
  };

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

  const getImageSource = (offer: Offer) => {
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
  };

  const formatPrice = (price: number | null) => price ? `$${price.toFixed(2)}` : "Free";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredOffers = useMemo(() => {
    let result = myOffers;
    if (filterType !== "all") {
      result = result.filter(o => filterType === "public" ? o.visibility === "public" : o.visibility === "private");
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
      background: GREEN.dark,
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
          background: GREEN.medium,
          borderRight: `1px solid ${GREEN.border}`,
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 1000,
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
          onClick={() => setSidebarOpen(false)}
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
            <div style={{ fontSize: "12px", color: GREEN.textSecondary }}>My Profile</div>
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
                color: GREEN.textPrimary,
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
        )}

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
          zIndex: 100,
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
              <h1 style={{ fontSize: "20px", fontWeight: "700", color: GREEN.textPrimary, margin: 0 }}>
                My Profile
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                onClick={onBack || (() => navigate(-1))}
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
                <FaArrowLeft size={16} color={GREEN.textPrimary} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "16px",
                  background: activeTab === tab.id ? GREEN.accent : GREEN.grayLight,
                  color: activeTab === tab.id ? "white" : GREEN.textPrimary,
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
                    background: activeTab === tab.id ? "rgba(255,255,255,0.3)" : GREEN.grayLight,
                    color: activeTab === tab.id ? "white" : GREEN.textSecondary,
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

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left Profile Panel */}
          <motion.div
            animate={{ width: sidebarCollapsed ? "60px" : "280px" }}
            transition={{ duration: 0.3 }}
            style={{
              background: GREEN.medium,
              borderRight: `1px solid ${GREEN.border}`,
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
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                position: "absolute",
                top: "16px",
                right: "-12px",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: GREEN.medium,
                border: `1px solid ${GREEN.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: GREEN.textPrimary,
                cursor: "pointer",
                fontSize: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                zIndex: 10,
              }}
            >
              {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>

            <div style={{ position: "relative", textAlign: sidebarCollapsed ? "center" : "left" }}>
              <div style={{
                width: sidebarCollapsed ? "48px" : "100px",
                height: sidebarCollapsed ? "48px" : "100px",
                borderRadius: "50%",
                background: profile?.profilePhoto
                  ? `url(${profile.profilePhoto}) center/cover no-repeat`
                  : GREEN.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: sidebarCollapsed ? "20px" : "36px",
                fontWeight: "600",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                marginBottom: sidebarCollapsed ? "0" : "16px",
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
                    background: GREEN.accent,
                    color: "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  <FaCamera />
                </button>
              )}
            </div>

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
                        border: `3px solid ${GREEN.accent}20`,
                        borderTopColor: GREEN.accent,
                        borderRadius: "50%",
                        margin: "0 auto",
                        animation: "spin 1s linear infinite",
                      }} />
                    </div>
                  ) : profile && (
                    <>
                      <h2 style={{ fontSize: "18px", fontWeight: "700", color: GREEN.textPrimary, margin: "0 0 8px" }}>
                        {profile.name}
                      </h2>
                      <p style={{ fontSize: "13px", color: GREEN.textSecondary, margin: "0 0 16px", lineHeight: 1.5 }}>
                        {profile.bio || "No bio yet"}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: GREEN.textPrimary }}>
                          <FaMapMarkerAlt size={12} color={GREEN.textSecondary} />
                          <span>{profile.location || "Unknown"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: GREEN.textPrimary }}>
                          <FaCalendarAlt size={12} color={GREEN.textSecondary} />
                          <span>Joined {formatDate(profile.joinedAt)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!sidebarCollapsed ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", width: "100%", marginTop: "12px" }}
                >
                  <div style={{
                    background: GREEN.grayLight,
                    borderRadius: "10px",
                    padding: "14px",
                    textAlign: "center",
                    border: `1px solid ${GREEN.border}`,
                  }}>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: GREEN.accentLight, marginBottom: "4px" }}>
                      {profile?.offersPosted || 0}
                    </div>
                    <div style={{ fontSize: "11px", color: GREEN.textSecondary }}>Offers</div>
                  </div>
                  <div style={{
                    background: GREEN.grayLight,
                    borderRadius: "10px",
                    padding: "14px",
                    textAlign: "center",
                    border: `1px solid ${GREEN.border}`,
                  }}>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: GREEN.success, marginBottom: "4px" }}>
                      {profile?.dealsCompleted || 0}
                    </div>
                    <div style={{ fontSize: "11px", color: GREEN.textSecondary }}>Deals</div>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: GREEN.accentLight, marginBottom: "4px" }}>
                    {profile?.offersPosted || 0}
                  </div>
                  <div style={{ fontSize: "10px", color: GREEN.textSecondary, marginBottom: "12px" }}>Offers</div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: GREEN.success }}>
                    {profile?.dealsCompleted || 0}
                  </div>
                  <div style={{ fontSize: "10px", color: GREEN.textSecondary }}>Deals</div>
                </motion.div>
              )}
            </AnimatePresence>

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
                    background: GREEN.accent,
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
          <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
            {activeTab === "offers" && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: "700", color: GREEN.textPrimary, margin: "0 0 8px" }}>
                      My Book Offers
                    </h3>
                    <p style={{ fontSize: "14px", color: GREEN.textSecondary, margin: 0 }}>
                      {filteredOffers.length} offer{filteredOffers.length !== 1 ? 's' : ''} • {filterType}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {["all", "public", "private"].map((f) => (
                        <button
                          key={f}
                          onClick={() => setFilterType(f as any)}
                          style={{
                            padding: "10px 16px",
                            borderRadius: "8px",
                            background: filterType === f ? GREEN.accent : GREEN.grayLight,
                            color: filterType === f ? "white" : GREEN.textPrimary,
                            fontSize: "14px",
                            fontWeight: "600",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => navigate("/offer")}
                      style={{
                        padding: "10px 20px",
                        background: GREEN.accent,
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
                      Create Offer
                    </button>
                  </div>
                </div>

                {loadingOffers ? (
                  <div style={{ textAlign: "center", padding: "60px" }}>
                    <div style={{ width: "40px", height: "40px", border: `3px solid ${GREEN.accent}20`, borderTopColor: GREEN.accent, borderRadius: "50%", margin: "0 auto", animation: "spin 1s linear infinite" }} />
                  </div>
                ) : filteredOffers.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px", background: GREEN.medium, borderRadius: "16px", border: `2px dashed ${GREEN.border}` }}>
                    <FaBook size={60} style={{ color: GREEN.textSecondary, opacity: 0.5, marginBottom: "20px" }} />
                    <h3 style={{ fontSize: "22px", fontWeight: "600", color: GREEN.textPrimary, marginBottom: "12px" }}>
                      No offers yet
                    </h3>
                    <p style={{ color: GREEN.textSecondary, fontSize: "16px", marginBottom: "24px" }}>
                      Create your first book offer to get started
                    </p>
                    <button onClick={() => navigate("/offer")} style={{
                      padding: "14px 32px",
                      background: GREEN.accent,
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "16px",
                      fontWeight: "600",
                    }}>
                      Create Your First Offer
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
                    {filteredOffers.map((offer) => (
                      <motion.div
                        key={offer.id}
                        whileHover={{ y: -4 }}
                        style={{
                          background: GREEN.medium,
                          borderRadius: "16px",
                          border: `1px solid ${GREEN.border}`,
                          padding: "20px",
                          boxShadow: GREEN.cardShadow,
                          position: "relative",
                        }}
                      >
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
                            background: GREEN.grayLight,
                            border: `1px solid ${GREEN.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: GREEN.textPrimary,
                            cursor: "pointer",
                          }}
                        >
                          <FaEllipsisV />
                        </button>

                        {showOfferMenu === offer.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                              position: "absolute",
                              top: "60px",
                              right: "16px",
                              background: GREEN.medium,
                              borderRadius: "12px",
                              boxShadow: GREEN.cardShadowHover,
                              border: `1px solid ${GREEN.border}`,
                              zIndex: 20,
                              minWidth: "200px",
                            }}
                          >
                            {offer.visibility === "private" ? (
                              <button onClick={() => { handlePublishOffer(offer.id); setShowOfferMenu(null); }} style={{
                                width: "100%",
                                padding: "14px 18px",
                                background: "transparent",
                                border: "none",
                                borderBottom: `1px solid ${GREEN.border}`,
                                color: GREEN.textPrimary,
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}>
                                <FaGlobe size={14} />
                                Publish Publicly
                              </button>
                            ) : (
                              <button onClick={() => { handleUnpublishOffer(offer.id); setShowOfferMenu(null); }} style={{
                                width: "100%",
                                padding: "14px 18px",
                                background: "transparent",
                                border: "none",
                                borderBottom: `1px solid ${GREEN.border}`,
                                color: GREEN.textPrimary,
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}>
                                <FaLock size={14} />
                                Make Private
                              </button>
                            )}
                            <button onClick={() => { handleDeleteOffer(offer.id); setShowOfferMenu(null); }} style={{
                              width: "100%",
                              padding: "14px 18px",
                              background: "transparent",
                              border: "none",
                              color: "#FF6B6B",
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}>
                              <FaTrash size={14} />
                              Delete Offer
                            </button>
                            {offer.visibility === "public" && offer.state === "open" && (
                              <button onClick={() => { handleCloseDeal(offer.id); setShowOfferMenu(null); }} style={{
                                width: "100%",
                                padding: "14px 18px",
                                background: "transparent",
                                border: "none",
                                color: GREEN.success,
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}>
                                <FaCheck size={14} />
                                Mark as Completed
                              </button>
                            )}
                          </motion.div>
                        )}

                        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                          <div style={{ width: "100px", height: "140px", borderRadius: "10px", overflow: "hidden", background: GREEN.grayLight }}>
                            <img src={getImageSource(offer)} alt={offer.bookTitle} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>

                          <div style={{ flex: 1 }}>
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
                                background: offer.visibility === "public" ? GREEN.success : GREEN.warning,
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
                                {offer.visibility}
                              </div>
                            </div>

                            <h4 style={{ fontSize: "18px", fontWeight: "600", color: GREEN.textPrimary, margin: "0 0 8px" }}>
                              {offer.bookTitle}
                            </h4>
                            {offer.author && (
                              <p style={{ fontSize: "14px", color: GREEN.textSecondary, margin: "0 0 12px", fontStyle: "italic" }}>
                                {offer.author}
                              </p>
                            )}
                            <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: GREEN.textSecondary }}>
                              <span style={{ background: GREEN.grayLight, padding: "4px 10px", borderRadius: "6px" }}>
                                {offer.genre || "Fiction"}
                              </span>
                              <span>{offer.condition || "Good"}</span>
                              {offer.price && <span style={{ fontWeight: "600", color: GREEN.accentLight }}>{formatPrice(offer.price)}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{
                          fontSize: "13px",
                          color: GREEN.textMuted,
                          display: "flex",
                          justifyContent: "space-between",
                          paddingTop: "16px",
                          borderTop: `1px solid ${GREEN.border}`,
                        }}>
                          <span>Created {formatDate(offer.created_at || offer.lastUpdated || "")}</span>
                          {offer.publishedAt && <span>Published {formatDate(offer.publishedAt)}</span>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "libraries" && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: "700", color: GREEN.textPrimary, margin: "0 0 8px" }}>
                      My Libraries
                    </h3>
                    <p style={{ fontSize: "14px", color: GREEN.textSecondary, margin: 0 }}>
                      Organize your books in private collections
                    </p>
                  </div>
                  <button onClick={() => navigate("/my-library")} style={{
                    padding: "10px 20px",
                    background: GREEN.accent,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}>
                    <FaPlus size={14} /> Manage Libraries
                  </button>
                </div>

                {loadingStores ? (
                  <div style={{ textAlign: "center", padding: "60px" }}>
                    <div style={{ width: "40px", height: "40px", border: `3px solid ${GREEN.accent}20`, borderTopColor: GREEN.accent, borderRadius: "50%", margin: "0 auto", animation: "spin 1s linear infinite" }} />
                  </div>
                ) : stores.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px", background: GREEN.medium, borderRadius: "16px", border: `2px dashed ${GREEN.border}` }}>
                    <FaFolder size={60} style={{ color: GREEN.textSecondary, opacity: 0.5, marginBottom: "20px" }} />
                    <h3 style={{ fontSize: "22px", fontWeight: "600", color: GREEN.textPrimary, marginBottom: "12px" }}>
                      No libraries yet
                    </h3>
                    <p style={{ color: GREEN.textSecondary, fontSize: "16px", marginBottom: "24px" }}>
                      Create your first library to organize your books
                    </p>
                    <button onClick={() => navigate("/my-library")} style={{
                      padding: "14px 32px",
                      background: GREEN.accent,
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      fontSize: "16px",
                      fontWeight: "600",
                    }}>
                      Create Library
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                    {stores.map((store) => (
                      <motion.div
                        key={store.id}
                        whileHover={{ y: -4 }}
                        onClick={() => navigate("/my-library")}
                        style={{
                          background: GREEN.medium,
                          borderRadius: "16px",
                          border: `1px solid ${GREEN.border}`,
                          padding: "24px",
                          boxShadow: GREEN.cardShadow,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                          <div style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "12px",
                            background: GREEN.grayLight,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: GREEN.accentLight,
                            fontSize: "24px",
                          }}>
                            <FaFolder />
                          </div>
                          <div>
                            <h4 style={{ fontSize: "18px", fontWeight: "600", color: GREEN.textPrimary, margin: "0 0 6px" }}>
                              {store.name}
                            </h4>
                            <div style={{ fontSize: "14px", color: GREEN.textSecondary }}>
                              {store.offerIds?.length || 0} books • Private Collection
                            </div>
                          </div>
                        </div>
                        <div style={{
                          fontSize: "13px",
                          color: GREEN.textMuted,
                          paddingTop: "16px",
                          borderTop: `1px solid ${GREEN.border}`,
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
              <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <div style={{
                  background: GREEN.medium,
                  borderRadius: "20px",
                  border: `1px solid ${GREEN.border}`,
                  padding: "40px",
                  boxShadow: GREEN.cardShadow,
                }}>
                  <h3 style={{ fontSize: "24px", fontWeight: "700", color: GREEN.textPrimary, margin: "0 0 32px", textAlign: "center" }}>
                    Your Statistics
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", marginBottom: "40px" }}>
                    <div style={{
                      textAlign: "center",
                      padding: "32px",
                      background: GREEN.grayLight,
                      borderRadius: "16px",
                      border: `1px solid ${GREEN.border}`,
                    }}>
                      <div style={{ fontSize: "64px", fontWeight: "700", color: GREEN.accentLight, marginBottom: "12px" }}>
                        {profile.offersPosted}
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: "600", color: GREEN.textPrimary }}>
                        Offers Posted
                      </div>
                      <p style={{ fontSize: "14px", color: GREEN.textSecondary, margin: "12px 0 0" }}>
                        Books you've listed
                      </p>
                    </div>
                    <div style={{
                      textAlign: "center",
                      padding: "32px",
                      background: GREEN.grayLight,
                      borderRadius: "16px",
                      border: `1px solid ${GREEN.border}`,
                    }}>
                      <div style={{ fontSize: "64px", fontWeight: "700", color: GREEN.success, marginBottom: "12px" }}>
                        {profile.dealsCompleted}
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: "600", color: GREEN.textPrimary }}>
                        Deals Completed
                      </div>
                      <p style={{ fontSize: "14px", color: GREEN.textSecondary, margin: "12px 0 0" }}>
                        Successful exchanges
                      </p>
                    </div>
                  </div>
                  <div style={{
                    background: GREEN.hoverBg,
                    padding: "24px",
                    borderRadius: "16px",
                    textAlign: "center",
                    color: GREEN.textPrimary,
                  }}>
                    <strong>📈 Growth Tip:</strong> Complete more deals to increase your visibility!
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal - Photo Upload from Device */}
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
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                zIndex: 2000,
              }}
            />
            <div style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2001,
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  width: "90%",
                  maxWidth: "500px",
                  background: GREEN.medium,
                  borderRadius: "20px",
                  padding: "32px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                }}
              >
                <h3 style={{ fontSize: "22px", fontWeight: "700", color: GREEN.textPrimary, margin: "0 0 24px", textAlign: "center" }}>
                  Edit Profile
                </h3>

                {/* Photo Upload Section */}
                <div style={{ marginBottom: "24px", textAlign: "center" }}>
                  <label style={{ display: "block", marginBottom: "12px", fontSize: "14px", fontWeight: "600", color: GREEN.textPrimary }}>
                    Profile Photo
                  </label>

                  <div style={{ position: "relative", display: "inline-block" }}>
                    <div style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      background: editForm.profilePhotoPreview
                        ? `url(${editForm.profilePhotoPreview}) center/cover no-repeat`
                        : GREEN.grayLight,
                      border: `4px solid ${GREEN.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: GREEN.textPrimary,
                      fontSize: "40px",
                      fontWeight: "600",
                    }}>
                      {!editForm.profilePhotoPreview && currentUser.name.charAt(0).toUpperCase()}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => photoInputRef.current?.click()}
                      style={{
                        position: "absolute",
                        bottom: "0",
                        right: "0",
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: GREEN.accent,
                        color: "white",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      }}
                    >
                      <FaCamera size={16} />
                    </motion.button>

                    {editForm.profilePhotoPreview && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={removePhoto}
                        style={{
                          position: "absolute",
                          top: "0",
                          right: "0",
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "#FF6B6B",
                          color: "white",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        ×
                      </motion.button>
                    )}
                  </div>

                  <p style={{ fontSize: "12px", color: GREEN.textMuted, margin: "12px 0 0" }}>
                    Tap the camera to choose a photo
                  </p>

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoPick}
                    style={{ display: "none" }}
                  />
                </div>

                {/* Bio */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: GREEN.textPrimary }}>
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    placeholder="Tell others about yourself..."
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${GREEN.border}`,
                      background: GREEN.grayLight,
                      color: GREEN.textPrimary,
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* Location */}
                <div style={{ marginBottom: "32px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: GREEN.textPrimary }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. New York, NY"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${GREEN.border}`,
                      background: GREEN.grayLight,
                      color: GREEN.textPrimary,
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <button onClick={() => setShowEditModal(false)} style={{
                    flex: 1,
                    padding: "14px",
                    background: GREEN.grayLight,
                    color: GREEN.textPrimary,
                    border: `1px solid ${GREEN.border}`,
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}>
                    Cancel
                  </button>
                  <button onClick={handleUpdateProfile} disabled={editingProfile} style={{
                    flex: 1,
                    padding: "14px",
                    background: editingProfile ? GREEN.grayLight : GREEN.accent,
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}>
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
        input:focus, textarea:focus {
          outline: none;
          border-color: ${GREEN.accent} !important;
        }
      `}</style>
    </div>
  );
}