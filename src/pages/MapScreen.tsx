/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/MapScreen.tsx - PREMIUM THEME
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaTimes, FaSearch, FaMapMarkerAlt, FaDollarSign, FaExchangeAlt, 
  FaTag, FaHeart, FaBookmark, FaHome, FaBookOpen, FaCompass, 
  FaUsers, FaBell, FaBars, FaMapMarkedAlt, FaComments
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

export default function MapScreen({ currentUser, onProfilePress }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
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
          imageUrl: o.imageUrl || null
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
  
  const getImageSource = (offer: Offer) => {
    if (offer.imageUrl) return offer.imageUrl;
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80";
  };

  return (
    <div className="h-screen w-full bg-primary flex overflow-hidden font-sans">
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
            <button key={item.label} onClick={item.onClick} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${item.active ? 'bg-secondary/20 text-secondary' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
      </motion.aside>

      {/* Main Map Area */}
      <div className="flex-1 relative">
         <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2 max-w-xl mx-auto md:max-w-2xl">
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

         {/* Selected Book Card */}
         <AnimatePresence>
            {selectedOffer && (
               <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-4 z-[1000] border border-white/20"
               >
                  <button onClick={() => setSelectedOffer(null)} className="absolute top-2 right-2 p-2 text-gray-400 hover:text-primary"><FaTimes /></button>
                  <div className="flex gap-4">
                     <img src={getImageSource(selectedOffer)} className="w-20 h-28 object-cover rounded-lg shadow-md" />
                     <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-primary truncate text-lg font-serif">{selectedOffer.bookTitle}</h3>
                        <p className="text-gray-500 text-xs italic mb-2">{selectedOffer.author || "Unknown"}</p>
                        <div className="flex items-center gap-2 mb-3">
                           <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${selectedOffer.type === 'sell' ? 'bg-secondary' : 'bg-blue-500'}`}>
                              {selectedOffer.type.toUpperCase()}
                           </span>
                           {selectedOffer.price && <span className="font-bold text-primary">${selectedOffer.price}</span>}
                        </div>
                        <div className="flex gap-2">
                           <button className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-bold hover:bg-primary-light transition-colors">Details</button>
                           <button className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-red-500"><FaHeart /></button>
                        </div>
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}