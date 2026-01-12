/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/DiscoverScreen.tsx - STABLE & BEAUTIFUL DISCOVERY GRID
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaSearch, FaMapMarkerAlt, FaTimes, FaArrowLeft, FaFilter, 
  FaComments, FaHeart, FaBookmark, FaStore, FaFolder, FaLocationArrow 
} from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Offer = {
  id: number;
  bookTitle: string;
  author: string;
  type: "sell" | "exchange" | "buy";
  imageUrl: string | null;
  description?: string;
  price: number | null;
  condition?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhoto?: string;
  ownerBadges: string[];
  publishedAt?: string;
  latitude?: number;
  longitude?: number;
  distance?: string;
};

type Store = {
  id: number;
  name: string;
  ownerEmail: string;
  ownerName?: string;
  ownerPhoto?: string;
  created_at: string;
  visibility: "public" | "private";
  location?: string;
  offerIds?: number[];
  bookCount?: number;
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
  wishlist?: string[];
  toggleWishlist?: (title: string) => void;
};

// Haversine Distance Helper
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function DiscoverScreen({ currentUser, wishlist = [], toggleWishlist }: Props) {
  const navigate = useNavigate();
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [discoveryFeed, setDiscoveryFeed] = useState<Offer[]>([]);
  const [storeResults, setStoreResults] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showStores, setShowStores] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const getImageSource = (offer: any) => {
    const url = offer.imageUrl || offer.imageurl || offer.imageBase64;
    if (url) {
      if (typeof url === "string") {
        if (url.startsWith("http")) return url;
        if (url.startsWith("data:")) return url;
        return `data:image/jpeg;base64,${url}`;
      }
    }
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80";
  };

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/profile/${currentUser.email}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.latitude && data.longitude) {
          setUserLocation({ lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) });
        }
      }
    } catch (e) {
      console.error("Failed to fetch profile", e);
    }
  }, [currentUser]);

  // Fetch offers and stores
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch offers
      const response = await fetch(`${API_BASE}/offers?limit=300`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.offers || []);

      const uniqueEmails = [...new Set(raw.map((o: any) => o.owneremail || o.ownerEmail).filter(Boolean))];
      const profileCache: Record<string, { name: string; photo?: string; badges?: string[] }> = {};

      const calculateBadges = (offersPosted: number): string[] => {
        const badges: string[] = [];
        if (offersPosted >= 3) badges.push("Contributor");
        if (offersPosted >= 20) badges.push("Verified");
        return badges;
      };

      await Promise.all(
        uniqueEmails.map(async (email) => {
          try {
            const pResp = await fetch(`${API_BASE}/profile/${email}`, {
              headers: { Authorization: `Bearer ${currentUser.token}` }
            });
            if (pResp.ok) {
              const pData = await pResp.json();
              let badges: string[] = [];
              if (pData.badges) {
                badges = typeof pData.badges === "string" ? JSON.parse(pData.badges) : pData.badges;
              }
              if (!badges.length && pData.offersPosted) {
                badges = calculateBadges(pData.offersPosted);
              }
              profileCache[email as string] = {
                name: pData.name || "Neighbor",
                photo: pData.profilePhoto || pData.profilePhotoURL || pData.photo || pData.profileImageUrl,
                badges
              };
            }
          } catch (err) { console.error("Profile fetch error", err); }
        })
      );

      const processed: Offer[] = raw.map((o: any) => {
        const ownerEmail = o.owneremail || o.ownerEmail;
        return {
          id: o.id,
          bookTitle: o.booktitle || o.bookTitle || "Untitled",
          author: o.author || "Unknown",
          type: o.type || "sell",
          imageUrl: o.imageurl || o.imageUrl,
          description: o.description,
          price: o.price,
          condition: o.condition,
          ownerName: profileCache[ownerEmail]?.name || o.ownername || "Neighbor",
          ownerEmail: ownerEmail,
          ownerPhoto: profileCache[ownerEmail]?.photo || o.ownerphoto,
          ownerBadges: profileCache[ownerEmail]?.badges || [],
          publishedAt: o.publishedat || o.publishedAt,
          latitude: o.latitude,
          longitude: o.longitude
        };
      });

      setAllOffers(processed);
      setDiscoveryFeed([...processed].sort(() => Math.random() - 0.5));

      // 2. Fetch stores
      const storesResponse = await fetch(`${API_BASE}/public-stores?limit=100`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      if (storesResponse.ok) {
        const storesData = await storesResponse.json();
        const stores = storesData.stores || storesData || [];
        setAllStores(stores);
      }
    } catch (e) {
      console.error("Failed to fetch discovery data", e);
    } finally {
      setLoading(false);
    }
  }, [currentUser.token]);

  useEffect(() => {
    fetchProfile();
    fetchOffers();
  }, [fetchProfile, fetchOffers]);

  const isWishlisted = (title: string) => wishlist?.includes(title);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setDiscoveryFeed([...allOffers].sort(() => Math.random() - 0.5));
      setStoreResults([]);
      setShowStores(false);
      return;
    }

    setIsSearching(true);

    const storeMatches = allStores.filter(s => s.name?.toLowerCase().includes(q));
    setStoreResults(storeMatches);
    setShowStores(storeMatches.length > 0);

    const textMatches = allOffers.filter(o => 
      o.bookTitle?.toLowerCase().includes(q) || 
      o.author?.toLowerCase().includes(q) || 
      o.ownerName?.toLowerCase().includes(q)
    ).sort((a, b) => {
       const aTitle = a.bookTitle?.toLowerCase() || "";
       const bTitle = b.bookTitle?.toLowerCase() || "";
       if (aTitle === q) return -1;
       if (bTitle === q) return 1;
       if (aTitle.startsWith(q) && !bTitle.startsWith(q)) return -1;
       if (bTitle.startsWith(q) && !aTitle.startsWith(q)) return 1;
       return aTitle.length - bTitle.length;
    });

    if (textMatches.length > 0) {
      setDiscoveryFeed(textMatches);
      setIsSearching(false);
      return;
    }

    try {
      const gResp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
      const gData = await gResp.json();
      if (gData && gData.length > 0) {
        const tLat = parseFloat(gData[0].lat);
        const tLon = parseFloat(gData[0].lon);
        const withDist = allOffers.filter(o => o.latitude && o.longitude).map(o => ({
          ...o,
          distVal: getDistanceFromLatLonInKm(tLat, tLon, o.latitude!, o.longitude!)
        })).sort((a, b) => a.distVal - b.distVal);
        setDiscoveryFeed(withDist as any);
      } else {
        setDiscoveryFeed([]);
      }
    } catch (err) { 
      setDiscoveryFeed([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleContact = async (offer: Offer) => {
    try {
       const resp = await fetch(`${API_BASE}/chats?user=${encodeURIComponent(currentUser.email)}`, {
          headers: { "Authorization": `Bearer ${currentUser.token}` }
       });
       if (resp.ok) {
          const chats: any[] = await resp.json();
          const existingChat = chats.find((c: any) => 
             (c.user1 === offer.ownerEmail || c.user2 === offer.ownerEmail) && 
             (c.offer_id === offer.id)
          );
          if (existingChat) {
             navigate(`/chat/${existingChat.id}`, { state: { chat: existingChat } });
             return;
          }
       }
    } catch (e) { console.error("Error checking chats", e); }
    
    navigate(`/chat/new`, {
      state: {
        chat: {
          id: 0,
          user1: currentUser.email,
          user2: offer.ownerEmail,
          other_user_name: offer.ownerName || "Seller",
          offer_title: offer.bookTitle,
          offer_id: offer.id,
          ownerEmail: offer.ownerEmail
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] md:h-[calc(100vh-60px)] overflow-y-auto bg-[#faf8f5]">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#eee] px-4 py-3 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="text-[#382110] p-2 hover:bg-[#f4f1ea] rounded-full transition-colors md:hidden">
            <FaArrowLeft size={18} />
          </button>
          
          <form onSubmit={handleSearch} className="flex-1 relative group">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, stores, authors, users..."
              className="w-full bg-[#f4f4f4] border-none rounded-xl py-2 pl-10 pr-4 text-[#382110] text-sm focus:bg-white focus:ring-2 focus:ring-[#382110]/10 outline-none transition-all shadow-inner"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] group-focus-within:text-[#382110]">
              {isSearching ? <div className="w-4 h-4 border-2 border-[#382110] border-t-transparent rounded-full animate-spin" /> : <FaSearch size={14} />}
            </div>
          </form>

          <button onClick={() => {setSearchQuery(""); setDiscoveryFeed([...allOffers].sort(() => Math.random() - 0.5)); setShowStores(false);}} className="p-2 text-[#382110] hover:bg-[#f4f1ea] rounded-full">
            <FaFilter size={16} />
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-[1100px] mx-auto w-full p-4 md:p-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {showStores && storeResults.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xs font-bold text-[#382110] uppercase tracking-widest mb-4 border-b pb-2">Store Matches</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {storeResults.map((store) => (
                    <motion.div
                      key={store.id}
                      whileHover={{ y: -4 }}
                      onClick={() => navigate(`/store/${store.id}`, { state: { store } })}
                      className="bg-white rounded-xl border border-[#eee] p-4 cursor-pointer hover:shadow-md transition-all flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#382110] flex items-center justify-center flex-shrink-0">
                        <FaStore size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#382110] text-sm truncate">{store.name}</h3>
                        <div className="flex items-center gap-2 text-[10px] text-[#777] mt-1">
                          <FaFolder size={10} />
                          <span>{store.bookCount || store.offerIds?.length || 0} books</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-xs font-bold text-[#382110] uppercase tracking-widest mb-6 border-b pb-2 flex justify-between items-center">
              {searchQuery ? `Search results for "${searchQuery}"` : "Discover Gems Near You"}
              <span className="text-[10px] text-[#999] normal-case font-medium">{discoveryFeed.length} items</span>
            </h2>

            {discoveryFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                 <div className="w-16 h-16 bg-[#f4f1ea] rounded-full flex items-center justify-center text-[#382110] mb-4">
                    <FaSearch size={24} />
                 </div>
                 <h3 className="text-xl font-serif font-bold text-[#382110]">No matches found</h3>
                 <p className="text-[#777] text-sm mt-1 mb-8 max-w-xs mx-auto">Try searching for a different book, author or city.</p>
                 <button onClick={() => {setSearchQuery(""); setDiscoveryFeed([...allOffers].sort(() => Math.random() - 0.5));}} className="text-[#382110] text-xs font-bold uppercase underline">Clear Search</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {discoveryFeed.map((offer) => (
                  <motion.div 
                    key={offer.id}
                    whileHover={{ y: -4 }}
                    className="flex flex-col gap-2 group bg-white p-2.5 rounded-xl border border-[#ece9e4] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] transition-all duration-300"
                  >
                    <div 
                      onClick={() => setSelectedOffer(offer)}
                      className="w-full h-[200px] md:h-[220px] relative rounded-lg overflow-hidden bg-[#f8f6f3] cursor-pointer"
                    >
                      <img 
                        src={getImageSource(offer)} 
                        alt={offer.bookTitle}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-95" 
                      />
                      
                      <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                        <div className={`text-[9px] font-bold px-2 py-1 text-white shadow-sm rounded-md tracking-wider uppercase
                          ${offer.type === 'sell' ? 'bg-[#d37e2fcc] backdrop-blur-md' : offer.type === 'exchange' ? 'bg-[#00635dcc] backdrop-blur-md' : 'bg-[#764d91cc] backdrop-blur-md'}`}>
                          {offer.type}
                        </div>
                      </div>

                      {userLocation && offer.latitude && (
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1.5">
                          <FaLocationArrow size={8} /> 
                          {getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, offer.latitude, offer.longitude!).toFixed(1)} km
                        </div>
                      )}
                    </div>

                    <div className="px-1">
                      <h3 
                        onClick={() => setSelectedOffer(offer)}
                        className="font-serif font-bold text-[#2d2520] text-sm leading-tight cursor-pointer line-clamp-2 min-h-[32px] group-hover:text-[#8b4513] transition-colors mt-1"
                      >
                        {offer.bookTitle}
                      </h3>
                      <div className="text-[11px] text-[#777] mb-3 truncate">by {offer.author}</div>
                      
                      <div className="flex items-center gap-2 pt-2 border-t border-[#f4f4f4]">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-[#f4f1ea] border border-[#e5e5e5] flex-shrink-0">
                          {offer.ownerPhoto ? (
                            <img src={offer.ownerPhoto} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-[#382110]">
                              {offer.ownerName?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-[#444] truncate">{offer.ownerName.split(' ')[0]}</span>
                          {offer.ownerBadges.length > 0 && (
                            <span className="text-[8px] text-[#d37e2f] font-semibold truncate leading-none">
                              {offer.ownerBadges[offer.ownerBadges.length - 1]}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleWishlist?.(offer.bookTitle); }}
                          className={`text-sm transition-colors ${isWishlisted(offer.bookTitle) ? 'text-[#d37e2f]' : 'text-gray-300 hover:text-[#d37e2f]'}`}
                        >
                          <FaHeart />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <AnimatePresence>
         {selectedOffer && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
               onClick={() => setSelectedOffer(null)}
            >
               <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  className="bg-white rounded-2xl overflow-hidden w-full max-w-4xl max-h-[90vh] md:max-h-[600px] flex flex-col md:flex-row shadow-2xl relative"
                  onClick={e => e.stopPropagation()}
               >
                  <button onClick={() => setSelectedOffer(null)} className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full shadow-sm hover:bg-white transition-colors">
                     <FaTimes size={16} />
                  </button>

                  <div className="w-full md:w-1/2 bg-[#f4f1ea] flex items-center justify-center p-8 relative">
                     <img src={getImageSource(selectedOffer)} className="max-h-full max-w-full shadow-lg object-contain" />
                     <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded text-[10px] font-bold text-[#382110] shadow-sm uppercase tracking-widest">
                        {selectedOffer.type}
                     </div>
                  </div>

                  <div className="w-full md:w-1/2 p-8 flex flex-col bg-white overflow-y-auto">
                     <div className="mb-6">
                        <h2 className="font-serif font-bold text-3xl text-[#382110] mb-2 leading-tight">{selectedOffer.bookTitle}</h2>
                        <p className="text-lg text-[#555]">by <span className="font-bold underline decoration-[#382110]">{selectedOffer.author}</span></p>
                     </div>

                     <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#eee]">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#f4f1ea] border border-[#ddd] shadow-sm">
                           {selectedOffer.ownerPhoto ? <img src={selectedOffer.ownerPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg font-bold">{selectedOffer.ownerName?.charAt(0)}</div>}
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2">
                              <p className="text-base font-bold text-[#382110]">{selectedOffer.ownerName}</p>
                              {selectedOffer.ownerBadges.length > 0 && (
                                 <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#d37e2f]/20 text-[#d37e2f] border border-[#d37e2f]/30">
                                    {selectedOffer.ownerBadges[selectedOffer.ownerBadges.length - 1]}
                                 </span>
                              )}
                           </div>
                           <p className="text-xs text-[#999] mt-0.5">{selectedOffer.publishedAt ? `Listed on ${new Date(selectedOffer.publishedAt).toLocaleDateString()}` : "Active Library Member"}</p>
                        </div>
                     </div>

                     <div className="flex-1 mb-6">
                        <div className="flex gap-2 mb-4">
                           <span className="px-2 py-1 bg-[#f4f1ea] text-[#382110] text-[10px] font-bold rounded-md uppercase tracking-widest">{selectedOffer.condition || "Good Condition"}</span>
                        </div>
                        <p className="text-[#444] leading-relaxed font-serif">{selectedOffer.description || "No description provided. Contact the neighbor for details."}</p>
                     </div>

                     <div className="mt-auto pt-6 border-t border-[#eee]">
                        <div className="flex items-end justify-between mb-6">
                           <span className="text-[10px] uppercase text-[#999] font-bold tracking-widest">Preference</span>
                           <span className="text-3xl font-serif font-bold text-[#d37e2f]">
                              {selectedOffer.price ? `PKR ${selectedOffer.price}` : selectedOffer.type === 'exchange' ? 'Trade' : 'ISO'}
                           </span>
                        </div>
                        
                        {selectedOffer.ownerEmail === currentUser.email ? (
                           <div className="w-full bg-[#f4f1ea] border border-[#d8d8d8] text-[#382110] font-bold py-3 px-4 rounded-xl text-center">
                              📚 This is your listing
                           </div>
                        ) : (
                           <div className="flex gap-2">
                              <button 
                                 onClick={() => handleContact(selectedOffer)}
                                 className="flex-1 bg-[#409d69] hover:bg-[#358759] text-white font-bold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                              >
                                 <FaComments /> Contact Neighbor
                              </button>
                              <button 
                                 onClick={() => toggleWishlist?.(selectedOffer.bookTitle)}
                                 className={`p-3.5 rounded-xl border transition-all active:scale-90
                                    ${isWishlisted(selectedOffer.bookTitle) ? 'bg-[#d37e2f] text-white border-[#d37e2f]' : 'bg-white text-[#382110] border-[#d8d8d8]'}`}
                              >
                                 <FaHeart />
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}