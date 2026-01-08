/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaMapMarkerAlt, FaTimes, FaArrowLeft, FaFilter, FaComments, FaHeart, FaBookmark, FaRegHeart } from "react-icons/fa";

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
  ownerName?: string;
  ownerEmail?: string;
  ownerPhoto?: string;
  publishedAt?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
  wishlist?: string[];
  toggleWishlist?: (title: string) => void;
};

// Haversine Distance Helper
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2-lat1) * (Math.PI/180);
  const dLon = (lon2-lon1) * (Math.PI/180); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1*(Math.PI/180)) * Math.cos(lat2*(Math.PI/180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

export default function DiscoverScreen({ currentUser, wishlist = [], toggleWishlist }: Props) {
  const navigate = useNavigate();
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [discoveryFeed, setDiscoveryFeed] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // Fetch offers and profiles
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/offers?limit=300`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });
      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.offers || []);
      
      const uniqueEmails = [...new Set(raw.map((o: any) => o.ownerEmail).filter(Boolean))];
      const profileCache: Record<string, { name: string; photo?: string }> = {};

      await Promise.all(
         uniqueEmails.map(async (email) => {
            try {
               const pResp = await fetch(`${API_BASE}/profile/${email}`, {
                  headers: { "Authorization": `Bearer ${currentUser.token}` }
               });
               if (pResp.ok) {
                  const pData = await pResp.json();
                  profileCache[email as string] = { 
                     name: pData.name || "Neighbor", 
                     photo: pData.profilePhotoURL || pData.photo || pData.profileImageUrl 
                  };
               }
            } catch (err) { console.error("Profile fetch error", err); }
         })
      );

      const processed: Offer[] = raw.map((o: any) => ({
        ...o,
        ownerName: profileCache[o.ownerEmail]?.name || "Neighbor",
        ownerPhoto: profileCache[o.ownerEmail]?.photo
      }));

      setAllOffers(processed);
      mixDiscovery(processed);
    } catch (e) {
      console.error("Failed to fetch discovery data", e);
    } finally {
      setLoading(false);
    }
  }, [currentUser.token]);

  const mixDiscovery = useCallback((offersList: Offer[]) => {
    const shuffled = [...offersList].sort(() => Math.random() - 0.5);
    setDiscoveryFeed(shuffled);
  }, []);

  const isWishlisted = (title: string) => wishlist?.includes(title);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      mixDiscovery(allOffers);
      return;
    }

    setIsSearching(true);

    // 1. Prioritize Text Search (Title, Author, Username)
    const textMatches = allOffers.filter(o => 
      o.bookTitle?.toLowerCase().includes(q) || 
      o.author?.toLowerCase().includes(q) || 
      o.ownerName?.toLowerCase().includes(q)
    ).sort((a, b) => {
       // Simple relevance sorting:
       const aTitle = a.bookTitle?.toLowerCase() || "";
       const bTitle = b.bookTitle?.toLowerCase() || "";
       
       if (aTitle === q) return -1;
       if (bTitle === q) return 1;

       const aStarts = aTitle.startsWith(q) ? 1 : 0;
       const bStarts = bTitle.startsWith(q) ? 1 : 0;
       if (aStarts !== bStarts) return bStarts - aStarts;

       return aTitle.length - bTitle.length;
    });

    if (textMatches.length > 0) {
      setDiscoveryFeed(textMatches);
      setIsSearching(false);
      return;
    }

    // 2. Fallback: Geocoding (Location Search) only if no text hits
    try {
      const gResp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
      const gData = await gResp.json();
      
      if (gData && gData.length > 0) {
        const targetLat = parseFloat(gData[0].lat);
        const targetLon = parseFloat(gData[0].lon);
        
        const withDist = allOffers.filter(o => o.latitude && o.longitude).map(o => ({
          ...o,
          distance: getDistanceFromLatLonInKm(targetLat, targetLon, o.latitude!, o.longitude!)
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        setDiscoveryFeed(withDist);
      } else {
        setDiscoveryFeed([]);
      }
    } catch (err) { 
      console.error("Geocoding failed", err);
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
          targetEmail: offer.ownerEmail, 
          targetName: offer.ownerName,
          offerId: offer.id,
          offerTitle: offer.bookTitle
       } 
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-[#eee] px-4 py-3 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="text-[#382110] p-2 hover:bg-[#f4f1ea] rounded-full transition-colors md:hidden">
            <FaArrowLeft size={18} />
          </button>
          
          <form onSubmit={handleSearch} className="flex-1 relative group">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, user or city..."
              className="w-full bg-[#f4f4f4] border-none rounded-xl py-2 pl-10 pr-4 text-[#382110] text-sm focus:bg-white focus:ring-2 focus:ring-[#382110]/10 outline-none transition-all"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] group-focus-within:text-[#382110]">
              {isSearching ? <div className="w-4 h-4 border-2 border-[#382110] border-t-transparent rounded-full animate-spin" /> : <FaSearch size={14} />}
            </div>
          </form>

          <button onClick={() => {setSearchQuery(""); mixDiscovery(allOffers);}} className="p-2 text-[#382110] hover:bg-[#f4f1ea] rounded-full" title="Shuffle Feed">
            <FaFilter size={16} />
          </button>
        </div>
      </div>

      {/* Discovery Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-1 md:p-6">
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-4">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-md" />
            ))}
          </div>
        ) : discoveryFeed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
             <div className="w-16 h-16 bg-[#f4f1ea] rounded-full flex items-center justify-center text-[#382110] mb-4">
                <FaSearch size={24} />
             </div>
             <h3 className="text-xl font-serif font-bold text-[#382110]">Nothing found nearby</h3>
             <p className="text-[#777] text-sm mt-1 mb-8">We couldn't find matches for this search. Add it to your wishlist and we'll notify you when it appears!</p>
             
             {searchQuery.trim() && (
               <button 
                  onClick={() => {
                    toggleWishlist?.(searchQuery);
                    alert(`"${searchQuery}" added to wishlist!`);
                  }}
                  className="px-8 py-3 bg-[#382110] text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-xl flex items-center gap-2"
               >
                  <FaBookmark /> Track "{searchQuery}"
               </button>
             )}
             
             <button onClick={() => {setSearchQuery(""); mixDiscovery(allOffers);}} className="mt-4 text-[#382110] text-xs font-bold uppercase opacity-50 underline">Refresh Discovery</button>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-4">
            {discoveryFeed.map((offer, idx) => (
              <motion.div 
                key={`${offer.id}-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="group relative cursor-pointer aspect-square bg-[#f9f9f9] overflow-hidden rounded-lg shadow-sm"
                onClick={() => setSelectedOffer(offer)}
              >
                <img 
                  src={offer.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={offer.bookTitle}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Wishlist toggle on card */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist?.(offer.bookTitle);
                  }}
                  className={`absolute top-2 right-2 p-1.5 rounded-full shadow-lg transition-all
                    ${isWishlisted(offer.bookTitle) ? 'bg-[#d37e2f] text-white' : 'bg-white text-[#382110] opacity-0 group-hover:opacity-100'}`}
                >
                  <FaHeart size={12} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Offer Detail Modal (Instagram-style) */}
      <AnimatePresence>
         {selectedOffer && (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
               onClick={() => setSelectedOffer(null)}
            >
               <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-lg overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row shadow-2xl"
                  onClick={e => e.stopPropagation()}
               >
                  {/* Left: Image */}
                  <div className="w-full md:w-1/2 bg-[#f4f1ea] flex items-center justify-center p-6 relative">
                     <img src={selectedOffer.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"} className="max-h-full max-w-full shadow-lg object-contain" />
                     <button onClick={() => setSelectedOffer(null)} className="absolute top-4 left-4 text-[#382110] p-1 bg-white/50 rounded-full md:hidden"><FaTimes /></button>
                  </div>

                  {/* Right: Details */}
                  <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-white overflow-y-auto">
                     <div className="mb-6 flex justify-between items-start">
                        <div>
                           <h2 className="font-serif font-bold text-2xl md:text-3xl text-[#382110] mb-1">{selectedOffer.bookTitle}</h2>
                           <p className="text-lg text-[#555]">by <span className="font-bold underline">{selectedOffer.author}</span></p>
                        </div>
                        <button onClick={() => setSelectedOffer(null)} className="hidden md:block text-[#999] hover:text-[#382110]"><FaTimes size={20} /></button>
                     </div>

                     <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#eee]">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#f4f1ea] border border-[#ddd]">
                           {selectedOffer.ownerPhoto ? <img src={selectedOffer.ownerPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm font-bold">{selectedOffer.ownerName?.charAt(0)}</div>}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-[#382110]">{selectedOffer.ownerName || "Community Member"}</p>
                           <div className="flex items-center text-xs text-[#999]">
                              <FaMapMarkerAlt className="mr-1" />
                              {selectedOffer.distance ? `${Math.round(selectedOffer.distance)} km away` : "Nearby"}
                           </div>
                        </div>
                     </div>

                     <div className="flex-1 mb-6">
                        <p className="font-serif italic text-sm text-[#5c4a3c] mb-2 uppercase tracking-widest">{selectedOffer.condition || 'Good Condition'}</p>
                        <p className="text-[#333] leading-relaxed line-clamp-6">{selectedOffer.description || "No description provided."}</p>
                     </div>

                     <div className="mt-auto pt-6 border-t border-[#eee]">
                        <div className="flex items-end justify-between mb-6">
                           <span className="text-xs uppercase text-[#999] font-bold">Offer Preference</span>
                           <span className="text-3xl font-serif font-bold text-[#d37e2f]">
                              {selectedOffer.price ? `PKR ${selectedOffer.price}` : selectedOffer.type === 'exchange' ? 'Exchange' : 'ISO'}
                           </span>
                        </div>
                        
                        {selectedOffer.ownerEmail === currentUser.email ? (
                           <div className="w-full bg-[#f4f1ea] border border-[#d8d8d8] text-[#382110] font-bold py-3 px-4 rounded-lg text-center">
                              <p className="text-sm">📚 This is your offer</p>
                              <p className="text-xs opacity-70 mt-1 uppercase tracking-tighter">Management available in Profile</p>
                           </div>
                        ) : (
                           <div className="flex gap-2">
                              <button 
                                 onClick={() => handleContact(selectedOffer)}
                                 className="flex-1 bg-[#409d69] hover:bg-[#358759] text-white font-bold py-3.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                              >
                                 <FaComments /> Contact Neighbor
                              </button>
                              <button 
                                 onClick={() => toggleWishlist?.(selectedOffer.bookTitle)}
                                 className={`p-3.5 rounded-lg border transition-all active:scale-90
                                    ${isWishlisted(selectedOffer.bookTitle) 
                                       ? 'bg-[#d37e2f] text-white border-[#d37e2f]' 
                                       : 'bg-white text-[#382110] border-[#d8d8d8] hover:bg-[#f4f1ea]'}`}
                                 title="Add to Wishlist"
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