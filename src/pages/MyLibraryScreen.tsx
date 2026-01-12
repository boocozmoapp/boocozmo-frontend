/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/MyLibraryScreen.tsx - UPDATED FOR NEW BACKEND & DB STRUCTURE
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBook, FaPlus, FaFolder, FaTrash, FaSearch, FaArrowLeft, 
  FaGlobe, FaImage, FaMapMarkerAlt, FaHome, FaMapMarkedAlt, 
  FaBookOpen, FaComments, FaBookmark, FaTimes, FaBars, FaEye, 
  FaEyeSlash, FaUsers, FaLock, FaUnlock, FaShareAlt, FaCopy, FaCrosshairs, FaEdit
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { LeafletMouseEvent } from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition }: { position: { lat: number; lng: number } | null, setPosition: (pos: { lat: number; lng: number }) => void }) {
  const map = useMapEvents({
    click(e: LeafletMouseEvent) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  useEffect(() => {
     if(position) map.flyTo(position, map.getZoom());
  }, [position, map]);
  return position ? <Marker position={position} /> : null;
}

const API_BASE = "https://boocozmo-api.onrender.com";

type StoreOffer = {
  id: number;
  storeId: number;
  offerId: number | null;
  type: "sell" | "exchange" | "buy";
  bookTitle: string;
  exchangeBook: string | null;
  price: number | null;
  condition: string | null;
  ownerEmail: string;
  imageUrl: string | null;
  state: "open" | "closed";
  visibility: "public" | "private";
  publishedAt?: string;
  isPrimary: boolean;
  originalOfferId: number | null;
  position: number;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type Store = {
  id: number;
  name: string;
  ownerEmail: string;
  created_at: string;
  updated_at?: string;
  visibility: "public" | "private";
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bookCount?: number;
};

type Props = {
  currentUser: { email: string; name: string; token: string };
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
  const [storeOffers, setStoreOffers] = useState<StoreOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(false);

  const [showCreateStoreModal, setShowCreateStoreModal] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [storeToMakePublic, setStoreToMakePublic] = useState<Store | null>(null);
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreVisibility, setNewStoreVisibility] = useState<"public" | "private">("private");
  const [creatingStore, setCreatingStore] = useState(false);

  const [newBookForm, setNewBookForm] = useState({
    bookTitle: "",
    author: "",
    condition: "Good",
    description: "",
    price: "0",
    type: "sell" as "sell" | "exchange" | "buy",
    exchangeBook: "",
    imageFile: null as File | null,
    imagePreview: null as string | null,
    notes: "",
  });
  const [addingBook, setAddingBook] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const handleAutoDetectLocation = () => {
     if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
           setTempLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
     } else { alert("Geolocation not supported"); }
  };

  const abortControllerRef = useRef<AbortController | null>(null);

  // ==================== FETCH STORES ====================
  const fetchStores = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/stores?includeOffers=true`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal,
      }, 15000);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load collections: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Stores data received:", data);
      
      const userStores = Array.isArray(data) ? data : (data.stores || []);
      
      // Ensure all stores have bookCount
      const storesWithCount = userStores.map((store: any) => ({
        ...store,
        bookCount: store.bookCount || store.offers?.length || 0
      }));
      
      setStores(storesWithCount);
      if (storesWithCount.length > 0 && !selectedStore) {
        setSelectedStore(storesWithCount[0]);
      }
    } catch (err: any) {
      console.error("Fetch stores error:", err);
      if (err.name !== "AbortError") {
        alert(`Error loading collections: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser.token, selectedStore]);

  // ==================== FETCH STORE OFFERS ====================
  const fetchStoreOffers = useCallback(async (store: Store) => {
    if (!store?.id) {
      setStoreOffers([]);
      return;
    }
    
    setLoadingOffers(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/my-store-offers/${store.id}`, {
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load books: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Store offers data:", data);
      
      const offers = data.offers || data || [];
      
      const processed: StoreOffer[] = offers.map((o: any) => ({
        id: o.id,
        storeId: o.store_id || o.storeId,
        offerId: o.offer_id || o.offerId,
        type: o.type || "sell",
        bookTitle: o.booktitle || o.bookTitle || '',
        exchangeBook: o.exchangebook || o.exchangeBook,
        price: o.price ? parseFloat(o.price) : null,
        condition: o.condition,
        ownerEmail: o.owneremail || o.ownerEmail,
        imageUrl: o.imageurl || o.imageUrl,
        state: o.state || "open",
        visibility: o.visibility || "private",
        publishedAt: o.publishedat || o.publishedAt,
        isPrimary: o.is_primary || o.isPrimary || false,
        originalOfferId: o.original_offer_id || o.originalOfferId,
        position: o.position || 0,
        notes: o.notes,
        createdAt: o.created_at || o.createdAt,
        updatedAt: o.updated_at || o.updatedAt
      }));
      
      console.log(`Processed ${processed.length} store offers`);
      setStoreOffers(processed);
    } catch (err) {
      console.error("Fetch store offers error:", err);
      setStoreOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  }, [currentUser.token]);

  // ==================== TOGGLE STORE VISIBILITY ====================
  const handleToggleStoreVisibility = async (store: Store) => {
    const newVisibility = (store.visibility === "public" ? "private" : "public") as "public" | "private";
    
    if (newVisibility === "private") {
      const confirmMessage = "Make this collection private? Others will no longer see it.";
      if (!confirm(confirmMessage)) return;

      try {
        const response = await fetchWithTimeout(`${API_BASE}/stores/${store.id}/visibility`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${currentUser.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ visibility: newVisibility }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update visibility: ${errorText}`);
        }

        const updatedStore = { ...store, visibility: newVisibility };
        setStores(prev => prev.map(s => s.id === store.id ? updatedStore : s));
        if (selectedStore?.id === store.id) {
          setSelectedStore(updatedStore);
        }

        alert(`Collection is now private`);
      } catch (err: any) {
        console.error("Error toggling visibility:", err);
        alert(`Failed to update collection visibility: ${err.message}`);
      }
    } else {
      const confirmMessage = "Make this collection public? You'll need to set a location so others can find it on the map.";
      if (!confirm(confirmMessage)) return;
      
      setStoreToMakePublic(store);
      setTempLocation(null);
      setShowLocationModal(true);
    }
  };

  // ==================== SAVE LOCATION AND MAKE PUBLIC ====================
  const handleSaveLocationAndMakePublic = async () => {
    if (!storeToMakePublic || !tempLocation) {
      alert("Please select a location on the map");
      return;
    }

    try {
      // First update location
      const locationResponse = await fetchWithTimeout(`${API_BASE}/stores/${storeToMakePublic.id}/location`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          latitude: tempLocation.lat,
          longitude: tempLocation.lng,
          location: `Lat: ${tempLocation.lat.toFixed(6)}, Lng: ${tempLocation.lng.toFixed(6)}`
        }),
      });

      if (!locationResponse.ok) {
        const errorText = await locationResponse.text();
        throw new Error(`Failed to update location: ${errorText}`);
      }

      // Then update visibility to public
      const visibilityResponse = await fetchWithTimeout(`${API_BASE}/stores/${storeToMakePublic.id}/visibility`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visibility: "public" }),
      });

      if (!visibilityResponse.ok) {
        const errorText = await visibilityResponse.text();
        throw new Error(`Failed to update visibility: ${errorText}`);
      }

      const updatedStore = { 
        ...storeToMakePublic, 
        visibility: "public" as const,
        latitude: tempLocation.lat,
        longitude: tempLocation.lng,
        location: `Lat: ${tempLocation.lat.toFixed(6)}, Lng: ${tempLocation.lng.toFixed(6)}`
      };
      
      setStores(prev => prev.map(s => s.id === storeToMakePublic.id ? updatedStore : s));
      if (selectedStore?.id === storeToMakePublic.id) {
        setSelectedStore(updatedStore);
      }

      setShowLocationModal(false);
      setStoreToMakePublic(null);
      setTempLocation(null);
      alert("Collection is now public and visible on the map!");
    } catch (err: any) {
      console.error("Error updating store:", err);
      alert(`Failed to make collection public: ${err.message}`);
    }
  };

  // ==================== GENERATE SHARE LINK ====================
  const handleGenerateShareLink = (store: Store) => {
    if (store.visibility !== "public") {
      alert("Collection must be public to share. Make it public first.");
      return;
    }
    
    const link = `${window.location.origin}/store/${store.id}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  // ==================== COPY SHARE LINK ====================
  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy link");
    }
  };

  // ==================== CREATE STORE ====================
  const handleCreateStore = async () => {
    if (!newStoreName.trim()) return;
    setCreatingStore(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/create-store`, {
        method: 'POST', 
        headers: { 
          "Authorization": `Bearer ${currentUser.token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ 
          name: newStoreName.trim(), 
          visibility: newStoreVisibility
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create store");
      }
      
      const newStore = await response.json();
      await fetchStores();
      
      setNewStoreName("");
      setNewStoreVisibility("private");
      setShowCreateStoreModal(false);
      alert("Collection created successfully!");
      
    } catch (e: any) { 
      console.error("Create store error:", e);
      alert(`Error creating collection: ${e.message}`); 
    } finally { 
      setCreatingStore(false); 
    }
  };

  // ==================== REMOVE BOOK FROM STORE ====================
  const handleRemoveBook = async (storeOfferId: number) => {
    if (!selectedStore) return;
    if (!confirm("Remove this book from the collection?")) return;
    
    try {
      const response = await fetchWithTimeout(`${API_BASE}/store-offers/${storeOfferId}`, {
        method: 'DELETE',
        headers: { 
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to remove book: ${errorText}`);
      }
      
      await fetchStoreOffers(selectedStore);
      await fetchStores(); // Refresh store count
      alert("Book removed from collection");
    } catch (e: any) {
      console.error(e);
      alert(`Failed to remove book: ${e.message}`);
    }
  };

  // ==================== ADD BOOK TO STORE ====================
  const handleAddBook = async () => {
    if (!selectedStore) return;
    setAddingBook(true);
    try {
      let imageBase64 = null;
      if (newBookForm.imageFile) {
        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            // Extract base64 data without the data URL prefix
            const base64Data = result.split(',')[1] || result;
            resolve(base64Data);
          };
          reader.readAsDataURL(newBookForm.imageFile!);
        });
      }
      
      const payload = {
        storeId: selectedStore.id,
        type: newBookForm.type,
        bookTitle: newBookForm.bookTitle.trim(),
        exchangeBook: newBookForm.type === "exchange" ? newBookForm.exchangeBook.trim() : null,
        price: newBookForm.type === "sell" ? parseFloat(newBookForm.price) : null,
        image: imageBase64,
        condition: newBookForm.condition,
        notes: newBookForm.notes || null,
        position: 0
      };
      
      console.log("Creating store offer with payload:", { 
        ...payload, 
        image: imageBase64 ? "base64 image present" : "no image" 
      });
      
      const response = await fetchWithTimeout(`${API_BASE}/add-store-offer`, {
        method: 'POST', 
        headers: { 
          "Authorization": `Bearer ${currentUser.token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Create store offer error response:", errorText);
        throw new Error(`Failed to add book: ${errorText}`);
      }
      
      const newStoreOffer = await response.json();
      console.log("New store offer created:", newStoreOffer);

      await fetchStoreOffers(selectedStore);
      await fetchStores(); // Refresh store count
      
      setShowAddBookModal(false);
      setNewBookForm({
        bookTitle: "",
        author: "",
        condition: "Good",
        description: "",
        price: "0",
        type: "sell",
        exchangeBook: "",
        imageFile: null,
        imagePreview: null,
        notes: "",
      });
      
      alert("Book added to collection successfully!");
    } catch (e: any) { 
      console.error("Add book error:", e);
      alert(`Failed to add book: ${e.message}`); 
    } finally { 
      setAddingBook(false); 
    }
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    fetchStores();
    return () => abortControllerRef.current?.abort();
  }, [fetchStores]);

  useEffect(() => {
    if (selectedStore) {
      fetchStoreOffers(selectedStore);
    } else {
      setStoreOffers([]);
    }
  }, [selectedStore, fetchStoreOffers]);

  // ==================== IMAGE HELPER ====================
  const getImageSource = (offer: any) => {
    const url = offer.imageUrl || offer.imageurl;
    if (url) {
      if (typeof url === 'string') {
        if (url.startsWith('http')) return url;
        if (url.startsWith('data:')) return url;
        // If it's just a base64 string without data prefix
        return `data:image/jpeg;base64,${url}`;
      }
    }
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80";
  };

  return (
    <div className="h-[calc(100vh-110px)] md:h-[calc(100vh-60px)] w-full bg-primary text-text-main flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="h-20 px-6 flex items-center justify-between border-b border-[#eee] bg-[#f4f1ea] sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/home")} className="p-2 text-[#382110] hover:bg-white/50 rounded-full transition-colors">
            <FaArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-serif font-bold text-[#382110]">My Library</h1>
        </div>
        <button 
          onClick={() => setShowCreateStoreModal(true)}
          className="px-5 py-2.5 bg-[#00635d] text-white rounded-[4px] shadow-sm hover:bg-[#004d48] transition-all flex items-center gap-2 font-bold text-sm"
        >
          <FaPlus /> New Collection
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Compact Instructional Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#f4f1ea] to-white border-b border-[#e8e0d5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#382110] rounded-lg flex-shrink-0 flex items-center justify-center text-white">
              <FaBook size={18} />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-serif font-bold text-[#382110]">Your Digital Library</h2>
              <p className="text-xs text-[#5c4a3c]">Organize your books into collections and share them with the community</p>
            </div>
          </div>
        </div>

        {/* Collections List - Compact Horizontal Scroll */}
        <div className="px-6 py-4 bg-white border-b border-[#eee]">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-[#382110] uppercase tracking-wider">Collections</h3>
          </div>
          <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
            {loading ? (
              <div className="text-[#999] text-sm py-4">Loading collections...</div>
            ) : stores.length > 0 ? (
              stores.map(store => (
                <motion.div
                  key={store.id}
                  onClick={() => setSelectedStore(store)}
                  className={`min-w-[180px] p-3 rounded-lg cursor-pointer border-2 transition-all relative flex-shrink-0
                    ${selectedStore?.id === store.id 
                      ? 'bg-[#f4f1ea] border-[#382110] shadow-md' 
                      : 'bg-white border-[#e8e0d5] hover:border-[#382110]/40 hover:shadow-sm'}`}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                      ${selectedStore?.id === store.id ? 'bg-[#382110] text-white' : 'bg-[#f4f1ea] text-[#382110]'}`}>
                      <FaFolder size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#382110] text-sm truncate mb-0.5">{store.name}</h3>
                      <p className="text-[10px] text-[#777] font-medium">
                        {store.bookCount || 0} {store.bookCount === 1 ? 'book' : 'books'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#eee]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStoreVisibility(store);
                      }}
                      className={`w-full text-[10px] px-2 py-1.5 rounded-md flex items-center justify-center gap-1.5 font-medium transition-all ${
                        store.visibility === "public" 
                          ? "bg-[#e0f2fe] text-[#00635d] hover:bg-[#bae6fd] border border-[#bae6fd]" 
                          : "bg-[#382110] text-white hover:bg-[#2a180c]"
                      }`}
                    >
                      {store.visibility === "public" ? <FaLock size={9} /> : <FaGlobe size={9} />}
                      {store.visibility === "public" ? "Make Private" : "Make Public"}
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-[#999] italic text-sm py-4">No collections yet. Create one!</div>
            )}
          </div>
        </div>

        {/* Collection Header - Compact */}
        {selectedStore && (
          <div className="px-6 py-4 bg-[#f9f9f9] border-b border-[#eee]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-serif font-bold text-[#382110] mb-1">{selectedStore.name}</h2>
                <div className="flex items-center gap-3 text-xs text-[#777]">
                  <span>{storeOffers.length} {storeOffers.length === 1 ? 'book' : 'books'}</span>
                  <span>•</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedStore.visibility === "public" 
                      ? "bg-[#e0f2fe] text-[#00635d]" 
                      : "bg-[#f3f4f6] text-[#777]"
                  }`}>
                    {selectedStore.visibility === "public" ? "PUBLIC" : "PRIVATE"}
                  </span>
                  {selectedStore.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt size={8} />
                        <span className="truncate max-w-[120px]">{selectedStore.location}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStoreVisibility(selectedStore)}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all ${
                    selectedStore.visibility === "public"
                      ? "bg-[#f0f9ff] text-[#00635d] border border-[#bae6fd] hover:bg-[#e0f2fe]"
                      : "bg-[#382110] text-white hover:bg-[#2a180c]"
                  }`}
                >
                  {selectedStore.visibility === "public" ? <FaLock size={12} /> : <FaGlobe size={12} />}
                  {selectedStore.visibility === "public" ? "Make Private" : "Make Public"}
                </button>

                {selectedStore.visibility === "public" && (
                  <button
                    onClick={() => handleGenerateShareLink(selectedStore)}
                    className="px-3 py-1.5 bg-[#382110] text-white rounded-lg font-medium text-xs flex items-center gap-1.5 hover:bg-[#2a180c] transition-all"
                  >
                    <FaShareAlt size={12} />
                    Share
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Books Grid - Organized */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {selectedStore ? (
            <>
              {loadingOffers ? (
                <div className="text-[#999] text-center py-12">Loading books...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {/* Add Book Placeholder Card */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    onClick={() => setShowAddBookModal(true)}
                    className="aspect-[2/3] border-2 border-dashed border-[#ddd] rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#382110]/40 hover:bg-[#fdfaf5] transition-all bg-[#f9f9f9]"
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#999]">
                      <FaPlus size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-[#777] uppercase tracking-wider text-center px-2">Add Book</span>
                  </motion.div>
                  
                  {storeOffers.map(book => (
                    <div key={book.id} className="group relative rounded-lg overflow-hidden bg-white border border-[#eee] hover:border-[#382110]/40 transition-all shadow-sm">
                      <div className="aspect-[2/3] relative">
                        <img src={getImageSource(book)} className="w-full h-full object-cover" alt={book.bookTitle} />
                        {book.visibility === "public" && (
                          <div className="absolute top-2 left-2 z-10">
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm text-white bg-[#00635d]">
                              PUBLIC
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center gap-3 transition-all opacity-0 group-hover:opacity-100">
                          <button 
                            onClick={() => {
                              setNewBookForm({
                                bookTitle: book.bookTitle || "",
                                author: "",
                                condition: book.condition || "Good",
                                description: "",
                                price: book.price?.toString() || "0",
                                type: book.type,
                                exchangeBook: book.exchangeBook || "",
                                imageFile: null,
                                imagePreview: book.imageUrl || null,
                                notes: book.notes || ""
                              });
                              setShowAddBookModal(true);
                            }}
                            className="w-9 h-9 bg-white text-[#382110] rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                            title="Edit Book"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button 
                            onClick={() => handleRemoveBook(book.id)}
                            className="w-9 h-9 bg-[#e74c3c] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                            title="Remove from Collection"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <h3 className="text-[#382110] font-bold text-xs truncate mb-0.5">{book.bookTitle}</h3>
                        <p className="text-[#777] text-[10px] truncate">{book.condition}</p>
                        {book.price && book.price > 0 && (
                          <p className="text-[10px] font-bold text-[#d37e2f] mt-1">PKR {book.price}</p>
                        )}
                        {book.type === "exchange" && book.exchangeBook && (
                          <p className="text-[9px] text-[#00635d] truncate mt-0.5">For: {book.exchangeBook}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {storeOffers.length === 0 && !loadingOffers && (
                <div className="text-center py-16">
                  <FaBookOpen size={40} className="mx-auto text-[#999] opacity-30 mb-3" />
                  <p className="text-[#999] text-sm italic">No books in this collection yet</p>
                  <button
                    onClick={() => setShowAddBookModal(true)}
                    className="mt-4 px-4 py-2 bg-[#382110] text-white rounded-lg text-xs font-bold hover:bg-[#2a180c] transition-colors"
                  >
                    Add Your First Book
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#999] gap-4">
              <FaBookOpen size={48} className="opacity-20" />
              <p className="font-serif italic text-sm">Select a collection to view your books</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Create Store Modal */}
        {showCreateStoreModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white border border-[#eee] rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="text-xl font-serif font-bold text-[#382110] mb-4">New Collection</h3>
              <input 
                value={newStoreName} 
                onChange={e => setNewStoreName(e.target.value)}
                placeholder="Collection Name (e.g. My Sci-Fi Box)"
                className="w-full bg-[#f9f9f9] border border-[#ddd] rounded-lg p-3 text-[#333] mb-3 focus:border-[#382110] outline-none placeholder:text-black/50"
              />

              <div className="mb-4">
                <label className="block text-xs font-bold uppercase text-[#777] mb-2">Visibility</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewStoreVisibility("private")}
                    className={`flex-1 py-2.5 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      newStoreVisibility === "private"
                        ? "bg-[#f3f4f6] border-[#382110] text-[#382110]"
                        : "bg-white border-[#ddd] text-[#777] hover:border-[#382110]/30"
                    }`}
                  >
                    <FaLock size={14} />
                    Private
                  </button>
                  <button
                    onClick={() => setNewStoreVisibility("public")}
                    className={`flex-1 py-2.5 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      newStoreVisibility === "public"
                        ? "bg-[#f0f9ff] border-[#00635d] text-[#00635d]"
                        : "bg-white border-[#ddd] text-[#777] hover:border-[#00635d]/30"
                    }`}
                  >
                    <FaUsers size={14} />
                    Public
                  </button>
                </div>
                <p className="text-xs text-[#777] mt-2">
                  {newStoreVisibility === "public"
                    ? "Anyone can browse this collection (requires location)"
                    : "Only you can see this collection"}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setShowCreateStoreModal(false)} className="text-[#777] hover:text-[#382110] text-sm font-medium">Cancel</button>
                <button onClick={handleCreateStore} disabled={creatingStore} className="px-5 py-2 bg-[#382110] text-white rounded-lg font-bold text-sm">
                  {creatingStore ? "Creating..." : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Add Book Modal */}
        {showAddBookModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white border border-[#eee] rounded-xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl">
              <h3 className="text-xl font-bold text-[#382110] mb-4">
                Add Book to Collection
              </h3>
              <div className="space-y-3">
                <input 
                  value={newBookForm.bookTitle} 
                  onChange={e => setNewBookForm({...newBookForm, bookTitle: e.target.value})} 
                  placeholder="Book Title *" 
                  className="w-full bg-[#f9f9f9] border border-[#ddd] rounded-lg p-3 text-[#333] placeholder:text-black/50 outline-none" 
                  required
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#777] mb-1">Type</label>
                    <select 
                      value={newBookForm.type}
                      onChange={e => setNewBookForm({...newBookForm, type: e.target.value as "sell" | "exchange" | "buy"})}
                      className="w-full bg-[#f9f9f9] border border-[#ddd] rounded-lg p-3 text-[#333] text-sm outline-none"
                    >
                      <option value="sell">Sell</option>
                      <option value="exchange">Exchange</option>
                      <option value="buy">Buy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#777] mb-1">Condition</label>
                    <select 
                      value={newBookForm.condition}
                      onChange={e => setNewBookForm({...newBookForm, condition: e.target.value})}
                      className="w-full bg-[#f9f9f9] border border-[#ddd] rounded-lg p-3 text-[#333] text-sm outline-none"
                    >
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                </div>

                {newBookForm.type === "sell" && (
                  <input 
                    type="number"
                    value={newBookForm.price}
                    onChange={e => setNewBookForm({...newBookForm, price: e.target.value})}
                    placeholder="Price (PKR)" 
                    className="w-full bg-[#f9f9f9] border border-[#ddd] rounded-lg p-3 text-[#333] placeholder:text-black/50 outline-none" 
                    min="0"
                    step="0.01"
                  />
                )}

                {newBookForm.type === "exchange" && (
                  <input 
                    value={newBookForm.exchangeBook}
                    onChange={e => setNewBookForm({...newBookForm, exchangeBook: e.target.value})}
                    placeholder="Book you want in exchange *" 
                    className="w-full bg-[#f9f9f9] border border-[#ddd] rounded-lg p-3 text-[#333] placeholder:text-black/50 outline-none" 
                  />
                )}

                <textarea 
                  value={newBookForm.notes}
                  onChange={e => setNewBookForm({...newBookForm, notes: e.target.value})}
                  placeholder="Notes about this book (optional)" 
                  className="w-full bg-[#f9f9f9] border border-[#ddd] rounded-lg p-3 text-[#333] placeholder:text-black/50 outline-none h-20" 
                />
                
                <div className="border-2 border-dashed border-[#ddd] rounded-xl p-4 text-center cursor-pointer hover:border-[#382110]/30 transition-colors relative bg-[#f9f9f9]">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewBookForm({...newBookForm, imageFile: file, imagePreview: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                  {newBookForm.imagePreview ? (
                    <div>
                      <img src={newBookForm.imagePreview} className="h-32 mx-auto rounded-lg object-contain mb-2" alt="Preview" />
                      <p className="text-[#777] text-sm">Click to change image</p>
                    </div>
                  ) : (
                    <div className="text-[#777]">
                      <FaImage className="mx-auto text-2xl mb-1"/>
                      <p className="text-sm">Upload Cover (Optional)</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => {
                  setShowAddBookModal(false);
                  setNewBookForm({
                    bookTitle: "",
                    author: "",
                    condition: "Good",
                    description: "",
                    price: "0",
                    type: "sell",
                    exchangeBook: "",
                    imageFile: null,
                    imagePreview: null,
                    notes: "",
                  });
                }} className="text-[#777] hover:text-[#382110]">Cancel</button>
                <button onClick={handleAddBook} disabled={addingBook} className="px-4 py-2 bg-[#382110] text-white rounded-lg font-medium">
                  {addingBook ? "Adding..." : "Add Book"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Location Picker Modal for Making Store Public */}
        {showLocationModal && storeToMakePublic && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white border border-[#eee] rounded-xl p-6 w-full max-w-lg shadow-xl">
              <h3 className="text-xl font-serif font-bold text-[#382110] mb-2">
                Set Collection Location
              </h3>
              <p className="text-[#777] text-sm mb-4">
                Pinpoint your collection location on the map so others can find it.
              </p>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  className="flex-1 bg-white border border-[#ccc] py-2 text-xs font-bold text-[#555] hover:bg-[#eee] flex items-center justify-center gap-1 rounded-lg"
                >
                  <FaCrosshairs /> Auto Detect
                </button>
              </div>

              <div className="h-64 border border-[#ccc] mb-4 relative z-0 rounded-lg overflow-hidden">
                <MapContainer
                  center={tempLocation || { lat: 40.7128, lng: -74.0060 }}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker
                    position={tempLocation}
                    setPosition={setTempLocation}
                  />
                </MapContainer>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowLocationModal(false);
                    setStoreToMakePublic(null);
                    setTempLocation(null);
                  }}
                  className="text-[#999] text-sm hover:text-[#382110] px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLocationAndMakePublic}
                  className="bg-[#382110] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:scale-105 transition-transform"
                >
                  Save & Make Public
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white border border-[#eee] rounded-xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-serif font-bold text-[#382110] mb-2">Share Collection</h3>
              <p className="text-[#777] text-sm mb-4">Share this collection with others using the link below:</p>
              
              <div className="bg-[#f9f9f9] border border-[#ddd] rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#333] truncate">{shareLink}</p>
                  <button
                    onClick={handleCopyShareLink}
                    className="ml-2 px-3 py-1.5 bg-[#382110] text-white rounded-lg text-sm font-medium hover:bg-[#2a180c] transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <FaCopy size={12} />
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <FaUsers className="mt-0.5 text-[#00635d]" />
                  <div>
                    <p className="text-sm font-medium text-[#00635d] mb-1">Collection is Public</p>
                    <p className="text-xs text-[#00635d]/80">
                      Anyone with the link can browse this collection.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-[#382110] text-white rounded-lg font-medium hover:bg-[#2a180c] transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}