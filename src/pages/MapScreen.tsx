/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/MapScreen.tsx - PREMIUM THEME WITH MODAL
import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes, FaSearch, FaMapMarkerAlt, FaHeart, FaHome, FaBookOpen, FaCompass, 
  FaUsers, FaBars, FaMapMarkedAlt, FaComments, FaBookmark
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

type Offer = {
  id: number;
  type: "buy" | "sell" | "exchange";
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
};

type Props = {
  currentUser: { email: string; name: string; token: string };
  onAddPress?: () => void;
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

const createMarkerIcon = (() => {
  const iconCache = new Map<string, L.DivIcon>();
  return (type: string, isSelected: boolean = false) => {
    const cacheKey = `${type}_${isSelected}`;
    if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)!;

    const colors = { sell: "#d97706", buy: "#1e293b", exchange: "#b45309" }; // secondary, primary, secondary-hover
    const icons = { sell: '$', buy: '📖', exchange: '⇄' };
    const color = colors[type as keyof typeof colors] || "#d97706";
    const size = isSelected ? 48 : 36;
    
    // Using Tailwind colors roughly mapped
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: ${color}; border: 3px solid white;
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: bold; font-size: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s;
        ">
          ${icons[type as keyof typeof icons]}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
    iconCache.set(cacheKey, icon);
    return icon;
  };
})();

export default function MapScreen({ currentUser }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLoading] = useState(true);
  const [, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchOffers = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      let endpoint = `${API_BASE}/offers?limit=100`;
      if (searchQuery.trim()) endpoint = `${API_BASE}/search-offers?query=${encodeURIComponent(searchQuery)}`;

      const response = await fetchWithTimeout(endpoint, {
        signal: abortControllerRef.current.signal,
        headers: { "Authorization": `Bearer ${currentUser.token}` },
      }, 15000);

      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      const rawOffers = Array.isArray(data) ? data : (data.offers || data.data || []);
      
      const processed = rawOffers
        .filter((o: any) => o.visibility === "public" && o.state === "open" && o.latitude && o.longitude)
        .map((o: any) => ({
          ...o,
          id: o.id, type: o.type, bookTitle: o.bookTitle, price: o.price, 
          latitude: parseFloat(o.latitude), longitude: parseFloat(o.longitude),
          imageUrl: o.imageUrl || null,
          distance: "Nearby"
        }));
      setOffers(processed);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [currentUser.token, searchQuery]);

  useEffect(() => {
    fetchOffers();
    return () => abortControllerRef.current?.abort();
  }, [fetchOffers]);

  useEffect(() => {
     if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
           (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
           () => setUserLocation({ lat: 40.7128, lng: -74.006 })
        );
     }
  }, []);

  const handleMarkerClick = useCallback((offer: Offer) => {
    setSelectedOffer(offer);
    if (mapInstance.current && offer.latitude && offer.longitude) {
      mapInstance.current.setView([offer.latitude, offer.longitude], 15, { animate: true, duration: 0.5 });
    }
  }, []);

  const handleContact = (offer: Offer) => {
    if (!offer) return;
    const mockChatId = Date.now();
    navigate(`/chat/${mockChatId}`, {
      state: {
        chat: {
          id: mockChatId,
          user1: currentUser.email,
          user2: offer.ownerEmail,
          other_user_name: offer.ownerName || "Seller",
          offer_title: offer.bookTitle,
          offer_id: offer.id
        }
      }
    });
  };

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([40.7128, -74.0060], 13);
      mapInstance.current = map;
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    offers.forEach(offer => {
       if (!offer.latitude || !offer.longitude) return;
       const isSelected = selectedOffer?.id === offer.id;
       const icon = createMarkerIcon(offer.type, isSelected);
       const marker = L.marker([offer.latitude, offer.longitude], { icon })
         .addTo(mapInstance.current!)
         .on('click', () => handleMarkerClick(offer));
       markersRef.current.push(marker);
    });
  }, [offers, selectedOffer, handleMarkerClick]);

  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaMapMarkedAlt, label: "Map", active: true, onClick: () => {} },
    { icon: FaBookOpen, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBookmark, label: "Saved", onClick: () => navigate("/saved") },
    { icon: FaUsers, label: "Following", onClick: () => {} },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
  ];
  
  return (
    <div className="h-screen w-full bg-primary flex overflow-hidden font-sans">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden" />}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className="hidden md:flex flex-col bg-[#f4f1ea] border-r border-[#d8d8d8] z-50 overflow-hidden"
      >
        <div className="p-6 flex items-center gap-3 mb-6">
           <div className="w-10 h-10 rounded-xl bg-[#382110] flex items-center justify-center text-white text-xl font-bold font-serif">B</div>
           {sidebarOpen && <span className="font-serif font-bold text-xl text-[#382110]">Boocozmo</span>}
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <button key={item.label} onClick={item.onClick} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${item.active ? 'bg-[#382110]/10 text-[#382110]' : 'text-gray-500 hover:bg-[#382110]/5 hover:text-[#382110]'}`}>
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
      </motion.aside>

      {/* Main Map Area */}
      <div className="flex-1 relative">
         <div className="absolute top-4 left-4 right-4 z-[900] flex gap-2 max-w-xl mx-auto md:max-w-2xl">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-3 bg-white text-primary rounded-xl shadow-lg">
               <FaBars />
            </button>
            <div className="flex-1 relative">
               <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
               <input 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full bg-white/90 backdrop-blur-md rounded-xl py-3 pl-12 pr-4 shadow-xl text-primary outline-none focus:ring-2 ring-secondary"
                 placeholder="Search books on map..."
               />
            </div>
         </div>

         <div ref={mapRef} className="w-full h-full z-0" />

         {/* Full Screen/Large Modal for Offer Details (HomeScreen Style) */}
         <AnimatePresence>
           {selectedOffer && (
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => setSelectedOffer(null)}
               className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
             >
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.95, opacity: 0, y: 20 }}
                 onClick={(e) => e.stopPropagation()}
                 className="bg-[#fff] w-full max-w-4xl rounded-[4px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[600px] relative"
               >
                  <button onClick={() => setSelectedOffer(null)} className="absolute top-4 right-4 z-10 text-white md:text-[#333] bg-black/20 md:bg-gray-100 p-2 rounded-full hover:bg-black/40 md:hover:bg-gray-200 transition-colors">
                     <FaTimes size={16} />
                  </button>

                  {/* Left: Image Hero */}
                  <div className="w-full md:w-1/2 bg-[#f4f1ea] relative flex items-center justify-center p-8">
                     <img 
                       src={selectedOffer.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"} 
                       className="max-h-full max-w-full shadow-lg object-contain" 
                     />
                     <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded text-xs font-bold text-[#382110] shadow-sm uppercase tracking-wide">
                        {selectedOffer.type}
                     </div>
                  </div>

                  {/* Right: Details */}
                  <div className="w-full md:w-1/2 p-8 flex flex-col bg-white overflow-y-auto">
                     <div className="mb-6">
                        <h2 className="font-serif font-bold text-3xl text-[#382110] mb-2 leading-tight">{selectedOffer.bookTitle}</h2>
                        <p className="text-lg text-[#555]">by <span className="font-bold underline decoration-[#382110]">{selectedOffer.author || "Unknown"}</span></p>
                     </div>

                     <div className="flex gap-4 mb-6 text-sm text-[#555] border-y border-[#eee] py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 bg-[#382110] text-white rounded-full flex items-center justify-center font-bold text-xs">U</div>
                           <span className="font-bold">{selectedOffer.ownerName || "User"}</span>
                        </div>
                        <div className="border-l border-[#eee] pl-4 flex items-center gap-2">
                           <FaMapMarkerAlt className="text-[#999]" />
                           {selectedOffer.distance}
                        </div>
                     </div>

                     <div className="prose prose-sm prose-stone flex-1 mb-6">
                        <p className="font-serif leading-relaxed text-[#333]">
                           {selectedOffer.description || "No description provided. Contact the seller for details."}
                        </p>
                        <div className="mt-4 flex gap-2">
                           {selectedOffer.condition && <span className="px-2 py-1 bg-[#f4f1ea] text-[#382110] text-xs font-bold rounded">{selectedOffer.condition}</span>}
                        </div>
                     </div>

                     <div className="mt-auto pt-6 border-t border-[#eee]">
                        <div className="flex items-end justify-between mb-4">
                           <span className="text-xs uppercase text-[#777] font-bold">Price</span>
                           <span className="text-3xl font-serif font-bold text-[#d37e2f]">
                              {selectedOffer.price ? `$${selectedOffer.price}` : selectedOffer.type === 'exchange' ? 'Trade' : 'ISO'}
                           </span>
                        </div>
                        <div className="flex gap-3">
                           <button 
                              onClick={() => handleContact(selectedOffer)}
                              className="flex-1 bg-[#409d69] hover:bg-[#358759] text-white font-bold py-3 rounded-[3px] shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                           >
                              <FaComments /> Contact Seller
                           </button>
                           <button className="p-3 border border-[#d8d8d8] rounded-[3px] text-[#999] hover:text-red-500 hover:border-red-500 transition-colors">
                              <FaHeart />
                           </button>
                        </div>
                     </div>
                  </div>
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>
      </div>
    </div>
  );
}