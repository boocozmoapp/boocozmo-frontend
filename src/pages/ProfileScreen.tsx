/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ProfileScreen.tsx - PREMIUM THEME
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaEdit, FaCamera, FaBook, FaDollarSign, FaExchangeAlt, FaTag, 
  FaTrash, FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaFolder, 
  FaChartLine, FaCheck, FaTimes, FaHome, FaMapMarkedAlt, 
  FaBookOpen, FaCompass, FaBookmark, FaUsers, FaComments, 
  FaBell, FaStar, FaCog, FaBars,
  FaEye,
  FaEyeSlash
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
  state?: "open" | "draft" | "private" | "closed";
  visibility?: "public" | "private";
  publishedAt?: string;
};

type Store = {
  id: number;
  name: string;
  ownerEmail: string;
  created_at: string;
  visibility: "public" | "private";
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
  badges?: string[];
};

type Props = {
  currentUser: { email: string; name: string; token: string };
  wishlist?: string[];
  toggleWishlist?: (title: string) => void;
  onAddPress?: () => void;
  onMapPress?: () => void;
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

export default function ProfileScreen({ currentUser, wishlist = [], toggleWishlist, onAddPress, onMapPress }: Props) {
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

  const [activeTab, setActiveTab] = useState<"offers" | "libraries" | "wishlist" | "stats">("offers");
  const [filterType, setFilterType] = useState<"all" | "public" | "private">("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Publish Modal State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [bookToPublish, setBookToPublish] = useState<Offer | null>(null);
  const [publishForm, setPublishForm] = useState({
    type: "sell" as "sell" | "exchange",
    price: "",
    exchangeBook: "",
    latitude: 40.7128,
    longitude: -74.0060,
  });
  const [publishing, setPublishing] = useState(false);
  const [wishlistInput, setWishlistInput] = useState("");

  const handleAutoDetect = () => {
     if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
           setPublishForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        });
     } else { alert("Geolocation not supported"); }
  };

  // Track if initial fetch has been done
  const hasFetchedRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/profile/${currentUser.email}`, { headers: { "Authorization": `Bearer ${currentUser.token}` } });
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setProfile({
        ...data,
        badges: data.badges || []
      });
      setEditForm({ profilePhotoFile: null, profilePhotoPreview: data.profilePhoto || "", bio: data.bio || "", location: data.location || "" });
    } catch {
       setProfile({ name: currentUser.name, profilePhoto: null, bio: "No bio yet", location: "Unknown", joinedAt: new Date().toISOString(), offersPosted: 0, dealsCompleted: 0, badges: [] });
    } finally { setLoadingProfile(false); }
  }, [currentUser.email, currentUser.token, currentUser.name]);

  const fetchMyOffers = useCallback(async () => {
    setLoadingOffers(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/my-offers`, { headers: { "Authorization": `Bearer ${currentUser.token}` } });
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setMyOffers((Array.isArray(data.offers) ? data.offers : []).filter((o: any) => o.state === 'open'));
    } catch { setMyOffers([]); } finally { setLoadingOffers(false); }
  }, [currentUser.token]);

  const fetchStores = useCallback(async () => {
    setLoadingStores(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE}/stores?includeOffers=false`, { headers: { "Authorization": `Bearer ${currentUser.token}` } });
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      // Filter to only show user's stores
      const userStores = (Array.isArray(data) ? data : []).filter((s: Store) => s.ownerEmail === currentUser.email);
      setStores(userStores);
    } catch { setStores([]); } finally { setLoadingStores(false); }
  }, [currentUser.token, currentUser.email]);

  // Initial fetch - only once
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    
    fetchProfile();
    fetchMyOffers();
    fetchStores();
  }, [fetchProfile, fetchMyOffers, fetchStores]);

  // Recalculate badges when offers or stores change
  useEffect(() => {
    const offersCount = myOffers.length;
    const publicLibrariesCount = stores.filter(s => (s as any).visibility === 'public').length;
    
    const badges: string[] = [];
    if (offersCount >= 3) badges.push("Contributor");
    if (publicLibrariesCount >= 1) badges.push("Librarian");
    if (offersCount >= 20) badges.push("Verified");
    
    setProfile(prev => {
      if (!prev) return prev;
      const currentBadges = prev.badges || [];
      if (JSON.stringify([...badges].sort()) !== JSON.stringify([...currentBadges].sort())) {
        return { ...prev, badges };
      }
      return prev;
    });
  }, [myOffers.length, stores.length]);

  const handleUpdateProfile = async () => {
    setEditingProfile(true);
    try {
       let photoBase64 = null;
       if (editForm.profilePhotoFile) {
          const reader = new FileReader();
          photoBase64 = await new Promise((resolve) => { reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(editForm.profilePhotoFile!); });
       }
       const payload: any = { bio: editForm.bio.trim() || null, location: editForm.location.trim() || null };
       if (photoBase64) payload.profilePhoto = photoBase64;
       
       await fetchWithTimeout(`${API_BASE}/update-profile`, {
          method: 'PATCH', headers: { 'Authorization': `Bearer ${currentUser.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
       });
       await fetchProfile();
       setShowEditModal(false);
    } catch (e) { alert("Failed update"); } finally { setEditingProfile(false); }
  };

  const handlePublishToggle = async (offer: Offer) => {
     const isPublic = offer.visibility === 'public';
     if (isPublic) {
        if(!confirm("Unpublish this offer?")) return;
        try {
           await fetchWithTimeout(`${API_BASE}/unpublish-offer/${offer.id}`, {
              method: 'POST', headers: { 'Authorization': `Bearer ${currentUser.token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({})
           });
           await fetchMyOffers();
        } catch (e) { alert("Failed to unpublish"); }
     } else {
        // Open Modal to Publish
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

  const handlePublishConfirm = async () => {
     if (!bookToPublish) return;
     setPublishing(true);
     try {
        const body = {
           type: publishForm.type,
           price: publishForm.type === 'sell' ? Number(publishForm.price) : null,
           exchangeBook: publishForm.type === 'exchange' ? publishForm.exchangeBook : null,
           latitude: publishForm.latitude, 
           longitude: publishForm.longitude
        };
        
        await fetchWithTimeout(`${API_BASE}/publish-offer/${bookToPublish.id}`, {
           method: 'POST', headers: { 'Authorization': `Bearer ${currentUser.token}`, 'Content-Type': 'application/json' },
           body: JSON.stringify(body)
        });
        await fetchMyOffers();
        setShowPublishModal(false);
        setBookToPublish(null);
     } catch (e) { alert("Failed to publish"); }
     finally { setPublishing(false); }
  };

  const handleDeleteOffer = async (id: number) => {
     if(!confirm("Delete?")) return;
     try {
        const res = await fetchWithTimeout(`${API_BASE}/delete-offer/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${currentUser.token}` } });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Server Error");
        }
        await fetchMyOffers();
     } catch(e: any) { 
        console.error(e);
        const msg = e.message === "Failed to delete offer" 
           ? "Cannot delete book with active chats. Please go to the Chat and 'Close Deal' instead." 
           : e.message;
        alert(`Deletion Failed: ${msg}`); 
     }
  };

  const viralStats = useMemo(() => ({
    treesSaved: (profile?.dealsCompleted || 0) * 0.45 + (myOffers.length * 0.12),
    moneySaved: (profile?.dealsCompleted || 0) * 18 + (myOffers.length * 4),
    honorLevel: (profile?.dealsCompleted || 0) > 10 ? "Community Pillar" : (profile?.dealsCompleted || 0) > 3 ? "Trusted Neighbor" : "Eco Explorer",
    honorStars: Math.min(5, Math.floor((profile?.dealsCompleted || 0) / 2) + 1)
  }), [profile, myOffers]);

  const filteredOffers = useMemo(() => {
    // Deduplicate by bookTitle and author - show all books, no filtering
    const uniqueMap = new Map<string, Offer>();
    
    myOffers.forEach(o => {
       const key = `${o.bookTitle?.toLowerCase() || ''}-${o.author?.toLowerCase() || ''}`;
       const existing = uniqueMap.get(key);
       
       // If public version exists, keep it. If current is public, overwrite.
       if (!existing || o.visibility === 'public') {
          uniqueMap.set(key, o);
       }
    });

    return Array.from(uniqueMap.values());
  }, [myOffers]);

  const getImageSource = (offer: Offer) => {
    if (offer.imageUrl) return offer.imageUrl;
    if (offer.imageBase64) return offer.imageBase64.startsWith('data:') ? offer.imageBase64 : `data:image/jpeg;base64,${offer.imageBase64}`;
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80";
  };

  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress || (() => navigate("/map")) },
    { icon: FaBookOpen, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBookmark, label: "Saved", onClick: () => navigate("/saved") },
    { icon: FaUsers, label: "Following", onClick: () => {} },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
  ];

  return (
    <div className="h-[calc(100vh-50px)] md:h-[calc(100vh-60px)] w-full bg-primary text-text-main flex overflow-hidden font-sans">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden" />}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className="hidden md:flex flex-col bg-primary-light/80 backdrop-blur-xl border-r border-white/5 z-50 overflow-hidden"
      >
        <div className="p-6 flex items-center gap-3 mb-6">
           <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white text-xl font-bold font-serif">B</div>
           {sidebarOpen && <span className="font-serif font-bold text-xl text-white">Boocozmo</span>}
        </div>
        <nav className="flex-1 px-4 space-y-2">
           {navItems.map(item => (
              <button key={item.label} onClick={item.onClick} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
                 <item.icon size={20} />
                 {sidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              </button>
           ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-primary via-primary-light/20 to-primary relative overflow-hidden">
         {/* Background Elements */}
         <div className="absolute -top-40 -right-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
         <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

         <header className="h-20 px-6 flex items-center justify-between border-b border-white/5 bg-primary/80 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="p-2 text-white hover:text-secondary"><FaArrowLeft /></button>
               <h1 className="text-2xl font-serif font-bold text-white">Profile</h1>
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 text-white"><FaBars /></button>
         </header>

         <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
               {/* Profile Card */}
               <div className="bg-primary-light/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative">
                     <div className="w-32 h-32 rounded-full border-4 border-secondary/30 overflow-hidden shadow-2xl">
                        {profile?.profilePhoto ? 
                           <img src={profile.profilePhoto} className="w-full h-full object-cover" /> : 
                           <div className="w-full h-full bg-primary flex items-center justify-center text-4xl font-bold text-secondary">{currentUser.name.charAt(0)}</div>
                        }
                     </div>
                     <button 
                        onClick={() => setShowEditModal(true)}
                        className="absolute bottom-0 right-0 p-2 bg-secondary text-white rounded-full shadow-lg hover:bg-secondary-hover transition-colors"
                     >
                        <FaCamera size={14} />
                     </button>
                  </div>

                  <div className="flex-1 text-center md:text-left z-10">
                     <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap mb-2">
                        <h2 className="text-3xl font-serif font-bold text-white">{profile?.name}</h2>
                        {profile?.badges && Array.isArray(profile.badges) && profile.badges.length > 0 && (
                           <div className="flex items-center gap-2 flex-wrap">
                              {profile.badges.map((badge, idx) => (
                                 <span key={idx} className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#d37e2f]/20 text-[#d37e2f] border border-[#d37e2f]/30 whitespace-nowrap">
                                    {badge}
                                 </span>
                              ))}
                           </div>
                        )}
                     </div>
                     <p className="text-text-muted mb-4 max-w-lg mx-auto md:mx-0">{profile?.bio || "No bio yet."}</p>
                     
                     <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400 mb-6">
                        <span className="flex items-center gap-1"><FaMapMarkerAlt /> {profile?.location || "Unknown"}</span>
                        <span className="flex items-center gap-1"><FaCalendarAlt /> Joined {new Date(profile?.joinedAt || Date.now()).toLocaleDateString()}</span>
                     </div>
                     
                     <div className="flex justify-center md:justify-start gap-6">
                        <div className="text-center">
                           <div className="text-2xl font-bold text-white">{profile?.offersPosted || 0}</div>
                           <div className="text-xs text-secondary uppercase tracking-wider">Books</div>
                        </div>
                        <div className="text-center">
                           <div className="text-2xl font-bold text-white">{profile?.dealsCompleted || 0}</div>
                           <div className="text-xs text-secondary uppercase tracking-wider">Deals</div>
                        </div>
                     </div>
                  </div>
                  
                  <button onClick={() => setShowEditModal(true)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><FaEdit size={20} /></button>
               </div>

               {/* Tabs */}
               <div className="flex gap-4 border-b border-white/5 pb-1">
                  {['offers', 'libraries', 'wishlist', 'stats'].map((t: any) => (
                     <button 
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={`pb-3 px-4 text-sm font-bold capitalize transition-colors border-b-2 
                           ${activeTab === t ? 'text-secondary border-secondary' : 'text-gray-500 border-transparent hover:text-white'}`}
                     >
                        {t}
                     </button>
                  ))}
               </div>

               {/* Tab Content */}
               <div className="min-h-[300px]">
                  {activeTab === 'offers' && (
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {filteredOffers.map(offer => (
                              <div key={offer.id} className="bg-primary-light/10 border border-white/5 rounded-2xl p-4 hover:border-white/20 transition-all group">
                                 <div className="flex gap-4">
                                    <div className="w-20 h-28 flex-shrink-0 bg-black rounded-lg overflow-hidden relative">
                                       <img src={getImageSource(offer)} className="w-full h-full object-cover" />
                                       {offer.visibility === 'public' && (
                                          <div className="absolute top-1 right-1">
                                             <span className="text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm text-white bg-[#d37e2f]">
                                                QUEUED
                                             </span>
                                          </div>
                                       )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <div className="flex justify-between items-start mb-1">
                                          <h3 className="font-bold text-white truncate pr-2">{offer.bookTitle}</h3>
                                       </div>
                                       <p className="text-xs text-gray-500 mb-3">{offer.author}</p>
                                       <div className="flex gap-2 mt-auto">
                                          <button 
                                             onClick={() => handlePublishToggle(offer)} 
                                             className="p-2 rounded-full bg-white text-[#382110] hover:scale-110 transition-transform shadow-md"
                                             title={offer.visibility === 'public' ? "Unpublish" : "Publish"}
                                          >
                                             {offer.visibility === 'public' ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                                          </button>
                                          <button 
                                             onClick={() => handleDeleteOffer(offer.id)} 
                                             className="p-2 rounded-full bg-red-500 text-white hover:scale-110 transition-transform shadow-md"
                                             title="Delete Offer"
                                          >
                                             <FaTrash size={14} />
                                          </button>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
                  {activeTab === 'libraries' && (
                     <div className="space-y-6">
                        {loadingStores ? (
                           <div className="text-center py-20">
                              <div className="w-16 h-16 bg-primary-light/20 rounded-full flex items-center justify-center text-white/10 mx-auto mb-4">
                                 <FaFolder size={24} />
                              </div>
                              <p className="text-gray-500 text-sm">Loading libraries...</p>
                           </div>
                        ) : stores.length === 0 ? (
                           <div className="text-center py-20 flex flex-col items-center">
                              <div className="w-16 h-16 bg-primary-light/20 rounded-full flex items-center justify-center text-white/10 mb-6">
                                 <FaFolder size={30} />
                              </div>
                              <h3 className="text-xl font-serif font-bold text-white mb-2">No Collections Yet</h3>
                              <p className="text-gray-500 text-xs max-w-xs leading-relaxed mb-6">Create your first collection to organize your books.</p>
                              <button 
                                 onClick={() => navigate("/my-library")}
                                 className="px-8 py-3 bg-secondary text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                              >
                                 Go to My Library
                              </button>
                           </div>
                        ) : (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {stores.map(store => (
                                 <div key={store.id} className="bg-primary-light/10 border border-white/5 rounded-2xl p-6 hover:border-white/20 transition-all group cursor-pointer" onClick={() => navigate("/my-library")}>
                                    <div className="flex items-center gap-4 mb-4">
                                       <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                                          <FaFolder size={20} />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <h3 className="font-bold text-white truncate mb-1">{store.name}</h3>
                                          <p className="text-xs text-gray-500">{store.offerIds?.length || 0} {store.offerIds?.length === 1 ? 'book' : 'books'}</p>
                                       </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                       <span>{new Date(store.created_at).toLocaleDateString()}</span>
                                       <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                          store.visibility === 'public' 
                                             ? 'bg-[#00635d]/20 text-[#00635d]' 
                                             : 'bg-white/5 text-gray-500'
                                       }`}>
                                          {store.visibility === 'public' ? 'PUBLIC' : 'PRIVATE'}
                                       </span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  )}
                  {activeTab === 'wishlist' && (
                     <div className="space-y-6">
                        <div className="flex gap-2">
                           <input 
                              value={wishlistInput}
                              onChange={e => setWishlistInput(e.target.value)}
                              placeholder="Add book title to hunting list..."
                              className="flex-1 bg-primary-light/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-secondary transition-colors"
                           />
                           <button 
                              onClick={() => {
                                 if(wishlistInput.trim()) {
                                    toggleWishlist?.(wishlistInput.trim());
                                    setWishlistInput("");
                                 }
                              }}
                              className="bg-secondary text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                           >
                              Add
                           </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {wishlist.length === 0 ? (
                              <div className="col-span-full py-20 text-center flex flex-col items-center">
                                 <div className="w-20 h-20 bg-primary-light/20 rounded-full flex items-center justify-center text-white/10 mb-6"><FaBookmark size={30}/></div>
                                 <h3 className="text-xl font-serif font-bold text-white mb-2">Shelf Anticipation</h3>
                                 <p className="text-gray-500 text-xs max-w-xs leading-relaxed">Add books you're hunting for, and we'll ignite a notification the second a neighbor lists them.</p>
                              </div>
                           ) : (
                              wishlist.map((title, idx) => (
                                 <div key={idx} className="bg-primary-light/10 border border-white/5 rounded-xl p-5 flex items-center justify-between group hover:bg-primary-light/20 transition-all">
                                    <div className="flex items-center gap-4">
                                       <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary font-serif font-bold text-xs">{idx + 1}</div>
                                       <span className="font-bold text-white text-sm">{title}</span>
                                    </div>
                                    <button onClick={() => toggleWishlist?.(title)} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><FaTrash size={14}/></button>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  )}
                  {activeTab === 'stats' && (
                     <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="bg-gradient-to-br from-[#00635d] to-[#004a46] p-8 rounded-3xl shadow-xl relative overflow-hidden group border border-white/5">
                              <FaBook className="absolute -right-6 -bottom-6 text-[120px] text-white/5 group-hover:rotate-12 transition-transform duration-1000" />
                              <div className="relative z-10">
                                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl"><FaChartLine size={24}/></div>
                                 <h3 className="text-2xl font-serif font-bold text-white mb-2">Eco Spotlight</h3>
                                 <p className="text-white/60 text-xs leading-relaxed mb-6 max-w-xs">By circulating artifacts instead of buying new, you're preserving our common soil.</p>
                                 <div className="flex items-end gap-2 mb-2">
                                    <span className="text-4xl font-black text-white">{viralStats.treesSaved.toFixed(1)}</span>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1.5">Trees Saved</span>
                                 </div>
                                 <div className="flex items-end gap-2">
                                    <span className="text-2xl font-black text-white">PKR {viralStats.moneySaved.toFixed(0)}</span>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">Capital Retained</span>
                                 </div>
                              </div>
                           </div>

                           <div className="bg-gradient-to-br from-secondary to-[#b56b25] p-8 rounded-3xl shadow-xl relative overflow-hidden group border border-white/5">
                              <FaUsers className="absolute -right-6 -bottom-6 text-[120px] text-white/5 group-hover:scale-110 transition-transform duration-1000" />
                              <div className="relative z-10">
                                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl"><FaStar size={24}/></div>
                                 <h3 className="text-2xl font-serif font-bold text-white mb-2">Honor Ledger</h3>
                                 <p className="text-white/60 text-xs leading-relaxed mb-6 max-w-xs">Your standing in the Boocozmo circle. Higher honor unlocks neighborhood perks.</p>
                                 <div className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 rounded-xl mb-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{viralStats.honorLevel}</span>
                                 </div>
                                 <div className="flex gap-1.5">
                                    {[...Array(5)].map((_, i) => (
                                       <FaStar key={i} className={`text-lg ${i < viralStats.honorStars ? "text-white" : "text-white/10"}`} />
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-primary-light/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 group">
                           <div className="flex items-center gap-6">
                              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:rotate-[360deg] transition-transform duration-1000"><FaBookOpen size={24}/></div>
                              <div>
                                 <h4 className="text-xl font-serif font-bold text-white mb-1">Ignite the Wildfire</h4>
                                 <p className="text-xs text-text-muted uppercase tracking-widest">Share your impact card to inspire neighbors</p>
                              </div>
                           </div>
                           <button className="whitespace-nowrap px-8 py-4 bg-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Generate Social Card</button>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </main>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
         {showEditModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
               <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-primary border border-white/10 rounded-2xl p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold text-white mb-6">Edit Profile</h3>
                  
                  <div className="flex justify-center mb-6">
                     <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-white/20 hover:border-secondary cursor-pointer"
                        onClick={() => photoInputRef.current?.click()}>
                        {editForm.profilePhotoPreview ? <img src={editForm.profilePhotoPreview} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500"><FaCamera /></div>}
                        <input ref={photoInputRef} type="file" hidden accept="image/*" onChange={(e: any) => {
                           const file = e.target.files[0];
                           if(file) {
                              const r = new FileReader();
                              r.onload = () => setEditForm({...editForm, profilePhotoFile: file, profilePhotoPreview: r.result as string});
                              r.readAsDataURL(file);
                           }
                        }} />
                     </div>
                  </div>

                  <input value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} placeholder="Bio" className="w-full bg-primary-light/50 border border-white/10 rounded-xl p-3 text-white mb-3" />
                  <input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} placeholder="Location" className="w-full bg-primary-light/50 border border-white/10 rounded-xl p-3 text-white mb-6" />

                  <div className="flex justify-end gap-3">
                     <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">Cancel</button>
                     <button onClick={handleUpdateProfile} disabled={editingProfile} className="px-4 py-2 bg-secondary text-white rounded-xl font-medium">Save</button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
      {/* Publish Modal */}
      <AnimatePresence>
          {showPublishModal && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-primary border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <h3 className="text-xl font-bold text-white mb-2">Publish "{bookToPublish?.bookTitle}"</h3>
                    <p className="text-text-muted text-sm mb-4">Set visibility details and location.</p>

                    <div className="flex gap-4 mb-4">
                       <button onClick={() => setPublishForm({...publishForm, type: "sell"})} className={`flex-1 py-2 rounded-lg border ${publishForm.type === "sell" ? "bg-secondary border-secondary text-white" : "border-white/10 text-text-muted"}`}>Sell</button>
                       <button onClick={() => setPublishForm({...publishForm, type: "exchange"})} className={`flex-1 py-2 rounded-lg border ${publishForm.type === "exchange" ? "bg-secondary border-secondary text-white" : "border-white/10 text-text-muted"}`}>Exchange</button>
                    </div>

                    {publishForm.type === "sell" && (
                       <input type="number" value={publishForm.price} onChange={e => setPublishForm({...publishForm, price: e.target.value})} placeholder="Price (PKR)" className="w-full bg-primary-light/50 border border-white/10 rounded-xl p-3 text-white mb-3" />
                    )}
                    {publishForm.type === "exchange" && (
                       <input value={publishForm.exchangeBook} onChange={e => setPublishForm({...publishForm, exchangeBook: e.target.value})} placeholder="Trading for (e.g. Sci-Fi)" className="w-full bg-primary-light/50 border border-white/10 rounded-xl p-3 text-white mb-3" />
                    )}

                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                           <label className="text-xs font-bold uppercase text-text-muted">Confirm Location</label>
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
                       <button onClick={handlePublishConfirm} disabled={publishing} className="px-4 py-2 bg-secondary text-white rounded-xl font-medium">
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