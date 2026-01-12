/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/StoresScreen.tsx - Public Stores Browser
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaStore, FaSearch, FaArrowLeft, FaMapMarkerAlt, FaBook,
  FaHome, FaMapMarkedAlt, FaBookOpen, FaComments, FaBookmark,
  FaTimes, FaFilter, FaSort
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

type Store = {
  id: number;
  name: string;
  ownerEmail: string;
  ownerName?: string;
  ownerPhoto?: string;
  created_at: string;
  visibility: "public" | "private";
  location?: string;
  latitude?: number;
  longitude?: number;
  bookCount?: number;
  offerIds?: number[];
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
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

// Haversine formula for distance
const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function StoresScreen({ currentUser }: Props) {
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortBy, setSortBy] = useState<"nearest" | "recent" | "books">("nearest");

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => console.log("Location access denied")
      );
    }
  }, []);

  const fetchPublicStores = useCallback(async () => {
    setLoading(true);
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetchWithTimeout(`${API_BASE}/public-stores?limit=100`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` },
        signal: abortControllerRef.current.signal
      });
      
      if (response.ok) {
        const data = await response.json();
        const storesList = data.stores || data || [];
        
        // Fetch owner profiles
        const uniqueEmails = [...new Set(storesList.map((s: any) => s.ownerEmail).filter(Boolean))];
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
                  name: pData.name || "Store Owner", 
                  photo: pData.profilePhoto || pData.profilePhotoURL || pData.photo || pData.profileImageUrl 
                };
              }
            } catch (err) { console.error("Profile fetch error", err); }
          })
        );
        
        // Process stores
        const processedStores = storesList
          .map((s: any) => {
            let lat = null;
            let lng = null;
            
            if (s.latitude && s.longitude) {
              lat = parseFloat(s.latitude);
              lng = parseFloat(s.longitude);
            } else if (s.location) {
              const match = s.location.match(/Lat:\s*(-?\d+(\.\d+)?),\s*Lng:\s*(-?\d+(\.\d+)?)/);
              if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[3]);
              }
            }
            
            return {
              id: s.id,
              name: s.name,
              ownerEmail: s.ownerEmail,
              ownerName: profileCache[s.ownerEmail]?.name || s.ownerName || "Store Owner",
              ownerPhoto: profileCache[s.ownerEmail]?.photo,
              location: s.location,
              latitude: lat,
              longitude: lng,
              visibility: s.visibility || "public",
              created_at: s.created_at,
              bookCount: s.offerIds?.length || s.bookCount || 0,
              offerIds: s.offerIds
            };
          });
        
        setStores(processedStores);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error("Error fetching stores:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser.token]);

  useEffect(() => {
    fetchPublicStores();
    return () => abortControllerRef.current?.abort();
  }, [fetchPublicStores]);

  // Filter and sort stores
  const filteredAndSortedStores = stores
    .filter(store => 
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.location?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "nearest" && userLocation) {
        const distA = a.latitude && a.longitude 
          ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, a.latitude, a.longitude) 
          : Infinity;
        const distB = b.latitude && b.longitude 
          ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, b.latitude, b.longitude) 
          : Infinity;
        return distA - distB;
      } else if (sortBy === "books") {
        return (b.bookCount || 0) - (a.bookCount || 0);
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const getDistance = (store: Store) => {
    if (!userLocation || !store.latitude || !store.longitude) return null;
    const d = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, store.latitude, store.longitude);
    return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`;
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-[#eee] sticky top-0 z-30 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate("/home")} 
              className="p-2 text-[#382110] hover:bg-[#f4f1ea] rounded-full transition-colors"
            >
              <FaArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] via-[#f4d03f] to-[#d4af37] flex items-center justify-center shadow-md">
                <FaStore size={18} className="text-[#382110]" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold text-[#382110]">Public Stores</h1>
                <p className="text-xs text-[#777]">{stores.length} stores available</p>
              </div>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stores by name, owner, or location..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#f4f1ea] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-[#382110]"
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "nearest" | "recent" | "books")}
                className="appearance-none px-4 py-2.5 pr-10 bg-white border border-[#ddd] rounded-lg text-sm text-[#382110] font-medium focus:outline-none cursor-pointer"
              >
                <option value="nearest">Nearest</option>
                <option value="recent">Most Recent</option>
                <option value="books">Most Books</option>
              </select>
              <FaSort className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      {/* Stores Grid */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#777]">Loading stores...</p>
          </div>
        ) : filteredAndSortedStores.length === 0 ? (
          <div className="text-center py-20">
            <FaStore size={48} className="mx-auto text-[#ccc] mb-4" />
            <h3 className="text-lg font-bold text-[#382110] mb-2">
              {searchQuery ? "No stores found" : "No public stores yet"}
            </h3>
            <p className="text-[#777] text-sm">
              {searchQuery 
                ? "Try a different search term" 
                : "Be the first to make your library public!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredAndSortedStores.map((store, index) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/store/${store.id}`, { state: { store } })}
                  className="bg-white rounded-xl border border-[#eee] overflow-hidden shadow-sm hover:shadow-lg cursor-pointer transition-all hover:-translate-y-1 group"
                >
                  {/* Store Header with Golden Gradient */}
                  <div className="h-24 bg-gradient-to-br from-[#d4af37]/30 via-[#f4d03f]/20 to-[#d4af37]/30 relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37] via-[#f4d03f] to-[#d4af37] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <FaStore size={24} className="text-[#382110]" />
                    </div>
                    
                    {/* Book Count Badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <FaBook size={10} className="text-[#d37e2f]" />
                      <span className="text-[10px] font-bold text-[#382110]">{store.bookCount || 0}</span>
                    </div>
                  </div>

                  {/* Store Info */}
                  <div className="p-4">
                    <h3 className="font-serif font-bold text-[#382110] text-lg mb-1 truncate group-hover:text-[#d37e2f] transition-colors">
                      {store.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-[#f4f1ea] border border-[#eee]">
                        {store.ownerPhoto ? (
                          <img src={store.ownerPhoto} className="w-full h-full object-cover" alt={store.ownerName} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-[#382110]">
                            {store.ownerName?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-[#777] truncate">{store.ownerName}</span>
                    </div>

                    {/* Location and Distance */}
                    <div className="flex items-center justify-between text-xs">
                      {store.location && (
                        <div className="flex items-center gap-1 text-[#999] truncate flex-1">
                          <FaMapMarkerAlt size={10} />
                          <span className="truncate">
                            {store.location.length > 25 
                              ? store.location.substring(0, 25) + "..." 
                              : store.location}
                          </span>
                        </div>
                      )}
                      {getDistance(store) && (
                        <span className="text-[#d37e2f] font-bold ml-2 whitespace-nowrap">
                          {getDistance(store)} away
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#eee] px-4 py-2 z-40">
        <div className="flex justify-around items-center">
          <button onClick={() => navigate("/home")} className="flex flex-col items-center gap-1 text-[#999]">
            <FaHome size={18} />
            <span className="text-[10px]">Home</span>
          </button>
          <button onClick={() => navigate("/stores")} className="flex flex-col items-center gap-1 text-[#d4af37]">
            <FaStore size={18} />
            <span className="text-[10px] font-bold">Stores</span>
          </button>
          <button onClick={() => navigate("/map")} className="flex flex-col items-center gap-1 text-[#999]">
            <FaMapMarkedAlt size={18} />
            <span className="text-[10px]">Map</span>
          </button>
          <button onClick={() => navigate("/my-library")} className="flex flex-col items-center gap-1 text-[#999]">
            <FaBookOpen size={18} />
            <span className="text-[10px]">Library</span>
          </button>
          <button onClick={() => navigate("/chat")} className="flex flex-col items-center gap-1 text-[#999]">
            <FaComments size={18} />
            <span className="text-[10px]">Chat</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
