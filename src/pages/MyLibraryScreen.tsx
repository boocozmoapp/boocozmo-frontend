/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/MyLibraryScreen.tsx - PREMIUM THEME
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBook, FaPlus, FaFolder, FaTrash, FaSearch, FaArrowLeft, 
  FaGlobe, FaImage, FaMapMarkerAlt, FaHome, FaMapMarkedAlt, 
  FaBookOpen, FaComments, FaBookmark, FaTimes, FaBars, FaEye, FaEyeSlash
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
  visibility?: "public" | "private";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAutoDetect = () => {
     if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
           setPublishForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        });
     } else { alert("Geolocation not supported"); }
  };

  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Handlers
  const handlePublishToggle = async (offer: Offer) => {
     const isPublic = offer.visibility === 'public';
     if (isPublic) {
        if(!confirm("Unpublish this book from the marketplace?")) return;
        try {
           await fetchWithTimeout(`${API_BASE}/unpublish-offer/${offer.id}`, {
              method: 'POST', headers: { 'Authorization': `Bearer ${currentUser.token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({})
           });
           if(selectedStore) await fetchStoreOffers(selectedStore);
        } catch (e) { alert("Failed to unpublish"); }
     } else {
        setBookToPublish(offer);
        setPublishForm({
           type: (offer.type as any) || "sell",
           price: offer.price?.toString() || "",
           exchangeBook: offer.exchangeBook || "",
           latitude: offer.latitude || 40.7128,
           longitude: offer.longitude || -74.0060
        });
        setShowPublishModal(true);
     }
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) return;
    setCreatingStore(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/create-store`, {
         method: 'POST', headers: { Authorization: `Bearer ${currentUser.token}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ name: newStoreName.trim(), offers: [] })
      });
      if (!response.ok) throw new Error("Failed");
      await fetchStores();
      setNewStoreName("");
      setShowCreateStoreModal(false);
    } catch (e) { alert("Failed to create library"); }
    finally { setCreatingStore(false); }
  };

  const handleAddBook = async () => {
    if (!selectedStore) return;
    setAddingBook(true);
    try {
       let imageBase64 = null;
       if (newBookForm.imageFile) {
          imageBase64 = await new Promise<string>((resolve) => {
             const r = new FileReader(); r.onload = () => resolve(r.result as string); r.readAsDataURL(newBookForm.imageFile!);
          });
       }
       const response = await fetchWithTimeout(`${API_BASE}/add-to-store/${selectedStore.id}`, {
          method: 'POST', headers: { Authorization: `Bearer ${currentUser.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ offers: [{ ...newBookForm, type: 'sell', image: imageBase64, price: null, exchangeBook: null, latitude: null, longitude: null }] })
       });
       if (!response.ok) throw new Error("Failed");
       await fetchStoreOffers(selectedStore);
       setShowAddBookModal(false);
       setNewBookForm({ bookTitle: "", author: "", genre: "Fiction", condition: "Good", description: "", imageFile: null, imagePreview: null });
    } catch (e) { alert("Failed to add book"); }
    finally { setAddingBook(false); }
  };

  const handlePublish = async () => {
    if (!bookToPublish) return;
    setPublishing(true);
    try {
       const imageBase64 = bookToPublish.imageBase64 || bookToPublish.imageUrl || null;
       const payload = {
          type: publishForm.type,
          bookTitle: bookToPublish.bookTitle,
          exchangeBook: publishForm.type === "exchange" ? publishForm.exchangeBook : null,
          price: publishForm.type === "sell" ? Number(publishForm.price) : null,
          latitude: publishForm.latitude,
          longitude: publishForm.longitude,
          image: imageBase64,
          condition: bookToPublish.condition
       };
       const response = await fetchWithTimeout(`${API_BASE}/submit-offer`, {
          method: 'POST', headers: { Authorization: `Bearer ${currentUser.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
       });
       if (!response.ok) throw new Error("Failed");
       alert("Published!");
       setShowPublishModal(false);
       setBookToPublish(null);
    } catch (e) { alert("Failed to publish"); }
    finally { setPublishing(false); }
  };

  const handleRemove = async (offerId: number) => {
     if (!selectedStore || !confirm("Remove?")) return;
     try {
        await fetchWithTimeout(`${API_BASE}/remove-from-store/${selectedStore.id}/${offerId}`, {
           method: 'DELETE', headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        await fetchStoreOffers(selectedStore);
     } catch (e) { alert("Failed remove"); }
  };

  useEffect(() => {
    fetchStores();
    return () => abortControllerRef.current?.abort();
  }, [fetchStores]);

  useEffect(() => {
    if (selectedStore) fetchStoreOffers(selectedStore);
    else setStoreOffers([]);
  }, [selectedStore, fetchStoreOffers]);

  // Image Source helper
  const getImageSource = (offer: Offer) => {
    if (offer.imageUrl) return offer.imageUrl;
    if (offer.imageBase64) return offer.imageBase64.startsWith("data:") ? offer.imageBase64 : `data:image/jpeg;base64,${offer.imageBase64}`;
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80"; // Fallback
  };

  return (
    <div className="h-screen w-full bg-primary text-text-main flex flex-col overflow-hidden font-sans">
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
      <div className="flex-1 flex flex-col overflow-hidden bg-[#fdfaf5]">
         {/* Aesthetic Instructional Poster */}
         <div className="p-4 pb-2">
            <div className="w-full bg-white border border-[#e8e0d5] rounded-lg p-5 relative overflow-hidden shadow-sm flex flex-col md:flex-row items-center gap-5">
                {/* Decorative Painting-style background element */}
                <div className="absolute top-0 right-0 w-1/4 h-full opacity-10 pointer-events-none grayscale">
                   <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80" className="w-full h-full object-cover" />
                </div>
                
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#f4f1ea] rounded-full flex-shrink-0 flex items-center justify-center text-[#382110] shadow-inner border border-[#e8e0d5]">
                   <FaBook size={24} className="opacity-40" />
                </div>

                <div className="z-10 text-center md:text-left flex-1">
                   <h2 className="text-xl font-serif font-bold text-[#382110] mb-1">Digitize Your Physical Bookshelf</h2>
                   <div className="text-[#5c4a3c] text-xs leading-snug max-w-2xl space-y-1">
                      <p>Catalog your collection, mimic your shelves, and set any book to <strong>Public</strong> to share with the Boocozmo network.</p>
                      <p className="italic opacity-60">Select or create a shelf below to start.</p>
                   </div>
                </div>
            </div>
         </div>

         {/* Libraries List */}
         <div className="p-6 bg-white border-b border-[#eee]">
            <div className="flex overflow-x-auto gap-4 pb-2 custom-scrollbar">
               {loading ? <div className="text-[#999]">Loading libraries...</div> : 
                  stores.map(store => (
                     <motion.div
                       key={store.id}
                       onClick={() => setSelectedStore(store)}
                       className={`min-w-[200px] p-4 rounded-xl cursor-pointer border transition-all
                          ${selectedStore?.id === store.id 
                             ? 'bg-[#f4f1ea] border-[#382110]/30 shadow-sm' 
                             : 'bg-white border-[#eee] hover:border-[#382110]/20'}`}
                       whileHover={{ y: -2 }}
                     >
                        <div className="flex items-center gap-3 mb-1">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                              ${selectedStore?.id === store.id ? 'bg-[#382110] text-white' : 'bg-[#f4f1ea] text-[#382110]'}`}>
                              <FaFolder size={14} />
                           </div>
                           <div className="min-w-0">
                              <h3 className="font-bold text-[#382110] text-sm truncate">{store.name}</h3>
                              <p className="text-[10px] text-[#777] uppercase font-bold tracking-tighter">{store.offerIds?.length || 0} books</p>
                           </div>
                        </div>
                     </motion.div>
                  ))
               }
               {stores.length === 0 && !loading && <div className="text-[#999] italic text-sm">No collections yet. Create one!</div>}
            </div>
         </div>

         {/* Books Grid */}
         <div className="flex-1 overflow-y-auto p-6 bg-white">
            {selectedStore ? (
               <>
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-serif font-bold text-[#382110]">{selectedStore.name} <span className="text-[#999] text-sm font-sans font-normal ml-2">({storeOffers.length} items)</span></h2>
                  </div>
                  
                  {loadingOffers ? <div className="text-[#999]">Loading items...</div> : (
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {/* Add Book Placeholder Card */}
                        <motion.div 
                           whileHover={{ scale: 1.02 }}
                           onClick={() => setShowAddBookModal(true)}
                           className="aspect-[2/3] border-2 border-dashed border-[#ddd] rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#382110]/30 hover:bg-[#fdfaf5] transition-all bg-[#f9f9f9]"
                        >
                           <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#999]">
                              <FaPlus size={20} />
                           </div>
                           <span className="text-xs font-bold text-[#777] uppercase tracking-wider">Add to shelf</span>
                        </motion.div>
                        {storeOffers.map(offer => (
                           <div key={offer.id} className="group relative rounded-xl overflow-hidden bg-white border border-[#eee] hover:border-[#382110]/30 transition-all shadow-sm">
                              <div className="aspect-[2/3] relative">
                                 <img src={getImageSource(offer)} className="w-full h-full object-cover" />
                                 <div className="absolute top-2 right-2">
                                     <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm text-white ${offer.visibility === 'public' ? 'bg-[#00635d]' : 'bg-[#777]'}`}>
                                        {offer.visibility === 'public' ? 'PUBLIC' : 'PRIVATE'}
                                     </span>
                                 </div>
                                 <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-4 transition-opacity group-hover:bg-black/40">
                                    <button 
                                      onClick={() => handlePublishToggle(offer)}
                                      className="w-10 h-10 bg-white text-[#382110] rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                      title={offer.visibility === 'public' ? "Make Private" : "Make Public"}
                                    >
                                       {offer.visibility === 'public' ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                                    </button>
                                    <button 
                                      onClick={() => handleRemove(offer.id)}
                                      className="w-10 h-10 bg-[#e74c3c] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                      title="Remove"
                                    >
                                       <FaTrash size={16} />
                                    </button>
                                 </div>
                              </div>
                              <div className="p-3">
                                 <h3 className="text-[#382110] font-bold text-sm truncate">{offer.bookTitle}</h3>
                                 <p className="text-[#777] text-xs truncate">{offer.author}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
                  {storeOffers.length === 0 && !loadingOffers && <div className="text-[#999] text-center mt-10 italic">No books in this shelf yet.</div>}
               </>
            ) : <div className="flex flex-col items-center justify-center h-full text-[#999] gap-4">
                 <FaBookOpen size={48} className="opacity-20" />
                 <p className="font-serif italic">Select a shelf to view your books</p>
            </div>}
         </div>
      </div>

      {/* Modals (Create Store, Add Book, Publish) */}
      <AnimatePresence>
         {showCreateStoreModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
               <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-primary border border-white/10 rounded-2xl p-6 w-full max-w-sm">
                  <h3 className="text-xl font-bold text-white mb-4">New Library</h3>
                  <input 
                     value={newStoreName} onChange={e => setNewStoreName(e.target.value)}
                     placeholder="Library Name (e.g. My Sci-Fi Collection)"
                     className="w-full bg-primary-light/50 border border-white/10 rounded-xl p-3 text-white mb-4 focus:border-secondary outline-none"
                  />
                  <div className="flex justify-end gap-3">
                     <button onClick={() => setShowCreateStoreModal(false)} className="text-text-muted hover:text-white">Cancel</button>
                     <button onClick={handleCreateStore} disabled={creatingStore} className="px-4 py-2 bg-secondary text-white rounded-xl font-medium">
                        {creatingStore ? "Creating..." : "Create"}
                     </button>
                  </div>
               </motion.div>
            </motion.div>
         )}

         {showAddBookModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
               <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-primary border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
                  <h3 className="text-xl font-bold text-white mb-4">Add Book</h3>
                  <div className="space-y-3">
                     <input value={newBookForm.bookTitle} onChange={e => setNewBookForm({...newBookForm, bookTitle: e.target.value})} placeholder="Book Title" className="input-field w-full bg-primary-light/50 border border-white/10 rounded-xl p-3 text-white" />
                     <input value={newBookForm.author} onChange={e => setNewBookForm({...newBookForm, author: e.target.value})} placeholder="Author" className="input-field w-full bg-primary-light/50 border border-white/10 rounded-xl p-3 text-white" />
                     <textarea value={newBookForm.description} onChange={e => setNewBookForm({...newBookForm, description: e.target.value})} placeholder="Description" className="input-field w-full bg-primary-light/50 border border-white/10 rounded-xl p-3 text-white h-24" />
                     
                     <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-secondary transition-colors relative">
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" 
                           onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                 const reader = new FileReader();
                                 reader.onloadend = () => setNewBookForm({...newBookForm, imageFile: file, imagePreview: reader.result as string});
                                 reader.readAsDataURL(file);
                              }
                           }} 
                         />
                         {newBookForm.imagePreview ? <img src={newBookForm.imagePreview} className="h-32 mx-auto rounded-lg object-contain" /> : <div className="text-text-muted"><FaImage className="mx-auto text-2xl mb-1"/>Upload Cover</div>}
                      </div>
                   </div>
                   <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setShowAddBookModal(false)} className="text-text-muted hover:text-white">Cancel</button>
                      <button onClick={handleAddBook} disabled={addingBook} className="px-4 py-2 bg-secondary text-white rounded-xl font-medium">
                         {addingBook ? "Adding..." : "Add"}
                      </button>
                   </div>
                </motion.div>
            </motion.div>
         )}

         {showPublishModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
               <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-primary border border-white/10 rounded-2xl p-6 w-full max-w-md">
                   <h3 className="text-xl font-bold text-white mb-2">Publish "{bookToPublish?.bookTitle}"</h3>
                   <p className="text-text-muted text-sm mb-4">Make this book available to the community.</p>
                   
                   <div className="bg-primary-light/20 p-3 rounded-lg mb-4 text-xs text-text-muted flex items-start gap-2">
                       <FaGlobe className="mt-0.5 text-secondary" />
                       <p>Publishing will reveal the approximate location of this book on the map so buyers can find it.</p>
                   </div>

                   <div className="flex gap-4 mb-4">
                      <button onClick={() => setPublishForm({...publishForm, type: "sell"})} className={`flex-1 py-2 rounded-lg border ${publishForm.type === "sell" ? "bg-secondary border-secondary text-white" : "border-white/10 text-text-muted"}`}>Sell</button>
                      <button onClick={() => setPublishForm({...publishForm, type: "exchange"})} className={`flex-1 py-2 rounded-lg border ${publishForm.type === "exchange" ? "bg-secondary border-secondary text-white" : "border-white/10 text-text-muted"}`}>Exchange</button>
                   </div>

                   {publishForm.type === "sell" && (
                      <input type="number" value={publishForm.price} onChange={e => setPublishForm({...publishForm, price: e.target.value})} placeholder="Price ($)" className="w-full bg-primary-light/50 border border-white/10 rounded-xl p-3 text-white mb-3" />
                   )}
                   {publishForm.type === "exchange" && (
                      <input value={publishForm.exchangeBook} onChange={e => setPublishForm({...publishForm, exchangeBook: e.target.value})} placeholder="Trading for (e.g. Sci-Fi books)" className="w-full bg-primary-light/50 border border-white/10 rounded-xl p-3 text-white mb-3" />
                   )}

                   <div className="mb-4">
                       <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold uppercase text-text-muted">Confirm Location</label>
                          <button onClick={handleAutoDetect} className="text-xs text-secondary hover:underline">Auto Detect</button>
                       </div>
                       <div className="h-48 border border-white/10 rounded-xl overflow-hidden relative z-0">
                            <MapContainer center={[publishForm.latitude, publishForm.longitude]} zoom={13} style={{ height: "100%", width: "100%" }}>
                               <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                               <LocationMarker 
                                  position={{ lat: publishForm.latitude, lng: publishForm.longitude }} 
                                  setPosition={(pos) => setPublishForm({...publishForm, latitude: pos.lat, longitude: pos.lng})} 
                               />
                            </MapContainer>
                       </div>
                       <p className="text-[10px] text-text-muted mt-1">Tap map to pinpoint exact location.</p>
                   </div>

                   <div className="flex justify-end gap-3 mt-4">
                      <button onClick={() => setShowPublishModal(false)} className="text-text-muted hover:text-white">Cancel</button>
                      <button onClick={handlePublish} disabled={publishing} className="px-4 py-2 bg-secondary text-white rounded-xl font-medium">
                         {publishing ? "Publishing..." : "Publish Now"}
                      </button>
                   </div>
                </motion.div>
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
}