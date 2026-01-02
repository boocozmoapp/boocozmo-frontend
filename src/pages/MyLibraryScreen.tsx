/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/MyLibraryScreen.tsx
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBook,
  FaPlus,
  FaTimes,
  FaFolder,
  FaFolderOpen,
  FaEdit,
  FaTrash,
  FaSearch,
  FaDollarSign,
  FaExchangeAlt,
  FaTag,
  FaArrowLeft,
  FaCheck,
  FaFilter,
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
  overlay: "rgba(0, 0, 0, 0.7)",
  success: "#00A86B",
  warning: "#FF9500",
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
  inStore?: boolean;
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

// Retry wrapper with timeout
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [creatingStore, setCreatingStore] = useState(false);
  
  // Add offer modal
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [selectedOffersToAdd, setSelectedOffersToAdd] = useState<number[]>([]);
  const [addingOffers, setAddingOffers] = useState(false);
  
  // Edit store modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState(false);
  const [editStoreName, setEditStoreName] = useState("");
  
  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "sell" | "exchange" | "buy">("all");
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch user's stores (libraries)
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
      
      // If user has stores but none selected, select the first one
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

  // Fetch user's personal offers (for adding to library)
  const fetchUserOffers = useCallback(async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/my-offers`, {
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
        },
      }, 10000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load your books");
      }

      const data = await response.json();
      
       
      const processedOffers: Offer[] = (data.offers || data).map((offer: any) => ({
        id: offer.id,
        type: offer.type,
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
      }));

      setAllOffers(processedOffers);
    } catch (err: any) {
      console.error("Error fetching user offers:", err);
      // Don't show error - just log it
    }
  }, [currentUser.token]);

  // Fetch offers for selected store
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
        type: offer.type,
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
        inStore: true,
      })) : [];

      setStoreOffers(processedOffers);
    } catch (err: any) {
      console.error("Error fetching store offers:", err);
      setStoreOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  }, [currentUser.token]);

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

  // Create new store (library)
  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      alert("Please enter a library name");
      return;
    }

    setCreatingStore(true);
    
    try {
      const response = await fetchWithTimeout(`${API_BASE}/create-store`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newStoreName.trim(),
          offers: [], // Empty library to start
        }),
      }, 10000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create library");
      }

      await response.json();
      
      // Refresh stores list
      await fetchStores();
      
      // Reset and close modal
      setNewStoreName("");
      setShowCreateModal(false);
      
      alert("Library created successfully!");
    } catch (err: any) {
      console.error("Error creating store:", err);
      alert(err.message || "Failed to create library");
    } finally {
      setCreatingStore(false);
    }
  };

  // Add offers to store
  const handleAddOffersToStore = async () => {
    if (!selectedStore || selectedOffersToAdd.length === 0) {
      alert("Please select books to add");
      return;
    }

    setAddingOffers(true);
    
    try {
      // For each selected offer, we need to create the store-offer relationship
      // Since backend doesn't have direct endpoint, we'll update store with all offers
      const allOfferIds = [
        ...(selectedStore.offerIds || []),
        ...selectedOffersToAdd
      ].filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

      // Note: This is a workaround since backend doesn't have update-store endpoint
      // In production, you'd need a proper endpoint like POST /store/:id/add-offers
      
      // For now, we'll create a new store with the combined offers
      const response = await fetchWithTimeout(`${API_BASE}/create-store`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selectedStore.name,
          offers: allOffers.filter(offer => allOfferIds.includes(offer.id))
            .map(offer => ({
              type: offer.type,
              bookTitle: offer.bookTitle,
              exchangeBook: offer.exchangeBook,
              price: offer.price,
              latitude: offer.latitude,
              longitude: offer.longitude,
              image: offer.imageUrl || offer.imageBase64,
              condition: offer.condition,
            })),
        }),
      }, 15000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to add books to library");
      }

      // Delete old store
      await fetchWithTimeout(`${API_BASE}/delete-store/${selectedStore.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
        },
      }, 10000);

      // Refresh stores
      await fetchStores();
      
      // Reset
      setSelectedOffersToAdd([]);
      setShowAddOfferModal(false);
      
      alert(`Added ${selectedOffersToAdd.length} book(s) to library!`);
    } catch (err: any) {
      console.error("Error adding offers to store:", err);
      alert(err.message || "Failed to add books to library");
    } finally {
      setAddingOffers(false);
    }
  };

  // Delete store
  const handleDeleteStore = async (storeId: number) => {
    if (!confirm("Are you sure you want to delete this library? All books will be removed.")) {
      return;
    }

    try {
      const response = await fetchWithTimeout(`${API_BASE}/delete-store/${storeId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
        },
      }, 10000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete library");
      }

      // Update local state
      setStores(prev => prev.filter(store => store.id !== storeId));
      
      // If deleted store was selected, select another or clear
      if (selectedStore?.id === storeId) {
        const remainingStores = stores.filter(store => store.id !== storeId);
        setSelectedStore(remainingStores.length > 0 ? remainingStores[0] : null);
      }
      
      alert("Library deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting store:", err);
      alert(err.message || "Failed to delete library");
    }
  };

  // Remove offer from store
  const handleRemoveFromStore = async (offerId: number) => {
    if (!selectedStore) return;

    if (!confirm("Remove this book from library?")) {
      return;
    }

    try {
      // Remove from store offers list
      const updatedOfferIds = (selectedStore.offerIds || []).filter(id => id !== offerId);
      
      // Create new store without this offer
      const response = await fetchWithTimeout(`${API_BASE}/create-store`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selectedStore.name,
          offers: allOffers
            .filter(offer => updatedOfferIds.includes(offer.id))
            .map(offer => ({
              type: offer.type,
              bookTitle: offer.bookTitle,
              exchangeBook: offer.exchangeBook,
              price: offer.price,
              latitude: offer.latitude,
              longitude: offer.longitude,
              image: offer.imageUrl || offer.imageBase64,
              condition: offer.condition,
            })),
        }),
      }, 15000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to remove book");
      }

      // Delete old store
      await fetchWithTimeout(`${API_BASE}/delete-store/${selectedStore.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
        },
      }, 10000);

      // Refresh
      await fetchStores();
      
      alert("Book removed from library!");
    } catch (err: any) {
      console.error("Error removing from store:", err);
      alert(err.message || "Failed to remove book");
    }
  };

  // Edit store name
  const handleEditStore = async () => {
    if (!selectedStore || !editStoreName.trim()) return;

    setEditingStore(true);
    
    try {
      // Create new store with same offers but new name
      const response = await fetchWithTimeout(`${API_BASE}/create-store`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editStoreName.trim(),
          offers: storeOffers.map(offer => ({
            type: offer.type,
            bookTitle: offer.bookTitle,
            exchangeBook: offer.exchangeBook,
            price: offer.price,
            latitude: offer.latitude,
            longitude: offer.longitude,
            image: offer.imageUrl || offer.imageBase64,
            condition: offer.condition,
          })),
        }),
      }, 15000);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update library");
      }

      // Delete old store
      await fetchWithTimeout(`${API_BASE}/delete-store/${selectedStore.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
        },
      }, 10000);

      // Refresh
      await fetchStores();
      
      setShowEditModal(false);
      alert("Library updated successfully!");
     
    } catch (err: any) {
      console.error("Error editing store:", err);
      alert(err.message || "Failed to update library");
    } finally {
      setEditingStore(false);
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
      {/* Sidebar - Library Management */}
      <div style={{
        width: "280px",
        background: PINTEREST.sidebarBg,
        borderRight: `1px solid ${PINTEREST.border}`,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 20px",
          borderBottom: `1px solid ${PINTEREST.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <button
              onClick={onBack ? onBack : () => navigate(-1)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: PINTEREST.hoverBg,
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
            <h1 style={{
              fontSize: "20px",
              fontWeight: "700",
              color: PINTEREST.textDark,
              margin: 0,
            }}>
              My Libraries
            </h1>
          </div>
          
          <p style={{
            fontSize: "13px",
            color: PINTEREST.textLight,
            margin: "0 0 16px",
            lineHeight: 1.5,
          }}>
            Create personal collections of your books. 
            Books in libraries are private until you choose to share them.
          </p>
        </div>

        {/* Create Library Button */}
        <div style={{ padding: "20px" }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            style={{
              width: "100%",
              padding: "14px",
              background: PINTEREST.primary,
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 16px rgba(230, 0, 35, 0.2)",
            }}
          >
            <FaPlus size={14} />
            Create New Library
          </motion.button>
        </div>

        {/* Libraries List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
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
          ) : stores.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "40px 20px",
              color: PINTEREST.textLight,
            }}>
              <FaFolder size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: "14px" }}>
                No libraries yet
              </p>
              <p style={{ margin: "8px 0 0", fontSize: "12px" }}>
                Create your first library to organize your books
              </p>
            </div>
          ) : (
            stores.map((store) => (
              <motion.div
                key={store.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedStore(store)}
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  background: selectedStore?.id === store.id ? PINTEREST.redLight : PINTEREST.hoverBg,
                  marginBottom: "8px",
                  cursor: "pointer",
                  border: selectedStore?.id === store.id 
                    ? `2px solid ${PINTEREST.primary}`
                    : `1px solid ${PINTEREST.border}`,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {selectedStore?.id === store.id ? (
                      <FaFolderOpen size={16} color={PINTEREST.primary} />
                    ) : (
                      <FaFolder size={16} color={PINTEREST.textLight} />
                    )}
                    <div>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: PINTEREST.textDark,
                      }}>
                        {store.name}
                      </div>
                      <div style={{
                        fontSize: "11px",
                        color: PINTEREST.textLight,
                        marginTop: "2px",
                      }}>
                        {store.offerIds?.length || 0} books
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditStoreName(store.name);
                        setSelectedStore(store);
                        setShowEditModal(true);
                      }}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background: "transparent",
                        border: `1px solid ${PINTEREST.border}`,
                        color: PINTEREST.textLight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStore(store.id);
                      }}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background: "transparent",
                        border: `1px solid ${PINTEREST.border}`,
                        color: PINTEREST.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* User Info */}
        <div style={{
          padding: "16px 20px",
          borderTop: `1px solid ${PINTEREST.border}`,
          background: PINTEREST.hoverBg,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${PINTEREST.primary}, ${PINTEREST.dark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "600",
              fontSize: "14px",
            }}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: PINTEREST.textDark }}>
                {currentUser.name.split(" ")[0]}
              </div>
              <div style={{ fontSize: "11px", color: PINTEREST.textLight }}>
                {stores.length} libraries
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Library View */}
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
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <h2 style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: PINTEREST.textDark,
                    margin: "0 0 4px",
                  }}>
                    {selectedStore.name}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: PINTEREST.textLight }}>
                    <span>{storeOffers.length} books</span>
                    <span>•</span>
                    <span>Private Library</span>
                    <span>•</span>
                    <span>Created {new Date(selectedStore.created_at).toLocaleDateString()}</span>
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
                      borderRadius: "10px",
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
                    zIndex: 1,
                  }} />
                  <input
                    type="text"
                    placeholder="Search books in this library..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 10px 10px 36px",
                      borderRadius: "20px",
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
                        padding: "6px 12px",
                        borderRadius: "16px",
                        background: filterType === filter.id ? PINTEREST.primary : PINTEREST.hoverBg,
                        color: filterType === filter.id ? "white" : PINTEREST.textDark,
                        fontSize: "11px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
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
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
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
                  background: PINTEREST.grayLight,
                  borderRadius: "16px",
                  border: `2px dashed ${PINTEREST.border}`,
                }}>
                  <FaBook size={48} style={{ color: PINTEREST.textLight, opacity: 0.5, marginBottom: "16px" }} />
                  <h3 style={{ fontSize: "18px", fontWeight: "600", color: PINTEREST.textDark, marginBottom: "8px" }}>
                    No books in this library
                  </h3>
                  <p style={{ color: PINTEREST.textLight, fontSize: "14px", marginBottom: "20px" }}>
                    Add your first book to get started
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
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FaPlus size={14} />
                    Add First Book
                  </motion.button>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredStoreOffers.map((offer, index) => (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      whileHover={{ y: -4 }}
                      style={{
                        position: "relative",
                        borderRadius: "14px",
                        overflow: "hidden",
                        background: "white",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        cursor: "pointer",
                        height: "300px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Image */}
                      <div style={{
                        height: "60%",
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
                          top: "10px",
                          left: "10px",
                          background: getTypeColor(offer.type),
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "8px",
                          fontSize: "10px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}>
                          {getTypeIcon(offer.type)}
                          {getTypeLabel(offer.type)}
                        </div>
                        
                        {/* Remove Button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromStore(offer.id);
                          }}
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.9)",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: PINTEREST.primary,
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          <FaTimes />
                        </motion.button>
                        
                        {/* Price */}
                        {offer.price && (
                          <div style={{
                            position: "absolute",
                            bottom: "10px",
                            right: "10px",
                            background: "rgba(255, 255, 255, 0.9)",
                            padding: "4px 8px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: PINTEREST.primary,
                          }}>
                            {formatPrice(offer.price)}
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div style={{
                        padding: "14px",
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
                          fontSize: "11px",
                          color: PINTEREST.textLight,
                        }}>
                          <div>
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
            textAlign: "center",
          }}>
            <div style={{
              maxWidth: "400px",
            }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
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
                Welcome to Your Libraries
              </h2>
              <p style={{
                fontSize: "15px",
                color: PINTEREST.textLight,
                marginBottom: "24px",
                lineHeight: 1.6,
              }}>
                Create personal collections to organize your books. 
                Each library is private until you choose to share it.
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
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 20px rgba(230, 0, 35, 0.3)",
                }}
              >
                <FaPlus size={16} />
                Create Your First Library
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Create Library Modal */}
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: PINTEREST.overlay,
                backdropFilter: "blur(4px)",
                zIndex: 3000,
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
              zIndex: 3001,
              pointerEvents: "none",
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                style={{
                  width: "calc(100% - 40px)",
                  maxWidth: "400px",
                  background: "white",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
                  pointerEvents: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: PINTEREST.textDark,
                  margin: "0 0 16px",
                }}>
                  Create New Library
                </h3>
                
                <p style={{
                  fontSize: "14px",
                  color: PINTEREST.textLight,
                  margin: "0 0 20px",
                  lineHeight: 1.5,
                }}>
                  Give your library a name. You can add books to it later.
                </p>
                
                <input
                  type="text"
                  placeholder="e.g., My Fiction Collection, Summer Reading, etc."
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateStore()}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: `2px solid ${PINTEREST.border}`,
                    fontSize: "14px",
                    marginBottom: "20px",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                  autoFocus
                />
                
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: PINTEREST.grayLight,
                      color: PINTEREST.textDark,
                      border: `1px solid ${PINTEREST.border}`,
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateStore}
                    disabled={creatingStore || !newStoreName.trim()}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: creatingStore ? PINTEREST.textLight : PINTEREST.primary,
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: creatingStore ? "not-allowed" : "pointer",
                      opacity: creatingStore || !newStoreName.trim() ? 0.7 : 1,
                    }}
                  >
                    {creatingStore ? "Creating..." : "Create Library"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}

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
                background: PINTEREST.overlay,
                backdropFilter: "blur(4px)",
                zIndex: 3000,
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
              zIndex: 3001,
              pointerEvents: "none",
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                style={{
                  width: "calc(100% - 40px)",
                  maxWidth: "600px",
                  maxHeight: "80vh",
                  background: "white",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
                  pointerEvents: "auto",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: PINTEREST.textDark,
                  margin: "0 0 8px",
                }}>
                  Add Books to "{selectedStore.name}"
                </h3>
                
                <p style={{
                  fontSize: "14px",
                  color: PINTEREST.textLight,
                  margin: "0 0 20px",
                }}>
                  Select books from your collection to add to this library
                </p>
                
                {/* Available Books Grid */}
                <div style={{
                  flex: 1,
                  overflowY: "auto",
                  marginBottom: "20px",
                  paddingRight: "8px",
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
                      <p style={{ margin: "8px 0 0", fontSize: "12px" }}>
                        Create some book offers first from the main page
                      </p>
                    </div>
                  ) : (
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                      gap: "12px",
                    }}>
                      {filteredAvailableOffers.map((offer) => {
                        const isSelected = selectedOffersToAdd.includes(offer.id);
                        
                        return (
                          <motion.div
                            key={offer.id}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
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
                              height: "180px",
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
                              background: isSelected ? PINTEREST.primary : "rgba(255,255,255,0.9)",
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
                              padding: "10px",
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                            }}>
                              <h4 style={{
                                fontSize: "12px",
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
                                fontSize: "10px",
                                color: PINTEREST.textLight,
                                marginTop: "4px",
                              }}>
                                {offer.author || "Unknown"}
                              </div>
                            </div>
                          </motion.div>
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
                  paddingTop: "16px",
                  borderTop: `1px solid ${PINTEREST.border}`,
                }}>
                  <div style={{ fontSize: "13px", color: PINTEREST.textLight }}>
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
                        borderRadius: "10px",
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
                        background: addingOffers || selectedOffersToAdd.length === 0 ? PINTEREST.textLight : PINTEREST.primary,
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: addingOffers || selectedOffersToAdd.length === 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      {addingOffers ? "Adding..." : `Add (${selectedOffersToAdd.length})`}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* Edit Library Modal */}
        {showEditModal && selectedStore && (
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
                backdropFilter: "blur(4px)",
                zIndex: 3000,
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
              zIndex: 3001,
              pointerEvents: "none",
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                style={{
                  width: "calc(100% - 40px)",
                  maxWidth: "400px",
                  background: "white",
                  borderRadius: "20px",
                  padding: "24px",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
                  pointerEvents: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: PINTEREST.textDark,
                  margin: "0 0 16px",
                }}>
                  Rename Library
                </h3>
                
                <input
                  type="text"
                  placeholder="New library name"
                  value={editStoreName}
                  onChange={(e) => setEditStoreName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEditStore()}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: `2px solid ${PINTEREST.border}`,
                    fontSize: "14px",
                    marginBottom: "20px",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                  autoFocus
                />
                
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => setShowEditModal(false)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: PINTEREST.grayLight,
                      color: PINTEREST.textDark,
                      border: `1px solid ${PINTEREST.border}`,
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditStore}
                    disabled={editingStore || !editStoreName.trim()}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: editingStore ? PINTEREST.textLight : PINTEREST.primary,
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: editingStore ? "not-allowed" : "pointer",
                      opacity: editingStore || !editStoreName.trim() ? 0.7 : 1,
                    }}
                  >
                    {editingStore ? "Saving..." : "Save Changes"}
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
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${PINTEREST.grayLight};
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${PINTEREST.border};
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${PINTEREST.textLight};
        }
        
        input:focus {
          outline: none;
          border-color: ${PINTEREST.primary} !important;
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
}