/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/MyLibraryScreen.tsx - REDESIGNED LAYOUT
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBook,
  FaPlus,
  FaFolder,
  FaTrash,
  FaSearch,
  FaDollarSign,
  FaExchangeAlt,
  FaArrowLeft,
  FaEllipsisV,
  FaGlobe,
  FaEyeSlash,
  FaImage,
  FaMapMarkerAlt,
  FaHome,
  FaMapMarkedAlt,
  FaComments,
  FaBell,
  FaBookmark,
  FaCog,
  FaBookOpen as FaBookOpenIcon,
  FaUsers,
  FaCompass,
  FaStar,
  FaTimes,
  FaBars,
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
  cardShadow: "0 1px 3px rgba(0,0,0,0.08)",
  cardShadowHover: "0 4px 12px rgba(0,0,0,0.12)",
};

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
  state?: "open" | "draft" | "private";
};

type Store = {
  id: number;
  name: string;
  ownerEmail: string;
  created_at: string;
  offerIds?: number[];
  offers?: Offer[];
};

type Props = {
  currentUser: {
    email: string;
    name: string;
    token: string;
  };
  onBack?: () => void;
  onAddPress?: () => void;
  onMapPress?: () => void;
  onProfilePress?: () => void;
};

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export default function MyLibraryScreen({ 
  currentUser, 
  onBack,
  onAddPress,
  onMapPress,
  onProfilePress 
}: Props) {
  const navigate = useNavigate();

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [storeOffers, setStoreOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(false);

  const [showCreateStoreModal, setShowCreateStoreModal] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [bookToPublish, setBookToPublish] = useState<Offer | null>(null);

  const [newStoreName, setNewStoreName] = useState("");
  const [creatingStore, setCreatingStore] = useState(false);

  const [newBookForm, setNewBookForm] = useState({
    bookTitle: "",
    author: "",
    genre: "Fiction",
    condition: "Good",
    description: "",
    imageFile: null as File | null,
    imagePreview: null as string | null,
  });
  const [addingBook, setAddingBook] = useState(false);

  const [publishForm, setPublishForm] = useState({
    type: "sell" as "sell" | "exchange",
    price: "",
    exchangeBook: "",
    latitude: 40.7128,
    longitude: -74.0060,
  });
  const [publishing, setPublishing] = useState(false);

  const [showBookMenu, setShowBookMenu] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Navigation items
  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress || (() => navigate("/map")) },
    { icon: FaBookOpenIcon, label: "My Library", active: true, onClick: () => navigate("/my-library") },
    { icon: FaCompass, label: "Discover", onClick: () => navigate("/discover") },
    { icon: FaBookmark, label: "Saved", onClick: () => navigate("/saved") },
    { icon: FaUsers, label: "Following", onClick: () => navigate("/following") },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
    { icon: FaBell, label: "Notifications", onClick: () => navigate("/notifications") },
    { icon: FaStar, label: "Top Picks", onClick: () => navigate("/top-picks") },
  ];

  // Fetch user's private libraries (stores)
  const fetchStores = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/stores?includeOffers=false`, {
        signal: abortControllerRef.current.signal,
        headers: { Authorization: `Bearer ${currentUser.token}` },
      }, 15000);

      if (!response.ok) throw new Error("Failed to load libraries");
      const data = await response.json();
      const userStores = data.filter((s: Store) => s.ownerEmail === currentUser.email);
      setStores(userStores);
      if (userStores.length > 0 && !selectedStore) setSelectedStore(userStores[0]);
    } catch (err: any) {
      if (err.name !== "AbortError") console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser.email, currentUser.token, selectedStore]);

  // Fetch books in selected library
  const fetchStoreOffers = useCallback(async (store: Store) => {
    if (!store?.offerIds?.length) {
      setStoreOffers([]);
      return;
    }
    setLoadingOffers(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/store-offers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ store: { offerIds: store.offerIds } }),
      });
      if (!response.ok) throw new Error("Failed to load books");
      const data = await response.json();
      const processed = data.map((o: any) => ({
        ...o,
        price: o.price ? parseFloat(o.price) : null,
        latitude: o.latitude ? parseFloat(o.latitude) : null,
        longitude: o.longitude ? parseFloat(o.longitude) : null,
      }));
      setStoreOffers(processed);
    } catch (err) {
      console.error(err);
      setStoreOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  }, [currentUser.token]);

  // Create new private library
  const handleCreateStore = async () => {
    if (!newStoreName.trim()) return alert("Enter a library name");
    setCreatingStore(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/create-store`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newStoreName.trim(), offers: [] }),
      });
      if (!response.ok) throw new Error("Failed to create library");
      await fetchStores();
      setNewStoreName("");
      setShowCreateStoreModal(false);
      alert("Library created!");
    } catch (err: any) {
      alert(err.message || "Failed");
    } finally {
      setCreatingStore(false);
    }
  };

  // Add private book to library (type: sell, no public offer yet)
  const handleAddBook = async () => {
    if (!selectedStore) return alert("Select a library");
    if (!newBookForm.bookTitle.trim() || !newBookForm.author.trim()) return alert("Title & author required");

    setAddingBook(true);
    try {
      let imageBase64 = null;
      if (newBookForm.imageFile) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(newBookForm.imageFile!);
        });
      }

      const offerData = {
        type: "sell" as const,
        bookTitle: newBookForm.bookTitle.trim(),
        author: newBookForm.author,
        genre: newBookForm.genre,
        condition: newBookForm.condition,
        description: newBookForm.description,
        image: imageBase64,
        price: null,
        exchangeBook: null,
        latitude: null,
        longitude: null,
      };

      const response = await fetchWithTimeout(`${API_BASE}/add-to-store/${selectedStore.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offers: [offerData] }),
      });

      if (!response.ok) throw new Error("Failed to add book");
      // Immediately refresh books in current library
      await fetchStoreOffers(selectedStore);
      setNewBookForm({
        bookTitle: "",
        author: "",
        genre: "Fiction",
        condition: "Good",
        description: "",
        imageFile: null,
        imagePreview: null,
      });
      setShowAddBookModal(false);
      alert("Book added to your private library!");
    } catch (err: any) {
      alert(err.message || "Failed to add book");
    } finally {
      setAddingBook(false);
    }
  };

  // Publish book as public offer using /submit-offer route
  const handlePublish = async () => {
    if (!bookToPublish) return;
    if (publishForm.type === "sell" && !publishForm.price) return alert("Enter price");
    if (publishForm.type === "exchange" && !publishForm.exchangeBook.trim()) return alert("Enter exchange book");

    setPublishing(true);
    try {
      // Use existing image if available
      const imageBase64 = bookToPublish.imageBase64 || bookToPublish.imageUrl || null;

      const offerPayload = {
        type: publishForm.type,
        bookTitle: bookToPublish.bookTitle,
        exchangeBook: publishForm.type === "exchange" ? publishForm.exchangeBook.trim() : null,
        price: publishForm.type === "sell" ? Number(publishForm.price) : null,
        latitude: publishForm.latitude,
        longitude: publishForm.longitude,
        image: imageBase64, // backend accepts base64
        condition: bookToPublish.condition,
      };

      const response = await fetchWithTimeout(`${API_BASE}/submit-offer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(offerPayload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to publish");
      }

      alert("Book published successfully! It's now visible to others.");
      setShowPublishModal(false);
      setBookToPublish(null);
    } catch (err: any) {
      alert(err.message || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const handleRemove = async (offerId: number) => {
    if (!selectedStore || !confirm("Remove this book from library?")) return;
    try {
      const response = await fetchWithTimeout(
        `${API_BASE}/remove-from-store/${selectedStore.id}/${offerId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      if (!response.ok) throw new Error("Failed");
      await fetchStoreOffers(selectedStore);
      alert("Book removed from library");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Failed to remove");
    }
  };

  const getImageSource = (offer: Offer) => {
    if (offer.imageUrl) return offer.imageUrl;
    if (offer.imageBase64) return offer.imageBase64.startsWith("data:") ? offer.imageBase64 : `data:image/jpeg;base64,${offer.imageBase64}`;
    const fallbacks = [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80",
      "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=300&h=380&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=420&fit=crop&q=80",
    ];
    return fallbacks[offer.id % fallbacks.length];
  };

  useEffect(() => {
    fetchStores();
    return () => abortControllerRef.current?.abort();
  }, [fetchStores]);

  useEffect(() => {
    if (selectedStore) fetchStoreOffers(selectedStore);
    else setStoreOffers([]);
  }, [selectedStore, fetchStoreOffers]);

  const filteredOffers = useMemo(() => {
    let result = storeOffers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.bookTitle.toLowerCase().includes(q) ||
        o.author?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [storeOffers, searchQuery]);

  return (
    <div style={{ height: "100vh", width: "100vw", background: PINTEREST.bg, display: "flex", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
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

        {/* User Profile */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={onProfilePress || (() => navigate("/profile"))}
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
            <div style={{ fontSize: "12px", color: PINTEREST.textLight }}>View profile</div>
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
          onClick={() => navigate("/settings")}
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

              {/* Back Button */}
              <button
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
                  flexShrink: 0,
                }}
              >
                <FaArrowLeft size={16} color={PINTEREST.textDark} />
              </button>

              {/* Search */}
              <div style={{ position: "relative", flex: 1 }}>
                <FaSearch
                  size={12}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: PINTEREST.icon,
                    zIndex: 1,
                  }}
                />
                <input
                  type="text"
                  placeholder="Search books in library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 10px 10px 36px",
                    borderRadius: "20px",
                    border: `1px solid ${PINTEREST.border}`,
                    fontSize: "14px",
                    background: PINTEREST.grayLight,
                    color: PINTEREST.textDark,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Add Book Button */}
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              onClick={() => setShowAddBookModal(true)}
              style={{ 
                padding: "10px 20px", 
                background: PINTEREST.primary, 
                color: "white", 
                border: "none", 
                borderRadius: 8, 
                display: "flex", 
                alignItems: "center", 
                gap: 6,
                fontWeight: 600,
              }}
            >
              <FaPlus /> Add Book
            </motion.button>
          </div>
        </header>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Libraries Row - Horizontal Scroll */}
          <div style={{
            padding: "20px 24px",
            background: "white",
            borderBottom: `1px solid ${PINTEREST.border}`,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>My Libraries</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowCreateStoreModal(true)}
                style={{
                  padding: "8px 16px",
                  background: PINTEREST.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FaPlus size={14} /> New Library
              </motion.button>
            </div>

            {/* Libraries Cards Row */}
            <div style={{ 
              display: "flex", 
              gap: "16px", 
              overflowX: "auto",
              paddingBottom: "8px",
              scrollbarWidth: "thin",
            }}>
              {loading ? (
                <div style={{ padding: "40px 20px", textAlign: "center", width: "100%" }}>
                  Loading libraries...
                </div>
              ) : stores.length === 0 ? (
                <div style={{ 
                  padding: "40px 20px", 
                  textAlign: "center", 
                  width: "100%",
                  border: `2px dashed ${PINTEREST.border}`,
                  borderRadius: "12px",
                }}>
                  <FaFolder size={40} style={{ color: PINTEREST.textLight, opacity: 0.5, marginBottom: "16px" }} />
                  <p style={{ marginBottom: "16px", color: PINTEREST.textLight }}>No libraries yet</p>
                  <motion.button 
                    whileHover={{ scale: 1.05 }} 
                    onClick={() => setShowCreateStoreModal(true)}
                    style={{ 
                      padding: "10px 20px", 
                      background: PINTEREST.primary, 
                      color: "white", 
                      border: "none", 
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    Create First Library
                  </motion.button>
                </div>
              ) : (
                <>
                  {stores.map(store => (
                    <motion.div
                      key={store.id}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedStore(store)}
                      style={{
                        flexShrink: 0,
                        width: "180px",
                        height: "140px",
                        borderRadius: "12px",
                        background: selectedStore?.id === store.id ? PINTEREST.redLight : "white",
                        border: `2px solid ${selectedStore?.id === store.id ? PINTEREST.primary : PINTEREST.border}`,
                        padding: "16px",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        boxShadow: PINTEREST.cardShadow,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "10px",
                          background: selectedStore?.id === store.id ? PINTEREST.primary : PINTEREST.grayLight,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: selectedStore?.id === store.id ? "white" : PINTEREST.primary,
                          fontSize: "20px",
                        }}>
                          <FaFolder />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            margin: 0,
                            color: PINTEREST.textDark,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {store.name}
                          </h3>
                          <p style={{
                            fontSize: "12px",
                            color: PINTEREST.textLight,
                            margin: "4px 0 0",
                          }}>
                            {store.offerIds?.length || 0} books
                          </p>
                        </div>
                      </div>
                      <div style={{
                        fontSize: "11px",
                        color: PINTEREST.textMuted,
                        paddingTop: "8px",
                        borderTop: `1px solid ${PINTEREST.border}`,
                      }}>
                        Private • {new Date(store.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Add New Library Card */}
                  <motion.div
                    whileHover={{ y: -4, backgroundColor: PINTEREST.hoverBg }}
                    onClick={() => setShowCreateStoreModal(true)}
                    style={{
                      flexShrink: 0,
                      width: "180px",
                      height: "140px",
                      borderRadius: "12px",
                      border: `2px dashed ${PINTEREST.primary}`,
                      padding: "16px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: PINTEREST.primary,
                      background: "transparent",
                    }}
                  >
                    <FaPlus size={24} style={{ marginBottom: "12px" }} />
                    <div style={{ fontSize: "14px", fontWeight: "600", textAlign: "center" }}>
                      Add New Library
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </div>

          {/* Selected Library Content */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {selectedStore ? (
              <>
                {/* Selected Library Header */}
                <div style={{
                  padding: "16px 24px",
                  background: "white",
                  borderBottom: `1px solid ${PINTEREST.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 4px" }}>
                      {selectedStore.name}
                    </h3>
                    <div style={{ display: "flex", gap: "12px", fontSize: "13px", color: PINTEREST.textLight }}>
                      <span><FaBook size={12} /> {storeOffers.length} books</span>
                      <span><FaEyeSlash size={12} /> Private Collection</span>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "12px" }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => {
                        setShowAddBookModal(true);
                      }}
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
                        gap: "6px",
                      }}
                    >
                      <FaPlus /> Add Book
                    </motion.button>
                  </div>
                </div>

                {/* Books Grid */}
                <div style={{ 
                  flex: 1, 
                  overflowY: "auto", 
                  padding: "24px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "20px",
                  alignContent: "start",
                }}>
                  {loadingOffers ? (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        border: `3px solid ${PINTEREST.primary}20`,
                        borderTopColor: PINTEREST.primary,
                        borderRadius: "50%",
                        margin: "0 auto",
                        animation: "spin 1s linear infinite",
                      }} />
                      <p style={{ marginTop: "16px", color: PINTEREST.textLight }}>Loading books...</p>
                    </div>
                  ) : filteredOffers.length === 0 ? (
                    <div style={{ 
                      gridColumn: "1 / -1", 
                      textAlign: "center", 
                      padding: "60px 20px",
                      background: "white",
                      borderRadius: "16px",
                      border: `2px dashed ${PINTEREST.border}`,
                    }}>
                      <FaBook size={60} style={{ color: PINTEREST.textLight, opacity: 0.5, marginBottom: "20px" }} />
                      <h3 style={{ fontSize: "20px", fontWeight: "600", color: PINTEREST.textDark, marginBottom: "8px" }}>
                        Empty Library
                      </h3>
                      <p style={{ color: PINTEREST.textLight, fontSize: "15px", marginBottom: "24px" }}>
                        No books in this library yet
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setShowAddBookModal(true)}
                        style={{
                          padding: "12px 28px",
                          background: PINTEREST.primary,
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "15px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Add First Book
                      </motion.button>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {filteredOffers.map(offer => (
                        <motion.div
                          key={offer.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          whileHover={{ y: -4 }}
                          style={{
                            position: "relative",
                            borderRadius: "12px",
                            overflow: "hidden",
                            background: "white",
                            boxShadow: PINTEREST.cardShadow,
                            border: `1px solid ${PINTEREST.border}`,
                          }}
                        >
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setShowBookMenu(showBookMenu === offer.id ? null : offer.id); 
                            }}
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              width: "28px",
                              height: "28px",
                              borderRadius: "6px",
                              background: "rgba(255, 255, 255, 0.9)",
                              border: `1px solid ${PINTEREST.border}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              zIndex: 10,
                            }}
                          >
                            <FaEllipsisV size={14} />
                          </button>

                          {showBookMenu === offer.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              style={{
                                position: "absolute",
                                top: "40px",
                                right: "8px",
                                background: "white",
                                borderRadius: "8px",
                                boxShadow: PINTEREST.cardShadowHover,
                                border: `1px solid ${PINTEREST.border}`,
                                zIndex: 20,
                                minWidth: "180px",
                                overflow: "hidden",
                              }}
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setBookToPublish(offer);
                                  setPublishForm({
                                    type: "sell",
                                    price: "",
                                    exchangeBook: "",
                                    latitude: offer.latitude || 40.7128,
                                    longitude: offer.longitude || -74.0060,
                                  });
                                  setShowPublishModal(true);
                                  setShowBookMenu(null);
                                }}
                                style={{
                                  width: "100%",
                                  padding: "12px 16px",
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
                                <FaGlobe size={14} /> Publish as Offer
                              </button>
                              <button
                                onClick={() => { 
                                  handleRemove(offer.id); 
                                  setShowBookMenu(null); 
                                }}
                                style={{
                                  width: "100%",
                                  padding: "12px 16px",
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
                                <FaTrash size={14} /> Remove from Library
                              </button>
                            </motion.div>
                          )}

                          <div style={{ height: "140px", overflow: "hidden" }}>
                            <img
                              src={getImageSource(offer)}
                              alt={offer.bookTitle}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <div style={{
                              position: "absolute",
                              top: "8px",
                              left: "8px",
                              background: PINTEREST.primary,
                              color: "white",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "10px",
                              fontWeight: "600",
                            }}>
                              Private
                            </div>
                          </div>

                          <div style={{ padding: "16px" }}>
                            <h4 style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              margin: "0 0 6px",
                              color: PINTEREST.textDark,
                              lineHeight: 1.3,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}>
                              {offer.bookTitle}
                            </h4>
                            {offer.author && (
                              <p style={{
                                fontSize: "12px",
                                color: PINTEREST.textLight,
                                fontStyle: "italic",
                                margin: "0 0 8px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}>
                                {offer.author}
                              </p>
                            )}
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "12px",
                              color: PINTEREST.textLight,
                            }}>
                              <span style={{
                                background: PINTEREST.grayLight,
                                padding: "4px 8px",
                                borderRadius: "6px",
                              }}>
                                {offer.genre || "Fiction"}
                              </span>
                              <span>{offer.condition || "Good"}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </>
            ) : (
              <div style={{ 
                flex: 1, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                padding: "40px",
              }}>
                <div style={{ textAlign: "center", maxWidth: "400px" }}>
                  <FaFolder size={80} style={{ color: PINTEREST.textLight, opacity: 0.5, marginBottom: "24px" }} />
                  <h3 style={{ fontSize: "22px", fontWeight: "600", color: PINTEREST.textDark, marginBottom: "12px" }}>
                    Select a Library
                  </h3>
                  <p style={{ color: PINTEREST.textLight, fontSize: "16px", lineHeight: 1.5 }}>
                    Choose a library from the row above to view and manage your private books
                  </p>
                  <p style={{ color: PINTEREST.textMuted, fontSize: "14px", marginTop: "16px" }}>
                    Or create a new library to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals (same as before) */}
      <AnimatePresence>
        {showCreateStoreModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateStoreModal(false)} style={{ position: "fixed", inset: 0, background: PINTEREST.overlay, zIndex: 1000 }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }} onClick={e => e.stopPropagation()}>
              <div style={{ background: "white", borderRadius: 16, padding: 32, width: "90%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, textAlign: "center" }}>Create New Library</h3>
                <input type="text" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} placeholder="e.g. My Sci-Fi Collection" autoFocus style={{ width: "100%", padding: 14, borderRadius: 8, border: `1px solid ${PINTEREST.border}`, fontSize: 16, marginBottom: 24 }} />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  <button onClick={() => setShowCreateStoreModal(false)} style={{ padding: "12px 24px", background: PINTEREST.grayLight, borderRadius: 8, fontWeight: 600 }}>Cancel</button>
                  <button onClick={handleCreateStore} disabled={creatingStore || !newStoreName.trim()} style={{ padding: "12px 24px", background: PINTEREST.primary, color: "white", borderRadius: 8, fontWeight: 600 }}>
                    {creatingStore ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddBookModal && selectedStore && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddBookModal(false)} style={{ position: "fixed", inset: 0, background: PINTEREST.overlay, zIndex: 1000 }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", zIndex: 1001 }} onClick={e => e.stopPropagation()}>
              <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "95vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.3)", padding: "32px" }}>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Add Book to "{selectedStore.name}"</h3>
                <p style={{ textAlign: "center", color: PINTEREST.textLight, marginBottom: 32 }}>This book will stay <strong>private</strong> until you choose to publish it later.</p>

                {/* Image */}
                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: "block", marginBottom: 10, fontWeight: 600, fontSize: 15 }}>Book Cover (optional)</label>
                  <div onClick={() => document.getElementById("bookImageInput")?.click()} style={{ height: 240, border: `2px dashed ${PINTEREST.border}`, borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: newBookForm.imagePreview ? `url(${newBookForm.imagePreview}) center/cover` : PINTEREST.grayLight, position: "relative" }}>
                    {!newBookForm.imagePreview && (
                      <>
                        <FaImage size={40} style={{ color: PINTEREST.textLight, marginBottom: 12 }} />
                        <p style={{ margin: 0, fontSize: 15, color: PINTEREST.textLight }}>Click to upload cover</p>
                        <p style={{ margin: "6px 0 0", fontSize: 13, color: PINTEREST.textMuted }}>JPG, PNG up to 5MB</p>
                      </>
                    )}
                    {newBookForm.imagePreview && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FaImage size={40} style={{ color: "white" }} />
                      </div>
                    )}
                  </div>
                  <input id="bookImageInput" type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) return alert("Image must be under 5MB");
                    setNewBookForm(prev => ({ ...prev, imageFile: file, imagePreview: URL.createObjectURL(file) }));
                  }} style={{ display: "none" }} />
                  {newBookForm.imagePreview && (
                    <div style={{ textAlign: "center", marginTop: 12 }}>
                      <button onClick={() => setNewBookForm(prev => ({ ...prev, imageFile: null, imagePreview: null }))} style={{ color: PINTEREST.primary, fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>Remove Image</button>
                    </div>
                  )}
                </div>

                {/* Form */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 28 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Title <span style={{ color: PINTEREST.primary }}>*</span></label>
                    <input type="text" value={newBookForm.bookTitle} onChange={e => setNewBookForm(prev => ({ ...prev, bookTitle: e.target.value }))} placeholder="e.g. The Great Gatsby" style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${PINTEREST.border}`, fontSize: 15 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Author <span style={{ color: PINTEREST.primary }}>*</span></label>
                    <input type="text" value={newBookForm.author} onChange={e => setNewBookForm(prev => ({ ...prev, author: e.target.value }))} placeholder="e.g. F. Scott Fitzgerald" style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${PINTEREST.border}`, fontSize: 15 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Genre</label>
                    <select value={newBookForm.genre} onChange={e => setNewBookForm(prev => ({ ...prev, genre: e.target.value }))} style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${PINTEREST.border}`, fontSize: 15, background: "white" }}>
                      <option>Fiction</option><option>Non-Fiction</option><option>Science Fiction</option><option>Fantasy</option><option>Mystery</option><option>Romance</option><option>Biography</option><option>History</option><option>Self-Help</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Condition</label>
                    <select value={newBookForm.condition} onChange={e => setNewBookForm(prev => ({ ...prev, condition: e.target.value }))} style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${PINTEREST.border}`, fontSize: 15, background: "white" }}>
                      <option>New</option><option>Like New</option><option>Good</option><option>Fair</option><option>Poor</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Description (optional)</label>
                  <textarea value={newBookForm.description} onChange={e => setNewBookForm(prev => ({ ...prev, description: e.target.value }))} rows={4} placeholder="Add notes about edition, highlights, or condition details..." style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${PINTEREST.border}`, fontSize: 15, resize: "vertical" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 16 }}>
                  <button onClick={() => setShowAddBookModal(false)} style={{ padding: "14px 28px", background: PINTEREST.grayLight, borderRadius: 8, fontWeight: 600, fontSize: 15 }}>Cancel</button>
                  <button onClick={handleAddBook} disabled={addingBook || !newBookForm.bookTitle.trim() || !newBookForm.author.trim()} style={{ padding: "14px 28px", background: addingBook ? PINTEREST.textLight : PINTEREST.primary, color: "white", borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: addingBook ? "not-allowed" : "pointer" }}>
                    {addingBook ? "Adding Book..." : "Add to Library"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPublishModal && bookToPublish && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPublishModal(false)} style={{ position: "fixed", inset: 0, background: PINTEREST.overlay, zIndex: 1000 }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", zIndex: 1001 }} onClick={e => e.stopPropagation()}>
              <div style={{ background: "white", borderRadius: 16, padding: 32, width: "100%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Publish "{bookToPublish.bookTitle}"</h3>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Offer Type</label>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      onClick={() => setPublishForm(prev => ({ ...prev, type: "sell" }))}
                      style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: 8,
                        background: publishForm.type === "sell" ? PINTEREST.primary : PINTEREST.grayLight,
                        color: publishForm.type === "sell" ? "white" : PINTEREST.textDark,
                        border: `1px solid ${publishForm.type === "sell" ? PINTEREST.primary : PINTEREST.border}`,
                      }}
                    >
                      <FaDollarSign style={{ marginRight: 6 }} /> For Sale
                    </button>
                    <button
                      onClick={() => setPublishForm(prev => ({ ...prev, type: "exchange" }))}
                      style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: 8,
                        background: publishForm.type === "exchange" ? PINTEREST.success : PINTEREST.grayLight,
                        color: publishForm.type === "exchange" ? "white" : PINTEREST.textDark,
                        border: `1px solid ${publishForm.type === "exchange" ? PINTEREST.success : PINTEREST.border}`,
                      }}
                    >
                      <FaExchangeAlt style={{ marginRight: 6 }} /> Exchange
                    </button>
                  </div>
                </div>

                {publishForm.type === "sell" && (
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Price ($)</label>
                    <input
                      type="number"
                      value={publishForm.price}
                      onChange={e => setPublishForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="e.g. 15.99"
                      min="0"
                      step="0.01"
                      style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${PINTEREST.border}` }}
                    />
                  </div>
                )}

                {publishForm.type === "exchange" && (
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Book you want in exchange</label>
                    <input
                      type="text"
                      value={publishForm.exchangeBook}
                      onChange={e => setPublishForm(prev => ({ ...prev, exchangeBook: e.target.value }))}
                      placeholder="e.g. The Hobbit"
                      style={{ width: "100%", padding: 12, borderRadius: 8, border: `1px solid ${PINTEREST.border}` }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Location <FaMapMarkerAlt style={{ marginLeft: 6 }} /></label>
                  <p style={{ fontSize: 13, color: PINTEREST.textLight, margin: "4px 0 12px" }}>
                    Default: New York. You can update later in your profile.
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  <button onClick={() => setShowPublishModal(false)} style={{ padding: "12px 24px", background: PINTEREST.grayLight, borderRadius: 8, fontWeight: 600 }}>Cancel</button>
                  <button onClick={handlePublish} disabled={publishing} style={{ padding: "12px 24px", background: publishing ? PINTEREST.textLight : PINTEREST.primary, color: "white", borderRadius: 8, fontWeight: 600 }}>
                    {publishing ? "Publishing..." : "Publish Offer"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
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
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: ${PINTEREST.primary} !important;
          box-shadow: 0 0 0 3px rgba(230, 0, 35, 0.1);
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
}