/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/DiscoverScreen.tsx - UPDATED WITH PROPER SEARCH
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaSearch, FaMapMarkerAlt, FaTimes, FaArrowLeft, FaFilter, 
  FaComments, FaHeart, FaBookmark, FaStore, FaFolder, FaLocationArrow,
  FaSync, FaUser, FaBook, FaTag
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
  latitude?: number;
  longitude?: number;
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
  const [searchType, setSearchType] = useState<"all" | "books" | "stores" | "users">("all");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
      // 1. Fetch offers from backend
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

      // Fetch profiles for all unique owners
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

      // Process offers
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
        
        // Process stores with location data
        const processedStores = stores.map((store: any) => {
          let lat = null;
          let lng = null;
          
          if (store.latitude && store.longitude) {
            lat = parseFloat(store.latitude);
            lng = parseFloat(store.longitude);
          } else if (store.location) {
            const match = store.location.match(/Lat:\s*(-?\d+(\.\d+)?),\s*Lng:\s*(-?\d+(\.\d+)?)/);
            if (match) {
              lat = parseFloat(match[1]);
              lng = parseFloat(match[3]);
            }
          }
          
          return {
            id: store.id,
            name: store.name,
            ownerEmail: store.ownerEmail,
            ownerName: store.ownerName || "Community Member",
            ownerPhoto: store.ownerPhoto,
            created_at: store.created_at,
            visibility: store.visibility || "public",
            location: store.location,
            offerIds: store.offerIds || [],
            bookCount: store.bookCount || store.offerIds?.length || 0,
            latitude: lat,
            longitude: lng
          };
        });
        
        setAllStores(processedStores);
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
    
    // Load search history from localStorage
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, [fetchProfile, fetchOffers]);

  const isWishlisted = (title: string) => wishlist?.includes(title);

  const searchBackendOffers = async (query: string) => {
    try {
      const response = await fetch(`${API_BASE}/search-offers?query=${encodeURIComponent(query)}&limit=100`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      
      if (!response.ok) throw new Error("Search failed");
      
      const data = await response.json();
      const raw = data.offers || [];
      
      // Process the search results
      const processed: Offer[] = raw.map((o: any) => ({
        id: o.id,
        bookTitle: o.booktitle || o.bookTitle || "Untitled",
        author: o.author || "Unknown",
        type: o.type || "sell",
        imageUrl: o.imageurl || o.imageUrl,
        description: o.description,
        price: o.price,
        condition: o.condition,
        ownerName: o.ownername || "Neighbor",
        ownerEmail: o.owneremail || o.ownerEmail,
        ownerPhoto: o.ownerphoto || null,
        ownerBadges: [],
        publishedAt: o.publishedat || o.publishedAt,
        latitude: o.latitude,
        longitude: o.longitude
      }));
      
      return processed;
    } catch (error) {
      console.error("Backend search error:", error);
      return [];
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const q = searchQuery.trim();
    if (!q) {
      setDiscoveryFeed([...allOffers].sort(() => Math.random() - 0.5));
      setStoreResults([]);
      setShowStores(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Add to search history
    const newHistory = [q, ...searchHistory.filter(item => item !== q)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Search stores locally
        const storeMatches = allStores.filter(s => 
          s.name?.toLowerCase().includes(q.toLowerCase()) ||
          s.ownerName?.toLowerCase().includes(q.toLowerCase())
        );
        
        setStoreResults(storeMatches);
        setShowStores(storeMatches.length > 0 && (searchType === "all" || searchType === "stores"));

        // Search offers based on type
        if (searchType === "all" || searchType === "books") {
          // Use backend search API
          const backendResults = await searchBackendOffers(q);
          
          if (backendResults.length > 0) {
            // Enhance with profile data
            const enhancedResults = await Promise.all(
              backendResults.map(async (offer) => {
                try {
                  const profileResp = await fetch(`${API_BASE}/profile/${offer.ownerEmail}`, {
                    headers: { Authorization: `Bearer ${currentUser.token}` }
                  });
                  
                  if (profileResp.ok) {
                    const profileData = await profileResp.json();
                    return {
                      ...offer,
                      ownerName: profileData.name || offer.ownerName,
                      ownerPhoto: profileData.profilePhoto || offer.ownerPhoto,
                      ownerBadges: profileData.badges || []
                    };
                  }
                } catch (err) {
                  console.error("Profile fetch error in search:", err);
                }
                return offer;
              })
            );
            
            // Sort by relevance
            const sortedResults = enhancedResults.sort((a, b) => {
              const aTitle = a.bookTitle.toLowerCase();
              const bTitle = b.bookTitle.toLowerCase();
              const query = q.toLowerCase();
              
              // Exact match first
              if (aTitle === query) return -1;
              if (bTitle === query) return 1;
              
              // Starts with query
              if (aTitle.startsWith(query) && !bTitle.startsWith(query)) return -1;
              if (bTitle.startsWith(query) && !aTitle.startsWith(query)) return 1;
              
              // Contains query
              if (aTitle.includes(query) && !bTitle.includes(query)) return -1;
              if (bTitle.includes(query) && !aTitle.includes(query)) return 1;
              
              // Alphabetical
              return aTitle.localeCompare(bTitle);
            });
            
            setDiscoveryFeed(sortedResults);
          } else {
            // Fallback to local search
            const localMatches = allOffers.filter(o => 
              o.bookTitle?.toLowerCase().includes(q.toLowerCase()) || 
              o.author?.toLowerCase().includes(q.toLowerCase()) ||
              o.description?.toLowerCase().includes(q.toLowerCase())
            );
            
            setDiscoveryFeed(localMatches);
          }
        } else if (searchType === "users") {
          // Search for users
          try {
            const usersResp = await fetch(`${API_BASE}/get-usernames?query=${encodeURIComponent(q)}`, {
              headers: { Authorization: `Bearer ${currentUser.token}` }
            });
            
            if (usersResp.ok) {
              const users = await usersResp.json();
              // Find offers by these users
              const userEmails = users.map((u: any) => u.email.toLowerCase());
              const userOffers = allOffers.filter(o => 
                userEmails.includes(o.ownerEmail.toLowerCase()) ||
                o.ownerName.toLowerCase().includes(q.toLowerCase())
              );
              setDiscoveryFeed(userOffers);
            }
          } catch (err) {
            console.error("User search error:", err);
            const userOffers = allOffers.filter(o => 
              o.ownerName.toLowerCase().includes(q.toLowerCase())
            );
            setDiscoveryFeed(userOffers);
          }
        }
      } catch (error) {
        console.error("Search error:", error);
        // Fallback to local search
        const localMatches = allOffers.filter(o => 
          o.bookTitle?.toLowerCase().includes(q.toLowerCase()) || 
          o.author?.toLowerCase().includes(q.toLowerCase())
        );
        setDiscoveryFeed(localMatches);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce
  };

  // Auto-search when query changes (with debounce)
  useEffect(() => {
    if (searchQuery.trim() && searchQuery.length > 2) {
      handleSearch();
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchType]);

  const clearSearch = () => {
    setSearchQuery("");
    setDiscoveryFeed([...allOffers].sort(() => Math.random() - 0.5));
    setStoreResults([]);
    setShowStores(false);
    setIsSearching(false);
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

  const SearchTypeButton = ({ type, icon, label }: { type: "all" | "books" | "stores" | "users", icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setSearchType(type)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        searchType === type 
          ? 'bg-[#382110] text-white' 
          : 'bg-[#f4f1ea] text-[#382110] hover:bg-[#e8e0d5]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] md:h-[calc(100vh-60px)] overflow-y-auto bg-[#faf8f5]">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#eee] px-4 py-3 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate("/home")} className="text-[#382110] p-2 hover:bg-[#f4f1ea] rounded-full transition-colors">
              <FaArrowLeft size={18} />
            </button>
            
            <form onSubmit={handleSearch} className="flex-1 relative group">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books, authors, stores, or users..."
                className="w-full bg-[#f4f4f4] border-none rounded-xl py-3 pl-12 pr-10 text-[#382110] text-sm focus:bg-white focus:ring-2 focus:ring-[#382110]/10 outline-none transition-all shadow-inner"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] group-focus-within:text-[#382110]">
                {isSearching ? <div className="w-4 h-4 border-2 border-[#382110] border-t-transparent rounded-full animate-spin" /> : <FaSearch size={16} />}
              </div>
              {searchQuery && (
                <button 
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#382110] p-1"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </form>

            <button 
              onClick={fetchOffers} 
              className="p-3 text-[#382110] hover:bg-[#f4f1ea] rounded-full transition-colors"
              title="Refresh"
            >
              <FaSync size={16} />
            </button>
          </div>

          {/* Search Type Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <SearchTypeButton type="all" icon={<FaSearch size={12} />} label="All" />
            <SearchTypeButton type="books" icon={<FaBook size={12} />} label="Books" />
            <SearchTypeButton type="stores" icon={<FaStore size={12} />} label="Stores" />
            <SearchTypeButton type="users" icon={<FaUser size={12} />} label="Users" />
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && !searchQuery && (
            <div className="mt-3 flex flex-wrap gap-2">
              {searchHistory.slice(0, 5).map((term, index) => (
                <button
                  key={index}
                  onClick={() => setSearchQuery(term)}
                  className="px-3 py-1.5 bg-[#f4f1ea] text-[#382110] text-xs rounded-full hover:bg-[#e8e0d5] transition-colors flex items-center gap-1.5"
                >
                  <FaSearch size={10} />
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Store Results */}
            {showStores && storeResults.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold text-[#382110] uppercase tracking-widest border-b pb-2">Store Matches ({storeResults.length})</h2>
                  <button 
                    onClick={() => navigate("/stores")}
                    className="text-xs text-[#382110] hover:underline"
                  >
                    View All Stores
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storeResults.map((store) => (
                    <motion.div
                      key={store.id}
                      whileHover={{ y: -4 }}
                      onClick={() => navigate(`/store/${store.id}`, { state: { store } })}
                      className="bg-white rounded-xl border border-[#eee] p-4 cursor-pointer hover:shadow-md transition-all flex items-center gap-4 group"
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#382110] to-[#5a3e2b] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <FaStore size={20} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#382110] text-sm truncate">{store.name}</h3>
                        <p className="text-[11px] text-[#777] truncate mt-1">{store.ownerName}</p>
                        <div className="flex items-center gap-3 text-[10px] text-[#777] mt-2">
                          <div className="flex items-center gap-1">
                            <FaFolder size={10} />
                            <span>{store.bookCount || 0} books</span>
                          </div>
                          {userLocation && store.latitude && store.longitude && (
                            <div className="flex items-center gap-1">
                              <FaLocationArrow size={10} />
                              <span>{getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, store.latitude, store.longitude).toFixed(1)} km</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Book Results */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-bold text-[#382110] uppercase tracking-widest border-b pb-2">
                {searchQuery 
                  ? `Results for "${searchQuery}" (${discoveryFeed.length})` 
                  : `Discover Gems (${discoveryFeed.length})`}
              </h2>
              
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="text-xs text-[#382110] hover:underline flex items-center gap-1"
                >
                  <FaTimes size={10} />
                  Clear Search
                </button>
              )}
            </div>

            {discoveryFeed.length === 0 && searchQuery ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-[#f4f1ea] rounded-full flex items-center justify-center text-[#382110] mb-6">
                  <FaSearch size={28} />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#382110]">No matches found</h3>
                <p className="text-[#777] text-sm mt-2 mb-8 max-w-md mx-auto">
                  Try different keywords or search for authors, genres, or locations.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button onClick={() => setSearchQuery("fantasy")} className="px-3 py-1.5 bg-[#f4f1ea] text-[#382110] text-xs rounded-full hover:bg-[#e8e0d5]">fantasy</button>
                  <button onClick={() => setSearchQuery("mystery")} className="px-3 py-1.5 bg-[#f4f1ea] text-[#382110] text-xs rounded-full hover:bg-[#e8e0d5]">mystery</button>
                  <button onClick={() => setSearchQuery("classic")} className="px-3 py-1.5 bg-[#f4f1ea] text-[#382110] text-xs rounded-full hover:bg-[#e8e0d5]">classic</button>
                  <button onClick={() => setSearchQuery("novel")} className="px-3 py-1.5 bg-[#f4f1ea] text-[#382110] text-xs rounded-full hover:bg-[#e8e0d5]">novel</button>
                </div>
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
                          ${offer.type === 'sell' ? 'bg-[#d37e2fcc] backdrop-blur-md' : 
                            offer.type === 'exchange' ? 'bg-[#00635dcc] backdrop-blur-md' : 
                            'bg-[#764d91cc] backdrop-blur-md'}`}>
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
                            <img src={offer.ownerPhoto} className="w-full h-full object-cover" alt={offer.ownerName} />
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

      {/* Offer Detail Modal */}
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
                     <img src={getImageSource(selectedOffer)} className="max-h-full max-w-full shadow-lg object-contain" alt={selectedOffer.bookTitle} />
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
                           {selectedOffer.ownerPhoto ? <img src={selectedOffer.ownerPhoto} className="w-full h-full object-cover" alt={selectedOffer.ownerName} /> : <div className="w-full h-full flex items-center justify-center text-lg font-bold">{selectedOffer.ownerName?.charAt(0)}</div>}
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