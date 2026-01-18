/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/MapScreen.tsx - PREMIUM THEME WITH MODAL
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes, FaSearch, FaMapMarkerAlt, FaHeart, FaHome, FaBookOpen, FaCompass, 
  FaUsers, FaBars, FaMapMarkedAlt, FaComments, FaBookmark, FaLocationArrow, FaFolder
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
  ownerPhoto?: string;
  ownerBadges?: string[];
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

type Store = {
  id: number;
  name: string;
  ownerEmail: string;
  ownerName?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  visibility: "public" | "private";
  bookCount?: number;
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
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

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; 
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function deg2rad(deg: number) { return deg * (Math.PI/180); }

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

const createStoreIcon = (() => {
  const iconCache = new Map<string, L.DivIcon>();
  return (isSelected: boolean = false) => {
    const cacheKey = `store_${isSelected}`;
    if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)!;

    const size = isSelected ? 52 : 44;
    
    const icon = L.divIcon({
      className: 'custom-store-marker',
      html: `
        <div style="
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          border: 3px solid white;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(212, 175, 55, 0.4);
          transition: all 0.2s;
          position: relative;
        ">
          <i class="fa-solid fa-store" style="color: #382110; font-size: 20px;"></i>
          <div style="
             position: absolute; bottom: -4px; right: -4px; 
             background: #382110; color: white; border-radius: 50%; 
             width: 18px; height: 18px; font-size: 10px; font-weight: bold;
             display: flex; align-items: center; justify-content: center;
             border: 2px solid white;
          ">+</div>
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
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProfile = useCallback(async () => {
     try {
        const response = await fetch(`${API_BASE}/profile/${currentUser.email}`, {
           headers: { "Authorization": `Bearer ${currentUser.token}` }
        });
        if (response.ok) {
           const data = await response.json();
           let loc = null;
           if (data.latitude && data.longitude) {
              loc = { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
           } else if (data.location) {
              const match = data.location.match(/Lat:\s*(-?\d+(\.\d+)?),\s*Lng:\s*(-?\d+(\.\d+)?)/);
              if (match) {
                 loc = { lat: parseFloat(match[1]), lng: parseFloat(match[3]) };
              }
           }
           if (loc) {
              setUserLocation(loc);
              if (mapInstance.current) {
                 mapInstance.current.flyTo([loc.lat, loc.lng], 13);
              }
           } else {
              // If no profile loc, try live geolocation
              handleAutoDetect();
           }
        }
     } catch (e) {
        console.error("Failed to fetch profile for location", e);
        handleAutoDetect();
     }
  }, [currentUser, currentUser.token]);

  const handleAutoDetect = useCallback(() => {
     if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
           (pos) => {
              const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setUserLocation(loc);
              if (mapInstance.current) {
                 mapInstance.current.flyTo([loc.lat, loc.lng], 13);
              }
           },
           () => console.log("Geolocation failed")
        );
     }
  }, []);

  const getImageSource = (offer: any) => {
    const url = offer.imageUrl || offer.imageurl || offer.imageBase64;
    if (url) {
      if (typeof url === 'string') {
        if (url.startsWith('http')) return url;
        if (url.startsWith('data:')) return url;
        // If it's just a base64 string without data prefix
        return `data:image/jpeg;base64,${url}`;
      }
    }
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80";
  };

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
      
      // Get unique owner emails to fetch profiles for
      const uniqueEmails = [...new Set(rawOffers.map((o: any) => o.ownerEmail).filter(Boolean))];
      const profileCache: Record<string, { name: string; photo?: string; badges?: string[] }> = {};

      // Helper to calculate badges from stats
      const calculateBadges = (offersPosted: number): string[] => {
         const badges: string[] = [];
         if (offersPosted >= 3) badges.push("Contributor");
         if (offersPosted >= 20) badges.push("Verified");
         return badges;
      };

      // Fetch profiles in batches
      await Promise.all(
         uniqueEmails.map(async (email) => {
            try {
               const pResp = await fetch(`${API_BASE}/profile/${email}`, {
                  headers: { "Authorization": `Bearer ${currentUser.token}` }
               });
               if (pResp.ok) {
                  const pData = await pResp.json();
                  // Parse badges if string, or calculate from offersPosted
                  let badges: string[] = [];
                  if (pData.badges) {
                     badges = typeof pData.badges === 'string' ? JSON.parse(pData.badges) : pData.badges;
                  }
                  // If no badges stored, calculate from offersPosted
                  if (!badges.length && pData.offersPosted) {
                     badges = calculateBadges(pData.offersPosted);
                  }
                  profileCache[email as string] = {
                     name: pData.name || "Unknown",
                     photo: pData.profilePhoto || pData.profilePhotoURL || pData.photo || pData.profileImageUrl,
                     badges
                  };
               }
            } catch (err) { console.error("Profile fetch error", err); }
         })
      );

      const processed: Offer[] = rawOffers
        .filter((o: any) => o.visibility === "public" && o.state === "open" && o.latitude && o.longitude)
        .filter((o: any) => !o.store_id) // Only show standalone offers
        .map((o: any) => ({
          ...o,
          id: o.id, 
          type: o.type || o.type, 
          bookTitle: o.bookTitle || o.booktitle || "Untitled Book",
          author: o.author || "Unknown Author",
          price: o.price, 
          condition: o.condition,
          description: o.description,
          latitude: parseFloat(o.latitude), 
          longitude: parseFloat(o.longitude),
          imageUrl: o.imageUrl || o.imageurl || o.imageBase64 || o.image_base64,
          publishedAt: o.publishedat || o.publishedAt,
          ownerName: profileCache[o.ownerEmail]?.name || o.ownerName || o.ownername || "Unknown",
          ownerPhoto: profileCache[o.ownerEmail]?.photo || o.ownerphoto,
          ownerBadges: profileCache[o.ownerEmail]?.badges || [],
          distance: "Nearby"
        }));
      setOffers(processed);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [currentUser.token, searchQuery]);

  const fetchPublicStores = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/public-stores?limit=50`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const storesList = data.stores || data || [];
        
        // Process stores and extract location coordinates
        const processedStores = storesList
          .filter((s: any) => s.visibility === "public" && s.location)
          .map((s: any) => {
            let lat = null;
            let lng = null;
            
            // Parse location string "Lat: X, Lng: Y" or check for latitude/longitude fields
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
              ownerName: s.ownerName || "Store Owner",
              location: s.location,
              latitude: lat,
              longitude: lng,
              visibility: s.visibility || "public",
              bookCount: s.offerIds?.length || 0
            };
          })
          .filter((s: Store) => s.latitude !== null && s.longitude !== null);
        
        setStores(processedStores);
      }
    } catch (err) {
      console.error("Error fetching public stores:", err);
    }
  }, [currentUser.token]);

  useEffect(() => {
    fetchProfile();
    fetchOffers();
    fetchPublicStores();
    return () => abortControllerRef.current?.abort();
  }, [fetchProfile, fetchOffers, fetchPublicStores]);

  const handleMarkerClick = useCallback((offer: Offer) => {
    setSelectedOffer(offer);
    setSelectedStore(null);
    if (mapInstance.current && offer.latitude && offer.longitude) {
      mapInstance.current.setView([offer.latitude, offer.longitude], 15, { animate: true, duration: 0.5 });
    }
  }, []);

  const handleStoreMarkerClick = useCallback((store: Store) => {
    setSelectedStore(store);
    setSelectedOffer(null);
    if (mapInstance.current && store.latitude && store.longitude) {
      mapInstance.current.setView([store.latitude, store.longitude], 15, { animate: true, duration: 0.5 });
    }
  }, []);

  const handleContact = async (offer: any) => {
    if (!offer) return;
    
    try {
       const resp = await fetch(`${API_BASE}/chats?user=${encodeURIComponent(currentUser.email)}`, {
          headers: { "Authorization": `Bearer ${currentUser.token}` }
       });
       if (resp.ok) {
          const chats: any[] = await resp.json();
        const existingChat = chats.find((c: any) => 
           (c.user1.toLowerCase() === offer.ownerEmail.toLowerCase() || c.user2.toLowerCase() === offer.ownerEmail.toLowerCase()) && 
           (Number(c.offer_id) === Number(offer.id))
        );

          if (existingChat) {
             navigate(`/chat/${existingChat.id}`, { state: { chat: existingChat } });
             return;
          }
       }
    } catch (e) { console.error("Error checking chats", e); }

    // Fixed: Cleaner state structure
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

  useEffect(() => {
    if (mapInstance.current && userLocation) {
       mapInstance.current.setView([userLocation.lat, userLocation.lng], 13);
    }
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const initialCenter: L.LatLngExpression = [40.7128, -74.006];
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView(initialCenter, 13);
      mapInstance.current = map;
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

     // Add offer markers
     offers.forEach(offer => {
        if (!offer.latitude || !offer.longitude) return;
        const isSelected = selectedOffer?.id === offer.id;
        const icon = createMarkerIcon(offer.type, isSelected);

        let distanceText = "Nearby";
        if (userLocation && offer.latitude && offer.longitude) {
           const d = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, offer.latitude, offer.longitude);
           distanceText = `${d.toFixed(1)} km`;
        }

        const marker = L.marker([offer.latitude, offer.longitude], { icon })
          .addTo(mapInstance.current!)
          .on('click', () => handleMarkerClick(offer));
        
        marker.bindTooltip(`
           <div style="padding: 4px; min-width: 120px; text-align: center;">
              <div style="font-weight: bold; font-family: serif; color: #382110; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 4px; font-size: 13px;">
                 ${offer.bookTitle}
              </div>
              <div style="font-size: 11px; color: #b85c38; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 4px;">
                 <span style="opacity: 0.8">📍</span> ${distanceText}
              </div>
           </div>
        `, { 
           direction: 'top', 
           offset: [0, -15],
           className: 'premium-map-tooltip'
        });

        markersRef.current.push(marker);
     });

     // Add store markers with golden library icons
     stores.forEach(store => {
        if (!store.latitude || !store.longitude) return;
        const isSelected = selectedStore?.id === store.id;
        const icon = createStoreIcon(isSelected);

        let distanceText = "Nearby";
        if (userLocation && store.latitude && store.longitude) {
           const d = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, store.latitude, store.longitude);
           distanceText = `${d.toFixed(1)} km`;
        }

        const marker = L.marker([store.latitude, store.longitude], { icon, zIndexOffset: 1000 })
          .addTo(mapInstance.current!)
          .on('click', () => handleStoreMarkerClick(store));
        
        marker.bindTooltip(`
           <div style="padding: 6px; min-width: 140px; text-align: center; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; border: 2px solid #d4af37;">
              <div style="font-weight: bold; font-family: serif; color: #382110; font-size: 14px; margin-bottom: 4px;">
                 📚 ${store.name}
              </div>
              <div style="font-size: 11px; color: #78350f; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 4px;">
                 <span>📍</span> ${distanceText}
              </div>
              <div style="font-size: 10px; color: #78350f; margin-top: 2px;">
                 ${store.bookCount || 0} books
              </div>
           </div>
        `, { 
           direction: 'top', 
           offset: [0, -20],
           className: 'premium-store-tooltip'
        });

        markersRef.current.push(marker);
     });
  }, [offers, stores, selectedOffer, selectedStore, handleMarkerClick, handleStoreMarkerClick, userLocation]);

  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaMapMarkedAlt, label: "Map", active: true, onClick: () => {} },
    { icon: FaBookOpen, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBookmark, label: "Saved", onClick: () => navigate("/saved") },
    { icon: FaUsers, label: "Following", onClick: () => {} },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
  ];

  const nearestOffers = useMemo(() => {
     if (!userLocation) return [];
     return [...offers]
        .map(o => {
           if (o.latitude && o.longitude) {
              const d = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, o.latitude, o.longitude);
              return { ...o, distanceNum: d, distance: `${d.toFixed(1)} km` };
           }
           return { ...o, distanceNum: 9999, distance: "Nearby" };
        })
        .sort((a, b) => a.distanceNum - b.distanceNum)
        .slice(0, 10);
  }, [offers, userLocation]);
  
  return (
    <div className="h-[calc(100vh-110px)] md:h-[calc(100vh-60px)] w-full bg-primary flex overflow-hidden font-sans">
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
                 className="w-full bg-white/90 backdrop-blur-md rounded-xl py-3 pl-12 pr-12 shadow-xl text-primary outline-none focus:ring-2 ring-secondary"
                 placeholder="Search books on map..."
               />
               <button 
                  onClick={handleAutoDetect}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#382110] hover:text-[#b85c38] transition-colors p-1"
                  title="Auto Detect Location"
               >
                  <FaCompass size={20} />
               </button>
            </div>
         </div>

         <div ref={mapRef} className="w-full h-full z-0" />

         {/* Nearest Books Slider Overlay - Professional & Minimal */}
         {userLocation && nearestOffers.length > 0 && (
            <div className="absolute bottom-6 left-4 right-4 z-[900] pointer-events-none">
               <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-2 mb-2 ml-1">
                     <div className="bg-[#d37e2f] w-1.5 h-1.5 rounded-full animate-pulse" />
                     <span className="text-[10px] font-bold uppercase tracking-wider text-[#382110] bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm">Nearest Books</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide pointer-events-auto">
                     {nearestOffers.map(offer => (
                        <motion.div 
                           key={`near-${offer.id}`}
                           whileHover={{ y: -5 }}
                           onClick={() => handleMarkerClick(offer)}
                           className="flex-shrink-0 w-[110px] bg-white rounded-xl shadow-lg border border-[#eee] overflow-hidden cursor-pointer group"
                        >
                           <div className="h-[120px] relative">
                              <img src={getImageSource(offer)} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                                 <p className="text-[8px] font-bold text-white flex items-center gap-1">
                                    <FaLocationArrow size={6} /> {offer.distance}
                                 </p>
                              </div>
                           </div>
                           <div className="p-2 bg-white">
                              <h4 className="text-[9px] font-bold text-[#382110] truncate mb-1">{offer.bookTitle}</h4>
                              <div className="flex items-center gap-1 opacity-80">
                                 <div className="w-3.5 h-3.5 rounded-full overflow-hidden bg-[#382110]/10 flex-shrink-0">
                                    {offer.ownerPhoto ? (
                                       <img src={offer.ownerPhoto} className="w-full h-full object-cover" />
                                    ) : (
                                       <div className="w-full h-full flex items-center justify-center text-[6px] font-bold text-[#382110]">
                                          {offer.ownerName?.charAt(0)}
                                       </div>
                                    )}
                                 </div>
                                 <span className="text-[7px] font-bold text-[#555] truncate">{offer.ownerName?.split(' ')[0]}</span>
                                 {offer.ownerBadges && offer.ownerBadges.length > 0 && (
                                    <span className="px-1 py-0.5 rounded text-[5px] font-bold bg-[#d37e2f]/20 text-[#d37e2f] border border-[#d37e2f]/30 whitespace-nowrap">
                                       {offer.ownerBadges[offer.ownerBadges.length - 1]}
                                    </span>
                                 )}
                              </div>
                           </div>
                        </motion.div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {/* Store Detail Modal */}
         <AnimatePresence>
           {selectedStore && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedStore(null)}
               className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
             >
               <motion.div
                 initial={{ scale: 0.95, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.95, opacity: 0, y: 20 }}
                 onClick={(e) => e.stopPropagation()}
                 className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden relative"
               >
                 <button
                   onClick={() => setSelectedStore(null)}
                   className="absolute top-4 right-4 z-10 text-[#333] bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
                 >
                   <FaTimes size={16} />
                 </button>

                 <div className="p-6">
                   <div className="flex items-center gap-4 mb-4">
                     <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37] via-[#f4d03f] to-[#d4af37] flex items-center justify-center shadow-lg">
                       <FaFolder size={24} className="text-[#382110]" />
                     </div>
                     <div className="flex-1">
                       <h2 className="text-xl font-serif font-bold text-[#382110] mb-1">{selectedStore.name}</h2>
                       <p className="text-sm text-[#777]">{selectedStore.ownerName || "Store Owner"}</p>
                     </div>
                   </div>

                   {selectedStore.location && (
                     <div className="flex items-center gap-2 text-sm text-[#555] mb-4">
                       <FaMapMarkerAlt />
                       <span>{selectedStore.location}</span>
                     </div>
                   )}

                   <div className="bg-[#f4f1ea] rounded-lg p-4 mb-4">
                     <p className="text-sm text-[#382110] font-medium mb-2">
                       {selectedStore.bookCount || 0} {selectedStore.bookCount === 1 ? 'book' : 'books'} available
                     </p>
                     <p className="text-xs text-[#777]">
                       Browse this collection to see all available books
                     </p>
                   </div>

                   <button
                     onClick={() => {
                       setSelectedStore(null);
                       navigate(`/store/${selectedStore.id}`, { state: { store: selectedStore } });
                     }}
                     className="w-full bg-[#409d69] hover:bg-[#358759] text-white font-bold py-3 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                   >
                     <FaBookOpen />
                     View Collection
                   </button>
                 </div>
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>

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
                        src={getImageSource(selectedOffer)} 
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
                           <div className="w-10 h-10 rounded-full overflow-hidden bg-[#382110]/10 border border-[#eee] flex-shrink-0">
                              {selectedOffer.ownerPhoto ? (
                                 <img src={selectedOffer.ownerPhoto} className="w-full h-full object-cover" alt={selectedOffer.ownerName} />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-[#382110] text-white font-bold text-sm">
                                    {selectedOffer.ownerName?.charAt(0) || "U"}
                                 </div>
                              )}
                           </div>
                           <span className="font-bold text-[#382110] text-base">{selectedOffer.ownerName || "Community Member"}</span>
                           {selectedOffer.ownerBadges && selectedOffer.ownerBadges.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#d37e2f]/20 text-[#d37e2f] border border-[#d37e2f]/30 whitespace-nowrap">
                                 {selectedOffer.ownerBadges[selectedOffer.ownerBadges.length - 1]}
                              </span>
                           )}
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
                              {selectedOffer.price ? `PKR ${selectedOffer.price}` : selectedOffer.type === 'exchange' ? 'Trade' : 'ISO'}
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