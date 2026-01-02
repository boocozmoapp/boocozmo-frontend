/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/MyLibraryScreen.tsx - REDESIGNED WITH BACKEND INTEGRATION
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBook,
  FaPlus,
  FaFolder,
  FaFolderOpen,
  FaTrash,
  FaSearch,
  FaDollarSign,
  FaExchangeAlt,
  FaTag,
  FaArrowLeft,
  FaCheck,
  FaFilter,
  FaEllipsisV,
  FaGlobe,
  FaEyeSlash,
  FaChevronRight,
  FaChevronLeft,
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

export default function MyLibraryScreen({ currentUser, onBack }: Props) {
  const navigate = useNavigate();
  
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [storeOffers, setStoreOffers] = useState<Offer[]>([]);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [, setError] = useState<string | null>(null);
  
  // Create store modal
   
  const [, setShowCreateModal] = useState(false);
  // eslint-disable-next-line no-empty-pattern
  const [] = useState("");
   
  // eslint-disable-next-line no-empty-pattern
  const [] = useState(false);
  
  // Add offer modal
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [selectedOffersToAdd, setSelectedOffersToAdd] = useState<number[]>([]);
  const [addingOffers, setAddingOffers] = useState(false);
  
  // Edit store modal
  // eslint-disable-next-line no-empty-pattern
  const [] = useState(false);
  // eslint-disable-next-line no-empty-pattern
  const [] = useState(false);
  // eslint-disable-next-line no-empty-pattern
  const [] = useState("");
  
  // Book actions menu
  const [showBookMenu, setShowBookMenu] = useState<number | null>(null);
  
  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "sell" | "exchange" | "buy">("all");
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // ========== BACKEND INTEGRATION FUNCTIONS ==========

  // Fetch user's stores
  const fetchStores = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithTimeout(`${API_BASE}/stores?includeOffers=true`, {
        signal: abortControllerRef.current.signal,
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Cache-Control": "no-cache",
        },
      }, 15000);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load libraries");
      }

      const data = await response.json();
      const userStores = Array.isArray(data) 
        ? data.filter((store: any) => store.ownerEmail === currentUser.email)
        : [];

      setStores(userStores);
      
      if (userStores.length > 0 && !selectedStore) {
        setSelectedStore(userStores[0]);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error fetching stores:", err);
        setError(err.message || "Failed to load libraries");
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser.email, currentUser.token, selectedStore]);

  // Fetch user's ALL offers
  const fetchUserOffers = useCallback(async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/offers`, {
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
        },
      }, 10000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load your books");
      }

      const data = await response.json();
      
      let rawOffers = [];
      if (Array.isArray(data)) {
        rawOffers = data;
      } else if (data.offers && Array.isArray(data.offers)) {
        rawOffers = data.offers;
      } else if (data.data && Array.isArray(data.data)) {
        rawOffers = data.data;
      }
      
      const userOffers = rawOffers.filter((offer: any) => 
        offer.ownerEmail === currentUser.email
      );
      
      const processedOffers: Offer[] = userOffers.map((offer: any) => ({
        id: offer.id,
        type: offer.type || "sell",
        bookTitle: offer.bookTitle || offer.title || "Unknown Book",
        exchangeBook: offer.exchangeBook || null,
        price: offer.price ? parseFloat(offer.price) : null,
        condition: offer.condition || null,
        ownerEmail: offer.ownerEmail,
        imageUrl: offer.imageUrl || null,
        imageBase64: offer.imageBase64 || null,
        latitude: offer.latitude ? parseFloat(offer.latitude) : null,
        longitude: offer.longitude ? parseFloat(offer.longitude) : null,
        description: offer.description || "",
        genre: offer.genre || "Fiction",
        author: offer.author || "Unknown Author",
        lastUpdated: offer.lastUpdated || offer.created_at,
        state: offer.state || "open",
      }));

      setAllOffers(processedOffers);
    } catch (err: any) {
      console.error("Error fetching user offers:", err);
    }
  }, [currentUser.email, currentUser.token]);

  // Fetch offers for selected store (using POST /store-offers)
  const fetchStoreOffers = useCallback(async (store: Store) => {
    if (!store) return;

    setLoadingOffers(true);

    try {
      const response = await fetchWithTimeout(`${API_BASE}/store-offers`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store: { offerIds: store.offerIds || [] }
        }),
      }, 10000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load library books");
      }

      const data = await response.json();
      
      const processedOffers: Offer[] = Array.isArray(data) ? data.map((offer: any) => ({
        id: offer.id,
        type: offer.type || "sell",
        bookTitle: offer.bookTitle || "Unknown Book",
        exchangeBook: offer.exchangeBook || null,
        price: offer.price ? parseFloat(offer.price) : null,
        condition: offer.condition || null,
        ownerEmail: offer.ownerEmail,
        imageUrl: offer.imageUrl || null,
        imageBase64: offer.imageBase64 || null,
        latitude: offer.latitude ? parseFloat(offer.latitude) : null,
        longitude: offer.longitude ? parseFloat(offer.longitude) : null,
        description: offer.description || "",
        genre: offer.genre || "Fiction",
        author: offer.author || "Unknown Author",
        lastUpdated: offer.lastUpdated || offer.created_at,
        state: offer.state || "open",
      })) : [];

      setStoreOffers(processedOffers);
    } catch (err: any) {
      console.error("Error fetching store offers:", err);
      setStoreOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  }, [currentUser.token]);

  // Create new store

  // ✅ NEW: Add offers to existing store using POST /add-to-store/:storeId
  const handleAddOffersToStore = async () => {
    if (!selectedStore || selectedOffersToAdd.length === 0) {
      alert("Please select books to add");
      return;
    }

    setAddingOffers(true);
    
    try {
      // Get selected offers
      const offersToAdd = allOffers.filter(offer => 
        selectedOffersToAdd.includes(offer.id)
      );

      // Prepare offers for backend
      const offersForBackend = offersToAdd.map(offer => ({
        type: offer.type,
        bookTitle: offer.bookTitle,
        exchangeBook: offer.type === "exchange" ? offer.exchangeBook : null,
        price: offer.type === "sell" ? offer.price : null,
        latitude: offer.latitude || 40.7128,
        longitude: offer.longitude || -74.0060,
        image: offer.imageUrl || offer.imageBase64 || null,
        condition: offer.condition || "Good",
      }));

      // Use the new backend route
      const response = await fetchWithTimeout(`${API_BASE}/add-to-store/${selectedStore.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offers: offersForBackend,
        }),
      }, 15000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to add books to library");
      }

      // Refresh store offers
      if (selectedStore) {
        await fetchStoreOffers(selectedStore);
      }
      
      // Refresh user offers (in case any were consumed)
      await fetchUserOffers();
      
      setSelectedOffersToAdd([]);
      setShowAddOfferModal(false);
      
      alert(`✅ Added ${selectedOffersToAdd.length} book(s) to your library!`);
    } catch (err: any) {
      console.error("Error adding offers to store:", err);
      alert(err.message || "Failed to add books to library");
    } finally {
      setAddingOffers(false);
    }
  };

  // ✅ NEW: Remove offer from store using DELETE /remove-from-store/:storeId/:offerId
  const handleRemoveFromStore = async (offerId: number) => {
    if (!selectedStore) return;

    if (!confirm("Remove this book from library?")) {
      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${API_BASE}/remove-from-store/${selectedStore.id}/${offerId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${currentUser.token}`,
          },
        },
        10000
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to remove book");
      }

      // Refresh store offers
      await fetchStoreOffers(selectedStore);
      
      alert("✅ Book removed from library!");
    } catch (err: any) {
      console.error("Error removing from store:", err);
      alert(err.message || "Failed to remove book");
    }
  };

  // Edit store name (keeps existing implementation)

  // Delete store

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


  useEffect(() => {
    fetchStores();
    fetchUserOffers();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchStores, fetchUserOffers]);

  useEffect(() => {
    if (selectedStore) {
      fetchStoreOffers(selectedStore);
    } else {
      setStoreOffers([]);
    }
  }, [selectedStore, fetchStoreOffers]);

  // Filter store offers
  const filteredStoreOffers = useMemo(() => {
    let result = storeOffers;

    if (filterType !== "all") {
      result = result.filter((o) => o.type === filterType);
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
  }, [storeOffers, filterType, searchQuery]);

  // Filter available offers (for adding)
  const filteredAvailableOffers = useMemo(() => {
    const storeOfferIds = new Set(storeOffers.map(o => o.id));
    
    let result = allOffers.filter(offer => !storeOfferIds.has(offer.id));

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
  }, [allOffers, storeOffers, searchQuery]);

  const filterButtons = [
    { id: "all" as const, label: "All", icon: <FaFilter size={12} /> },
    { id: "sell" as const, label: "For Sale", icon: <FaDollarSign size={12} /> },
    { id: "exchange" as const, label: "Exchange", icon: <FaExchangeAlt size={12} /> },
    { id: "buy" as const, label: "Wanted", icon: <FaTag size={12} /> },
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
      {/* Compact Vertical Sidebar */}
      <motion.div
        animate={{ width: sidebarCollapsed ? "60px" : "280px" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{
          background: PINTEREST.sidebarBg,
          borderRight: `1px solid ${PINTEREST.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
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

        {/* Header - Compact */}
        <div style={{
          padding: "20px 16px",
          borderBottom: `1px solid ${PINTEREST.border}`,
          minHeight: "80px",
        }}>
          <AnimatePresence mode="wait">
            {!sidebarCollapsed ? (
              <motion.div
                key="expanded-header"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <button
                  onClick={onBack ? onBack : () => navigate(-1)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "white",
                    border: `1px solid ${PINTEREST.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: PINTEREST.textDark,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <FaArrowLeft />
                </button>
                <div>
                  <h1 style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: PINTEREST.textDark,
                    margin: 0,
                    lineHeight: 1.2,
                  }}>
                    Libraries
                  </h1>
                  <p style={{
                    fontSize: "11px",
                    color: PINTEREST.textLight,
                    margin: "4px 0 0",
                  }}>
                    {stores.length} collections
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed-header"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", justifyContent: "center" }}
              >
                <button
                  onClick={onBack ? onBack : () => navigate(-1)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "white",
                    border: `1px solid ${PINTEREST.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: PINTEREST.textDark,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <FaArrowLeft />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Create Library Button */}
        <div style={{ padding: "16px" }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            style={{
              width: "100%",
              padding: sidebarCollapsed ? "12px" : "12px 16px",
              background: PINTEREST.primary,
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: sidebarCollapsed ? "14px" : "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarCollapsed ? "center" : "center",
              gap: sidebarCollapsed ? "0" : "8px",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            <FaPlus size={14} />
            {!sidebarCollapsed && "New Library"}
          </motion.button>
        </div>

        {/* Libraries List */}
        <div style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: "0 12px 12px",
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div style={{
                width: "24px",
                height: "24px",
                border: `2px solid ${PINTEREST.primary}20`,
                borderTopColor: PINTEREST.primary,
                borderRadius: "50%",
                margin: "0 auto",
                animation: "spin 1s linear infinite",
              }} />
            </div>
          ) : stores.length === 0 ? (
            !sidebarCollapsed && (
              <div style={{
                textAlign: "center",
                padding: "20px",
                color: PINTEREST.textLight,
                fontSize: "12px",
              }}>
                <FaFolder size={20} style={{ marginBottom: "8px", opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No libraries</p>
              </div>
            )
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {stores.map((store) => (
                <motion.div
                  key={store.id}
                  whileHover={{ backgroundColor: PINTEREST.hoverBg }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedStore(store)}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    background: selectedStore?.id === store.id ? PINTEREST.redLight : "transparent",
                    cursor: "pointer",
                    border: selectedStore?.id === store.id 
                      ? `1px solid ${PINTEREST.primary}`
                      : `1px solid ${PINTEREST.border}`,
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ flexShrink: 0 }}>
                    {selectedStore?.id === store.id ? (
                      <FaFolderOpen size={16} color={PINTEREST.primary} />
                    ) : (
                      <FaFolder size={16} color={PINTEREST.textLight} />
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        style={{ 
                          flex: 1, 
                          minWidth: 0,
                          overflow: "hidden",
                        }}
                      >
                        <div style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: PINTEREST.textDark,
                          marginBottom: "2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                          {store.name}
                        </div>
                        <div style={{
                          fontSize: "11px",
                          color: PINTEREST.textLight,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}>
                          <span>{store.offerIds?.length || 0}</span>
                          <span>•</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                            <FaEyeSlash size={8} />
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* User Info - Compact */}
        <div style={{
          padding: "12px",
          borderTop: `1px solid ${PINTEREST.border}`,
          background: "white",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: `linear-gradient(135deg, ${PINTEREST.primary}, ${PINTEREST.dark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "600",
              fontSize: "14px",
              flexShrink: 0,
            }}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ fontSize: "13px", fontWeight: "600", color: PINTEREST.textDark }}>
                    {currentUser.name.split(" ")[0]}
                  </div>
                  <div style={{ fontSize: "11px", color: PINTEREST.textLight }}>
                    {allOffers.length} books
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div style={{ 
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Library Header */}
        {selectedStore ? (
          <>
            <div style={{
              padding: "20px 24px",
              background: "white",
              borderBottom: `1px solid ${PINTEREST.border}`,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <h2 style={{
                    fontSize: "22px",
                    fontWeight: "700",
                    color: PINTEREST.textDark,
                    margin: "0 0 4px",
                  }}>
                    {selectedStore.name}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: PINTEREST.textLight }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <FaBook size={12} />
                      {storeOffers.length} books
                    </span>
                    <span>•</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <FaEyeSlash size={12} />
                      Private Library
                    </span>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: "10px" }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddOfferModal(true)}
                    style={{
                      padding: "10px 20px",
                      background: PINTEREST.primary,
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <FaPlus size={12} />
                    Add Books
                  </motion.button>
                </div>
              </div>

              {/* Search and Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <FaSearch style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: PINTEREST.icon,
                    fontSize: "12px",
                  }} />
                  <input
                    type="text"
                    placeholder="Search books in this library..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 10px 10px 36px",
                      borderRadius: "8px",
                      border: `1px solid ${PINTEREST.border}`,
                      background: PINTEREST.grayLight,
                      fontSize: "13px",
                      color: PINTEREST.textDark,
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
                
                <div style={{ display: "flex", gap: "6px" }}>
                  {filterButtons.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setFilterType(filter.id)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: filterType === filter.id ? PINTEREST.primary : PINTEREST.hoverBg,
                        color: filterType === filter.id ? "white" : PINTEREST.textDark,
                        fontSize: "12px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        border: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {filter.icon}
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Books Grid */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "20px",
              alignContent: "start",
            }}>
              {loadingOffers ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      background: PINTEREST.grayLight,
                      borderRadius: "12px",
                      height: "280px",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                ))
              ) : filteredStoreOffers.length === 0 ? (
                <div style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "white",
                  borderRadius: "12px",
                  border: `2px dashed ${PINTEREST.border}`,
                }}>
                  <FaBook size={40} style={{ color: PINTEREST.textLight, opacity: 0.5, marginBottom: "16px" }} />
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: PINTEREST.textDark, marginBottom: "8px" }}>
                    This library is empty
                  </h3>
                  <p style={{ color: PINTEREST.textLight, fontSize: "14px", marginBottom: "20px" }}>
                    Add books from your collection to get started
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddOfferModal(true)}
                    style={{
                      padding: "12px 24px",
                      background: PINTEREST.primary,
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FaPlus size={14} />
                    Add Books
                  </motion.button>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredStoreOffers.map((offer, index) => (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      whileHover={{ y: -4 }}
                      style={{
                        position: "relative",
                        borderRadius: "12px",
                        overflow: "hidden",
                        background: "white",
                        boxShadow: PINTEREST.cardShadow,
                        cursor: "pointer",
                        height: "300px",
                        display: "flex",
                        flexDirection: "column",
                        border: `1px solid ${PINTEREST.border}`,
                      }}
                    >
                      {/* Three-dot menu button */}
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
                          color: PINTEREST.textDark,
                          cursor: "pointer",
                          fontSize: "12px",
                          zIndex: 10,
                        }}
                      >
                        <FaEllipsisV />
                      </button>

                      {/* Book Actions Menu */}
                      {showBookMenu === offer.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          style={{
                            position: "absolute",
                            top: "40px",
                            right: "8px",
                            background: "white",
                            borderRadius: "8px",
                            boxShadow: PINTEREST.cardShadowHover,
                            border: `1px solid ${PINTEREST.border}`,
                            zIndex: 20,
                            minWidth: "160px",
                            overflow: "hidden",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              alert("Publish feature coming soon!");
                              setShowBookMenu(null);
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              background: "transparent",
                              border: "none",
                              borderBottom: `1px solid ${PINTEREST.border}`,
                              color: PINTEREST.textDark,
                              fontSize: "13px",
                              fontWeight: "500",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              textAlign: "left",
                            }}
                          >
                            <FaGlobe size={12} />
                            Publish
                          </button>
                          <button
                            onClick={() => {
                              handleRemoveFromStore(offer.id);
                              setShowBookMenu(null);
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              background: "transparent",
                              border: "none",
                              color: PINTEREST.primary,
                              fontSize: "13px",
                              fontWeight: "500",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              textAlign: "left",
                            }}
                          >
                            <FaTrash size={12} />
                            Remove
                          </button>
                        </motion.div>
                      )}

                      {/* Image */}
                      <div style={{
                        height: "55%",
                        position: "relative",
                        overflow: "hidden",
                        background: PINTEREST.grayLight,
                      }}>
                        <img
                          src={getImageSource(offer)}
                          alt={offer.bookTitle}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        
                        {/* Type Badge */}
                        <div style={{
                          position: "absolute",
                          top: "8px",
                          left: "8px",
                          background: getTypeColor(offer.type),
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "10px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}>
                          {getTypeIcon(offer.type)}
                          {getTypeLabel(offer.type)}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div style={{
                        padding: "16px",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}>
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
                          flex: 1,
                        }}>
                          {offer.bookTitle}
                        </h3>
                        
                        {offer.author && (
                          <p style={{
                            fontSize: "12px",
                            color: PINTEREST.textLight,
                            margin: "0 0 8px",
                            fontStyle: "italic",
                          }}>
                            {offer.author}
                          </p>
                        )}
                        
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "auto",
                          fontSize: "12px",
                          color: PINTEREST.textLight,
                        }}>
                          <div style={{ 
                            background: PINTEREST.grayLight,
                            padding: "4px 8px",
                            borderRadius: "6px",
                          }}>
                            {offer.genre || "Fiction"}
                          </div>
                          <div>
                            {offer.condition || "Good"}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </>
        ) : (
          /* No Library Selected */
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
          }}>
            <div style={{
              maxWidth: "400px",
              textAlign: "center",
            }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                background: PINTEREST.redLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: "32px",
                color: PINTEREST.primary,
              }}>
                <FaBook />
              </div>
              <h2 style={{
                fontSize: "24px",
                fontWeight: "700",
                color: PINTEREST.textDark,
                marginBottom: "12px",
              }}>
                Select a Library
              </h2>
              <p style={{
                fontSize: "15px",
                color: PINTEREST.textLight,
                marginBottom: "24px",
                lineHeight: 1.6,
              }}>
                Choose a library from the sidebar to view its contents,
                or create a new one to start organizing your books.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: "14px 28px",
                  background: PINTEREST.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaPlus size={16} />
                Create Library
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Add Books Modal */}
        {showAddOfferModal && selectedStore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedOffersToAdd([]);
                setShowAddOfferModal(false);
              }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,0.5)",
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
                  maxWidth: "800px",
                  maxHeight: "80vh",
                  background: "white",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                  display: "flex",
                  flexDirection: "column",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: PINTEREST.textDark,
                  margin: "0 0 16px",
                }}>
                  Add Books to "{selectedStore.name}"
                </h3>
                
                {/* Available Books Grid */}
                <div style={{
                  flex: 1,
                  overflowY: "auto",
                  marginBottom: "20px",
                }}>
                  {filteredAvailableOffers.length === 0 ? (
                    <div style={{
                      textAlign: "center",
                      padding: "40px 20px",
                      color: PINTEREST.textLight,
                    }}>
                      <FaBook size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: "14px" }}>
                        No books available to add
                      </p>
                    </div>
                  ) : (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                      gap: "16px",
                    }}>
                      {filteredAvailableOffers.map((offer) => {
                        const isSelected = selectedOffersToAdd.includes(offer.id);
                        
                        return (
                          <div
                            key={offer.id}
                            onClick={() => {
                              setSelectedOffersToAdd(prev =>
                                isSelected
                                  ? prev.filter(id => id !== offer.id)
                                  : [...prev, offer.id]
                              );
                            }}
                            style={{
                              position: "relative",
                              borderRadius: "12px",
                              overflow: "hidden",
                              background: "white",
                              border: `2px solid ${isSelected ? PINTEREST.primary : PINTEREST.border}`,
                              cursor: "pointer",
                              height: "200px",
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            {/* Selection Checkbox */}
                            <div style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background: isSelected ? PINTEREST.primary : "white",
                              border: `2px solid ${isSelected ? PINTEREST.primary : PINTEREST.border}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 2,
                            }}>
                              {isSelected && <FaCheck size={10} color="white" />}
                            </div>
                            
                            {/* Book Image */}
                            <div style={{
                              height: "60%",
                              overflow: "hidden",
                              background: PINTEREST.grayLight,
                            }}>
                              <img
                                src={getImageSource(offer)}
                                alt={offer.bookTitle}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                            
                            {/* Book Info */}
                            <div style={{
                              padding: "12px",
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                            }}>
                              <h4 style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                margin: 0,
                                color: PINTEREST.textDark,
                                lineHeight: 1.3,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                flex: 1,
                              }}>
                                {offer.bookTitle}
                              </h4>
                              
                              <div style={{
                                fontSize: "11px",
                                color: PINTEREST.textLight,
                                marginTop: "4px",
                              }}>
                                {offer.author || "Unknown Author"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Footer Actions */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "20px",
                  borderTop: `1px solid ${PINTEREST.border}`,
                }}>
                  <div style={{ fontSize: "14px", color: PINTEREST.textLight }}>
                    {selectedOffersToAdd.length} book(s) selected
                  </div>
                  
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      onClick={() => {
                        setSelectedOffersToAdd([]);
                        setShowAddOfferModal(false);
                      }}
                      style={{
                        padding: "10px 20px",
                        background: PINTEREST.grayLight,
                        color: PINTEREST.textDark,
                        border: `1px solid ${PINTEREST.border}`,
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddOffersToStore}
                      disabled={addingOffers || selectedOffersToAdd.length === 0}
                      style={{
                        padding: "10px 20px",
                        background: addingOffers || selectedOffersToAdd.length === 0 
                          ? PINTEREST.textLight 
                          : PINTEREST.primary,
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: addingOffers || selectedOffersToAdd.length === 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      {addingOffers ? "Adding..." : `Add ${selectedOffersToAdd.length} Book(s)`}
                    </button>
                  </div>
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
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${PINTEREST.grayLight};
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${PINTEREST.border};
          border-radius: 3px;
        }
        
        input:focus {
          outline: none;
          border-color: ${PINTEREST.primary} !important;
        }
      `}</style>
    </div>
  );
}