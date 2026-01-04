/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/MyLibraryScreen.tsx - PREMIUM THEME
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBook, FaPlus, FaFolder, FaTrash, FaSearch, FaArrowLeft, 
  FaGlobe, FaImage, FaMapMarkerAlt, FaHome, FaMapMarkedAlt, 
  FaComments, FaBookmark, FaTimes, FaBars, FaEye, FaEyeSlash
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
      <header className="h-20 px-6 flex items-center justify-between border-b border-white/5 bg-primary/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate("/")} className="p-2 text-white hover:text-secondary transition-colors">
              <FaArrowLeft size={20} />
           </button>
           <h1 className="text-2xl font-serif font-bold text-white">My Library</h1>
        </div>
        <button 
           onClick={() => setShowCreateStoreModal(true)}
           className="px-4 py-2 bg-secondary text-white rounded-xl shadow-lg hover:bg-secondary-hover transition-all flex items-center gap-2 font-medium"
        >
           <FaPlus /> New Library
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
         {/* Artistic Guide Poster (Responsive) */}
         <div className="p-6 pb-2">
            <div className="w-full bg-gradient-to-r from-[#382110] to-[#5a3a20] rounded-2xl p-6 relative overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="z-10 text-center md:text-left">
                   <h2 className="text-2xl font-serif font-bold text-white mb-2">Build Your Community Library</h2>
                   <p className="text-white/80 text-sm max-w-lg leading-relaxed">
                      Transform your personal collection into a public treasure. Publish books to the marketplace to sell or exchange with neighbors. 
                      Every book you share strengthens the Boocozmo network.
                   </p>
                </div>
                <div className="z-10 flex-shrink-0">
                    <button onClick={() => setShowAddBookModal(true)} className="px-6 py-3 bg-white text-[#382110] rounded-xl font-bold shadow-md hover:bg-gray-100 transition-colors flex items-center gap-2">
                       <FaPlus /> Add a Book
                    </button>
                </div>
            </div>
         </div>

         {/* Libraries List */}
         <div className="p-6 bg-primary-light/10 border-b border-white/5">
            <div className="flex overflow-x-auto gap-4 pb-2 custom-scrollbar">
               {loading ? <div className="text-text-muted">Loading libraries...</div> : 
                  stores.map(store => (
                     <motion.div
                       key={store.id}
                       onClick={() => setSelectedStore(store)}
                       className={`min-w-[200px] p-4 rounded-2xl cursor-pointer border transition-all
                          ${selectedStore?.id === store.id 
                             ? 'bg-secondary/20 border-secondary' 
                             : 'bg-primary-light/30 border-white/5 hover:border-white/20'}`}
                       whileHover={{ y: -2 }}
                     >
                        <div className="flex items-center gap-3 mb-3">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg
                              ${selectedStore?.id === store.id ? 'bg-secondary text-white' : 'bg-primary text-text-muted'}`}>
                              <FaFolder />
                           </div>
                           <div>
                              <h3 className="font-bold text-white truncate max-w-[120px]">{store.name}</h3>
                              <p className="text-xs text-text-muted">{store.offerIds?.length || 0} books</p>
                           </div>
                        </div>
                     </motion.div>
                  ))
               }
               {stores.length === 0 && !loading && <div className="text-text-muted italic">No libraries yet. Create one!</div>}
            </div>
         </div>

         {/* Books Grid */}
         <div className="flex-1 overflow-y-auto p-6 bg-primary">
            {selectedStore ? (
               <>
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-white">{selectedStore.name} <span className="text-text-muted text-sm font-normal">({storeOffers.length} items)</span></h2>
                     <button 
                       onClick={() => setShowAddBookModal(true)} 
                       className="px-4 py-2 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-colors text-white"
                     >
                        Add Book to Library
                     </button>
                  </div>
                  
                  {loadingOffers ? <div className="text-text-muted">Loading books...</div> : (
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {storeOffers.map(offer => (
                           <div key={offer.id} className="group relative rounded-xl overflow-hidden bg-primary-light/20 border border-white/5 hover:border-secondary/50 transition-all">
                              <div className="aspect-[2/3] relative">
                                 <img src={getImageSource(offer)} className="w-full h-full object-cover" />
                                 <div className="absolute top-2 right-2">
                                     <span className={`w-3 h-3 block rounded-full shadow-sm ${offer.visibility === 'public' ? 'bg-green-500' : 'bg-white/20'}`} />
                                 </div>
                                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button 
                                      onClick={() => handlePublishToggle(offer)}
                                      className="p-3 bg-white text-[#382110] rounded-full hover:scale-110 transition-transform shadow-lg"
                                      title={offer.visibility === 'public' ? "Unpublish" : "Publish"}
                                    >
                                       {offer.visibility === 'public' ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                    </button>
                                    <button 
                                      onClick={() => handleRemove(offer.id)}
                                      className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                                      title="Remove from Library"
                                    >
                                       <FaTrash size={18} />
                                    </button>
                                 </div>
                              </div>
                              <div className="p-3">
                                 <h3 className="text-white font-medium text-sm truncate">{offer.bookTitle}</h3>
                                 <p className="text-text-muted text-xs truncate">{offer.author}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
                  {storeOffers.length === 0 && !loadingOffers && <div className="text-text-muted text-center mt-10">Empty library. Add some books!</div>}
               </>
            ) : <div className="flex items-center justify-center h-full text-text-muted">Select a library to view books</div>}
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