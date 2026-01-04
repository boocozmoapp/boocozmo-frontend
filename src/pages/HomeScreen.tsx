/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/HomeScreen.tsx - PREMIUM THEME
import { useEffect, useState, useCallback, useMemo, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch, FaHome, FaMapMarkedAlt, FaPlus, FaComments, FaBell,
  FaBookmark, FaCog, FaBookOpen, FaUsers, FaCompass, FaStar,
  FaTimes, FaFilter, FaDollarSign, FaExchangeAlt, FaTag, FaBars,
  FaHeart, FaMapMarkerAlt, FaBookmark as FaBookmarkSolid
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

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
  ownerName?: string;
  distance?: string | null;
  description?: string;
  genre?: string;
  author?: string;
  lastUpdated?: string;
  saved?: boolean;
  liked?: boolean;
  visibility: "public" | "private";
  state: "open" | "closed";
  publishedAt?: string;
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
  onAddPress?: () => void;
  onProfilePress?: () => void;
  onMapPress?: () => void;
};

const getRandomHeight = (index: number) => {
  const heights = [280, 320, 250, 300, 240, 280, 320, 260];
  return heights[index % heights.length];
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

export default function HomeScreen({
  currentUser,
  onAddPress,
  onProfilePress,
  onMapPress,
}: Props) {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "sell" | "exchange" | "buy">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredOffer, setHoveredOffer] = useState<number | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isLiked, setIsLiked] = useState<Record<number, boolean>>({});
  const [isSaved, setIsSaved] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [chatLoading, setChatLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchOffers = useCallback(async (pageNum = 0, isLoadMore = false) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    if (!isLoadMore) setLoading(true);
    setError(null);

    try {
      let endpoint = `${API_BASE}/offers`;
      if (searchQuery.trim()) {
        endpoint = `${API_BASE}/search-offers?query=${encodeURIComponent(searchQuery)}`;
      } else {
        endpoint += "?";
      }
      endpoint += `limit=${limit}&offset=${pageNum * limit}`;

      const response = await fetchWithTimeout(endpoint, {
        signal: abortControllerRef.current.signal,
        headers: { "Authorization": `Bearer ${currentUser.token}`, "Cache-Control": "no-cache" },
      }, 15000);

      if (!response.ok) {
        if (response.status === 401) throw new Error("Session expired.");
        throw new Error("Failed to load offers");
      }

      const data = await response.json();
      let rawOffers = [];
      if (Array.isArray(data)) rawOffers = data;
      else if (data.offers && Array.isArray(data.offers)) rawOffers = data.offers;
      else if (data.data && Array.isArray(data.data)) rawOffers = data.data;

      const processed: Offer[] = rawOffers
        .filter((o: any) => o.visibility === "public" && o.state === "open")
        .map((o: any, index: number) => {
          let imageUrl = null;
          if (o.imageUrl) {
            if (o.imageUrl.startsWith('data:image/')) imageUrl = o.imageUrl;
            else if (o.imageUrl.startsWith('http')) imageUrl = o.imageUrl;
            else imageUrl = `${API_BASE}${o.imageUrl.startsWith('/') ? '' : '/'}${o.imageUrl}`;
          }

          if (!imageUrl) {
            const fallbacks = [
              "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80",
              "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=300&h=380&fit=crop&q=80",
              "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=420&fit=crop&q=80",
            ];
            imageUrl = fallbacks[index % fallbacks.length];
          }

          return {
            id: o.id || index,
            type: o.type || "sell",
            bookTitle: o.bookTitle || "Unknown Book",
            exchangeBook: o.exchangeBook || null,
            price: o.price ? parseFloat(o.price) : null,
            condition: o.condition || null,
            ownerEmail: o.ownerEmail || "unknown@example.com",
            imageUrl,
            imageBase64: o.imageBase64 || null,
            latitude: o.latitude ? parseFloat(o.latitude) : null,
            longitude: o.longitude ? parseFloat(o.longitude) : null,
            ownerName: o.ownerName || o.ownerEmail?.split("@")[0] || "User",
            distance: o.distance || "Nearby",
            description: o.description || `A great book about ${o.genre || "fiction"}.`,
            genre: o.genre || "Fiction",
            author: o.author || "Unknown Author",
            lastUpdated: o.lastUpdated || o.publishedAt || o.created_at || new Date().toISOString(),
            visibility: o.visibility || "public",
            state: o.state || "open",
            publishedAt: o.publishedAt,
          };
        });

      if (isLoadMore) {
        setOffers(prev => [...prev, ...processed]);
      } else {
        setOffers(processed);
      }
      setHasMore(processed.length === limit);
      
      const likes: Record<number, boolean> = {};
      const saves: Record<number, boolean> = {};
      processed.forEach(offer => {
        likes[offer.id] = Math.random() > 0.5;
        saves[offer.id] = Math.random() > 0.7;
      });
      setIsLiked(prev => ({ ...prev, ...likes }));
      setIsSaved(prev => ({ ...prev, ...saves }));
    } catch (err: any) {
       if (err.name !== "AbortError") setError(err.message || "Failed to load books");
    } finally {
      setLoading(false);
    }
  }, [currentUser.token, searchQuery]);

  useEffect(() => {
    fetchOffers(0, false);
    return () => abortControllerRef.current?.abort();
  }, [fetchOffers]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOffers(nextPage, true);
    }
  }, [loading, hasMore, page, fetchOffers]);

  const filteredOffers = useMemo(() => {
    let result = offers;
    if (selectedFilter !== "all") result = result.filter((o) => o.type === selectedFilter);
    return result;
  }, [offers, selectedFilter]);

  const getImageSource = useCallback((offer: Offer) => {
    if (offer.imageUrl) return offer.imageUrl;
    // ... logic same as before, simplified
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80";
  }, []);

  const handleLike = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setIsLiked(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSave = useCallback(async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const newSavedState = !isSaved[id];
    setIsSaved(prev => ({ ...prev, [id]: newSavedState }));
     // Mock API call or real one
  }, [isSaved]);

  const navItems = [
    { icon: FaHome, label: "Home", active: true, onClick: () => navigate("/") },
    { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress },
    { icon: FaBookOpen, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBookmark, label: "Saved", onClick: () => navigate("/saved") },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
  ];

  const filterButtons = [
    { id: "all" as const, label: "All", icon: <FaFilter size={12} /> },
    { id: "sell" as const, label: "Buy", icon: <FaDollarSign size={12} /> },
    { id: "exchange" as const, label: "Exchange", icon: <FaExchangeAlt size={12} /> },
    { id: "buy" as const, label: "Wanted", icon: <FaTag size={12} /> },
  ];

  // Modern Card Component
  const PinterestCard = useMemo(() => memo(({ offer, index }: { offer: Offer; index: number }) => {
    const imgSrc = getImageSource(offer);
    const hovered = hoveredOffer === offer.id;
    const liked = isLiked[offer.id];
    const saved = isSaved[offer.id];
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        onMouseEnter={() => setHoveredOffer(offer.id)}
        onMouseLeave={() => setHoveredOffer(null)}
        onClick={() => setSelectedOffer(offer)}
        className="relative mb-4 break-inside-avoid rounded-2xl overflow-hidden cursor-pointer group"
        style={{ height: getRandomHeight(index) }}
      >
        <div className="absolute inset-0 bg-gray-900 z-0" />
        <img 
          src={imgSrc || ""} 
          alt={offer.bookTitle}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => setImageErrors(p => ({...p, [offer.id]: true}))}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md
            ${offer.type === 'sell' ? 'bg-secondary/80' : offer.type === 'exchange' ? 'bg-blue-500/80' : 'bg-purple-500/80'}`}>
            {offer.type}
          </span>
        </div>

        {/* Action Buttons - Always visible on mobile, hover on desktop */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity transform translate-y-0 md:translate-y-[-10px] md:group-hover:translate-y-0 z-10">
          <button 
             onClick={(e) => handleSave(e, offer.id)}
             className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-colors text-white"
          >
            <FaBookmarkSolid className={saved ? "text-secondary" : "text-white/70"} />
          </button>
          <button 
             onClick={(e) => handleLike(e, offer.id)}
             className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-colors text-white"
          >
            <FaHeart className={liked ? "text-red-500" : "text-white/70"} />
          </button>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-0 transition-transform">
          <h3 className="text-white font-serif font-bold text-lg leading-tight mb-1 line-clamp-2">
            {offer.bookTitle}
          </h3>
          <p className="text-gray-300 text-xs italic mb-2">{offer.author}</p>
          
          <div className="flex items-center justify-between text-xs text-gray-400 border-t border-white/10 pt-2 mt-2">
             <div className="flex items-center gap-1">
                <FaMapMarkerAlt size={10} />
                <span>{offer.distance || "Nearby"}</span>
             </div>
             {offer.price && <span className="text-secondary font-bold text-sm">${offer.price}</span>}
          </div>
        </div>
      </motion.div>
    );
  }), [getImageSource, hoveredOffer, isLiked, isSaved, handleLike, handleSave]);

  return (
    <div className="h-screen w-full bg-primary text-text-main flex overflow-hidden font-sans">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             onClick={() => setSidebarOpen(false)}
             className="fixed inset-0 bg-black/50 z-40 lg:hidden"
           />
        )}
      </AnimatePresence>
      
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className="hidden md:flex flex-col bg-primary-light/30 backdrop-blur-xl border-r border-white/5 z-50 transition-all duration-300 ease-in-out relative"
      >
        <div className="p-6 flex items-center gap-3 mb-6">
           <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white text-xl shadow-lg shadow-secondary/20">
             <span className="font-serif font-bold">B</span>
           </div>
           {sidebarOpen && (
             <motion.span 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="font-serif font-bold text-xl text-white tracking-tight"
             >
               Boocozmo
             </motion.span>
           )}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group
                ${item.active ? 'bg-secondary/10 text-secondary' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              {!sidebarOpen && item.active && <div className="absolute left-0 w-1 h-8 bg-secondary rounded-r-full" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
             onClick={onAddPress}
             className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-secondary text-white shadow-lg shadow-secondary/20 hover:bg-secondary-hover transition-all
             ${!sidebarOpen ? 'aspect-square p-0' : ''}`}
          >
             <FaPlus />
             {sidebarOpen && <span className="font-bold">Share Book</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="h-20 px-6 flex items-center justify-between border-b border-white/5 bg-primary/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-white hover:text-secondary transition-colors md:hidden">
                <FaBars size={20} />
             </button>
             <div className="relative max-w-md w-full hidden md:block group">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-white transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, authors, genres..."
                  className="w-full bg-primary-light/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-secondary/50 focus:bg-primary-light transition-all"
                />
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex gap-2">
               {filterButtons.map(filter => (
                 <button
                   key={filter.id}
                   onClick={() => setSelectedFilter(filter.id)}
                   className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all
                     ${selectedFilter === filter.id 
                       ? 'bg-white text-primary border-white' 
                       : 'bg-transparent text-text-muted border-white/10 hover:border-white/30'}`}
                 >
                   {filter.label}
                 </button>
               ))}
             </div>
             
             <div 
               onClick={onProfilePress}
               className="w-10 h-10 rounded-full bg-primary-light border border-white/10 flex items-center justify-center text-white cursor-pointer hover:border-secondary transition-colors"
             >
                {currentUser.name.charAt(0)}
             </div>
          </div>
        </header>

        {/* Content Grid */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-24 md:pb-8">
           {loading ? (
             <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
               {[...Array(8)].map((_, i) => (
                  <div key={i} className="rounded-2xl bg-primary-light/30 animate-pulse break-inside-avoid" style={{ height: getRandomHeight(i) }} />
               ))}
             </div>
           ) : (
             <>
                {filteredOffers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-text-muted">
                     <p>No books found.</p>
                  </div>
                ) : (
                  <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                     {filteredOffers.map((offer, idx) => (
                        <PinterestCard key={offer.id} offer={offer} index={idx} />
                     ))}
                  </div>
                )}
             </>
           )}
        </main>
      </div>

      {/* Book Detail Modal */}
      <AnimatePresence>
        {selectedOffer && (
           <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedOffer(null)}
           >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-primary border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
              >
                 <div className="w-full md:w-1/2 h-64 md:h-auto bg-black relative">
                    <img src={getImageSource(selectedOffer)} className="w-full h-full object-cover" />
                    <button onClick={() => setSelectedOffer(null)} className="absolute top-4 left-4 bg-black/50 p-2 rounded-full text-white backdrop-blur-md md:hidden">
                       <FaTimes />
                    </button>
                 </div>
                 
                 <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <h2 className="text-2xl font-serif font-bold text-white mb-1">{selectedOffer.bookTitle}</h2>
                          <p className="text-secondary text-sm italic">{selectedOffer.author}</p>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-2xl font-bold text-white">${selectedOffer.price || 0}</span>
                          <span className="text-xs text-text-muted uppercase tracking-wider">{selectedOffer.type}</span>
                       </div>
                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed mb-6 flex-1">
                       {selectedOffer.description || "No description provided."}
                    </p>

                    <div className="flex gap-3 mt-auto">
                       <button className="flex-1 bg-secondary hover:bg-secondary-hover text-white py-3 rounded-xl font-bold shadow-lg shadow-secondary/20 transition-all">
                          Contact Owner
                       </button>
                       <button className="px-4 border border-white/10 rounded-xl text-white hover:bg-white/5">
                          <FaHeart />
                       </button>
                    </div>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}