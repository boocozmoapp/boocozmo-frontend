/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/HomeScreen.tsx - BOOCOZMO FINAL (MODALS & ARTISTIC) - FIXED WITH PROPER SPACING
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaExchangeAlt, FaShoppingCart, FaTags, FaInfoCircle, FaTimes, 
  FaComments, FaHeart, FaMapMarkerAlt, FaBook, FaLocationArrow, 
  FaCrosshairs, FaFolder, FaUsers, FaChevronLeft, FaChevronRight, FaStore
} from "react-icons/fa";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { LeafletMouseEvent } from "leaflet";

// Fix Leaflet marker icon
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

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
  publishedAt?: string;
  distance?: string;
  latitude?: number;
  longitude?: number;
  ownerBadges: string[];
  owner?: {
    name: string;
    profilePhoto?: string;
    location?: string;
  };
};

type Store = {
  id: number;
  name: string;
  ownerEmail: string;
  ownerName?: string;
  ownerPhoto?: string;
  created_at: string;
  visibility: "public" | "private";
  offerIds?: number[];
  bookCount?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
};

// Haversine Distance Helper
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

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

export default function HomeScreen({ currentUser }: Props) {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [publicStores, setPublicStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  
  // Location Logic
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Store carousel ref
  const storesContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
           }
        }
     } catch (e) {
        console.error("Failed to fetch profile for location", e);
     }
  }, [currentUser]);

  const fetchPublicStores = useCallback(async () => {
    setLoadingStores(true);
    try {
      const response = await fetch(`${API_BASE}/public-stores?limit=50`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const stores = data.stores || data || [];
        
        // Parse locations and process store data
        const storesWithLocation = stores.map((store: any) => {
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
            offerIds: store.offerIds || [],
            bookCount: store.bookCount || store.offerIds?.length || 0,
            location: store.location,
            latitude: lat,
            longitude: lng
          };
        });
        
        setPublicStores(storesWithLocation);
      }
    } catch (err) {
      console.error("Error fetching public stores:", err);
    } finally {
      setLoadingStores(false);
    }
  }, [currentUser.token]);

  const getImageSource = (offer: any) => {
    const url = offer.imageUrl || offer.imageurl || offer.imageBase64;
    if (url) {
      if (typeof url === 'string') {
        if (url.startsWith('http')) return url;
        if (url.startsWith('data:')) return url;
        return `data:image/jpeg;base64,${url}`;
      }
    }
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80";
  };

  const fetchOffers = useCallback(async () => {
   try {
     setLoading(true);
     const response = await fetch(`${API_BASE}/offers?limit=100`, {
       headers: { "Authorization": `Bearer ${currentUser.token}` }
     });
     
     if (!response.ok) {
       throw new Error(`Failed to fetch offers: ${response.status}`);
     }
     
     const data = await response.json();
     const rawOffers = Array.isArray(data.offers) ? data.offers : [];
     
     // Process offers with owner information
     const processedOffers = await Promise.all(
       rawOffers.map(async (offer: any) => {
         try {
           // Fetch owner profile for badges and additional info
           const profileResponse = await fetch(`${API_BASE}/profile/${offer.owneremail}`, {
             headers: { "Authorization": `Bearer ${currentUser.token}` }
           });
           
           let ownerName = offer.ownername || "Unknown";
           let ownerPhoto = offer.ownerphoto || offer.profilePhoto;
           let ownerBadges: string[] = [];
           
           if (profileResponse.ok) {
             const profileData = await profileResponse.json();
             ownerName = profileData.name || ownerName;
             ownerPhoto = profileData.profilePhoto || ownerPhoto;
             
             // Parse badges if they exist
             if (profileData.badges) {
               ownerBadges = typeof profileData.badges === 'string' 
                 ? JSON.parse(profileData.badges) 
                 : profileData.badges;
             }
             
             // Calculate badges based on offersPosted if no badges stored
             if (!ownerBadges.length && profileData.offersPosted) {
               if (profileData.offersPosted >= 20) {
                 ownerBadges.push("Verified");
               } else if (profileData.offersPosted >= 3) {
                 ownerBadges.push("Contributor");
               }
             }
           }
           
           return {
             id: offer.id,
             bookTitle: offer.booktitle || offer.bookTitle || "Untitled Book",
             author: offer.author || "Unknown Author",
             type: offer.type || "sell",
             imageUrl: offer.imageurl || offer.imageUrl || null,
             description: offer.description,
             price: offer.price,
             condition: offer.condition,
             ownerName,
             ownerEmail: offer.owneremail,
             ownerPhoto,
             ownerBadges,
             publishedAt: offer.publishedat || offer.publishedAt,
             latitude: offer.latitude,
             longitude: offer.longitude,
             distance: "Unknown"
           };
         } catch (error) {
           console.error("Error processing offer:", error);
           return {
             id: offer.id,
             bookTitle: offer.booktitle || offer.bookTitle || "Untitled Book",
             author: offer.author || "Unknown Author",
             type: offer.type || "sell",
             imageUrl: offer.imageurl || offer.imageUrl || null,
             description: offer.description,
             price: offer.price,
             condition: offer.condition,
             ownerName: offer.ownername || "Unknown",
             ownerEmail: offer.owneremail,
             ownerPhoto: offer.ownerphoto || null,
             ownerBadges: [],
             publishedAt: offer.publishedat || offer.publishedAt,
             latitude: offer.latitude,
             longitude: offer.longitude,
             distance: "Unknown"
           };
         }
       })
     );
     
     setOffers(processedOffers);
   } catch (err) {
     console.error("Error fetching offers:", err);
   } finally {
     setLoading(false);
   }
 }, [currentUser.token]);

  useEffect(() => {
    fetchProfile();
    fetchPublicStores();
    fetchOffers();
  }, [fetchProfile, fetchPublicStores, fetchOffers]);

  // Check scroll position
  const checkScrollButtons = () => {
    if (storesContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = storesContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const nearestOffers = useMemo(() => {
     if (!userLocation) return [];
     return [...offers].map(o => {
        if (o.latitude && o.longitude) {
           const dist = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, o.latitude, o.longitude);
           return { ...o, distVal: dist, distance: `${dist.toFixed(1)} km` };
        }
        return { ...o, distVal: 99999, distance: "Unknown" };
     }).sort((a, b) => a.distVal - b.distVal).slice(0, 5);
  }, [offers, userLocation]);

  const sortedStores = useMemo(() => {
    if (!userLocation) return publicStores;
    
    return [...publicStores].map(store => {
      if (store.latitude && store.longitude && userLocation) {
        const dist = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, store.latitude, store.longitude);
        return { ...store, distance: dist };
      }
      return { ...store, distance: 99999 };
    }).sort((a, b) => a.distance - b.distance);
  }, [publicStores, userLocation]);

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, [sortedStores]);

  const scrollStores = (direction: 'left' | 'right') => {
    if (storesContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = storesContainerRef.current.scrollLeft + 
        (direction === 'left' ? -scrollAmount : scrollAmount);
      
      storesContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
      
      setTimeout(checkScrollButtons, 300);
    }
  };

  const updateLocation = async () => {
     if (!tempLocation) return;
     setUserLocation(tempLocation);
     setShowLocationModal(false);
     
     try {
        await fetch(`${API_BASE}/update-profile`, {
           method: 'PATCH',
           headers: { 
             'Authorization': `Bearer ${currentUser.token}`, 
             'Content-Type': 'application/json' 
           },
           body: JSON.stringify({
              location: `Lat: ${tempLocation.lat.toFixed(6)}, Lng: ${tempLocation.lng.toFixed(6)}`,
              latitude: tempLocation.lat,
              longitude: tempLocation.lng
           })
        });
     } catch (e) { 
        console.error("Failed to save location", e); 
     }
  };

  const handleAutoDetect = () => {
     if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setTempLocation({ 
              lat: pos.coords.latitude, 
              lng: pos.coords.longitude 
            });
          },
          (error) => {
            alert(`Geolocation error: ${error.message}`);
          }
        );
     } else { 
        alert("Geolocation not supported by your browser"); 
     }
  };

  const handleContact = async (offer: Offer) => {
    if (!offer) return;
    
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

    // Fixed: Cleaner state structure
    navigate(`/chat/new`, {
      state: {
        chat: {
          id: 0,
          user1: currentUser.email,
          user2: offer.ownerEmail,  // Fixed: removed duplicate
          other_user_name: offer.ownerName || "Seller",
          offer_title: offer.bookTitle,
          offer_id: offer.id,
          ownerEmail: offer.ownerEmail  // Keep this for backward compatibility
        }
      }
    });
  };

  const handleStoreClick = (store: Store) => {
    navigate(`/store/${store.id}`, { state: { store } });
  };

  // Store Card Component
  const StoreCard = ({ store }: { store: Store }) => (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleStoreClick(store)}
      className="flex-shrink-0 w-20 h-20 md:w-22 md:h-22 flex flex-col items-center justify-center bg-white rounded-full shadow-sm border border-[#e8e0d5] cursor-pointer hover:shadow-md hover:border-[#382110]/30 transition-all duration-300 p-2 mx-1.5 relative group"
    >
      {/* Circular Avatar with Shop Icon */}
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#382110] flex items-center justify-center shadow-sm group-hover:bg-[#2a180c] transition-colors">
        <FaStore size={16} className="text-white" />
      </div>
      
      {/* Store Name */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-24 md:w-28">
        <h3 className="text-[9px] md:text-[10px] font-semibold text-[#382110] text-center truncate w-full leading-tight">
          {store.name}
        </h3>
      </div>
    </motion.div>
  );

  return (
    <div className="pb-10 px-4 md:px-0 flex flex-col md:flex-row gap-8 max-w-[1100px] mx-auto h-[calc(100vh-110px)] md:h-[calc(100vh-60px)] overflow-y-auto">
       
       {/* Modal for Offer Details */}
       <AnimatePresence>
         {selectedOffer && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }}
             onClick={() => setSelectedOffer(null)}
             className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
           >
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               onClick={(e) => e.stopPropagation()}
               className="bg-[#fff] w-full max-w-4xl rounded-[4px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[600px] relative"
             >
                <button 
                  onClick={() => setSelectedOffer(null)} 
                  className="absolute top-4 right-4 z-10 text-white md:text-[#333] bg-black/20 md:bg-gray-100 p-2 rounded-full hover:bg-black/40 md:hover:bg-gray-200 transition-colors"
                >
                   <FaTimes size={16} />
                </button>

                {/* Left: Image Hero */}
                <div className="w-full md:w-1/2 bg-[#f4f1ea] relative flex items-center justify-center p-8">
                   <img 
                     src={selectedOffer.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"} 
                     alt={selectedOffer.bookTitle}
                     className="max-h-full max-w-full shadow-lg object-contain" 
                   />
                   <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded text-xs font-bold text-[#382110] shadow-sm uppercase tracking-wide">
                      {selectedOffer.type}
                   </div>
                </div>

                {/* Right: Details */}
                <div className="w-full md:w-1/2 p-8 flex flex-col bg-white overflow-y-auto">
                   <div className="mb-6">
                      <h2 className="font-serif font-bold text-3xl text-[#382110] mb-2 leading-tight">
                        {selectedOffer.bookTitle}
                      </h2>
                      <p className="text-lg text-[#555]">
                        by <span className="font-bold underline decoration-[#382110]">{selectedOffer.author}</span>
                      </p>
                   </div>

                   <div className="flex gap-4 mb-6 text-sm text-[#555] border-y border-[#eee] py-4">
                       <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#382110]/10 border border-[#eee] flex-shrink-0">
                             {selectedOffer.ownerPhoto ? (
                                <img 
                                  src={selectedOffer.ownerPhoto} 
                                  className="w-full h-full object-cover" 
                                  alt={selectedOffer.ownerName} 
                                />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#382110] text-white font-bold text-sm">
                                   {selectedOffer.ownerName?.charAt(0) || "U"}
                                </div>
                             )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#382110] text-base">{selectedOffer.ownerName}</span>
                            {selectedOffer.ownerBadges && selectedOffer.ownerBadges.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedOffer.ownerBadges.map((badge, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#d37e2f]/20 text-[#d37e2f] border border-[#d37e2f]/30"
                                  >
                                    {badge}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                       </div>
                   </div>

                   <div className="prose prose-sm prose-stone flex-1 mb-6">
                      <p className="font-serif leading-relaxed text-[#333]">
                         {selectedOffer.description || "No description provided. Contact the seller for more details about condition and edition."}
                      </p>
                      <div className="mt-4 flex gap-2">
                         {selectedOffer.condition && (
                           <span className="px-2 py-1 bg-[#f4f1ea] text-[#382110] text-xs font-bold rounded">
                             {selectedOffer.condition}
                           </span>
                         )}
                      </div>
                   </div>

                   <div className="mt-auto pt-6 border-t border-[#eee]">
                      <div className="flex items-end justify-between mb-4">
                         <span className="text-xs uppercase text-[#777] font-bold">Price</span>
                         <span className="text-3xl font-serif font-bold text-[#d37e2f]">
                            {selectedOffer.price ? `PKR ${selectedOffer.price}` : selectedOffer.type === 'exchange' ? 'Trade' : 'ISO'}
                         </span>
                      </div>
                      {selectedOffer.ownerEmail === currentUser.email ? (
                         <div className="w-full bg-[#f4f1ea] border border-[#d8d8d8] text-[#382110] font-bold py-3 px-4 rounded-[3px] text-center">
                            <p className="text-sm">📚 This is your offer</p>
                            <p className="text-xs opacity-70 mt-1">Manage it from your Profile or Library</p>
                         </div>
                      ) : (
                         <button 
                            onClick={() => handleContact(selectedOffer)}
                            className="w-full bg-[#409d69] hover:bg-[#358759] text-white font-bold py-3 rounded-[3px] shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                         >
                            <FaComments /> Contact Seller
                         </button>
                      )}
                   </div>
                </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
       
       {/* Location Modal */}
       <AnimatePresence>
         {showLocationModal && (
           <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9 }} 
                animate={{ scale: 1 }} 
                className="bg-white p-6 rounded-[2px] w-full max-w-lg shadow-2xl"
              >
                 <h3 className="font-serif font-bold text-xl text-[#382110] mb-4">Pinpoint Your Location</h3>
                 
                 <div className="flex gap-2 mb-4">
                   <button 
                     type="button" 
                     onClick={handleAutoDetect} 
                     className="flex-1 bg-white border border-[#ccc] py-2 text-xs font-bold text-[#555] hover:bg-[#eee] flex items-center justify-center gap-1"
                   >
                      <FaCrosshairs /> Auto Detect
                   </button>
                 </div>

                 <div className="h-64 border border-[#ccc] mb-4 relative z-0">
                    <MapContainer 
                      center={userLocation || { lat: 40.7128, lng: -74.0060 }} 
                      zoom={13} 
                      style={{ height: "100%", width: "100%" }}
                    >
                         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                         <LocationMarker 
                           position={tempLocation || userLocation} 
                           setPosition={setTempLocation} 
                         />
                    </MapContainer>
                 </div>
                 
                 <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setShowLocationModal(false)} 
                      className="text-[#999] text-sm hover:text-[#382110]"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={updateLocation} 
                      className="bg-[#382110] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-transform"
                    >
                      Save Location
                    </button>
                 </div>
              </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* Main Feed */}
       <div className="flex-1 md:pr-6 pt-4 md:pt-6"> {/* Added padding-top here */}
          
          {/* Stores Section */}
          {sortedStores.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[#382110] font-bold text-[16px] uppercase tracking-widest">Stores</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollStores('left')}
                    disabled={!canScrollLeft}
                    className={`p-1.5 rounded-full transition-all ${canScrollLeft ? 'bg-white text-[#382110] hover:bg-[#f4f1ea] shadow-sm border border-[#eee]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                  >
                    <FaChevronLeft size={12} />
                  </button>
                  <button
                    onClick={() => scrollStores('right')}
                    disabled={!canScrollRight}
                    className={`p-1.5 rounded-full transition-all ${canScrollRight ? 'bg-white text-[#382110] hover:bg-[#f4f1ea] shadow-sm border border-[#eee]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                  >
                    <FaChevronRight size={12} />
                  </button>
                </div>
              </div>
              <div className="relative">
                <div
                  ref={storesContainerRef}
                  onScroll={checkScrollButtons}
                  className="flex overflow-x-auto pb-5 scrollbar-hide gap-2 px-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {sortedStores.map((store) => (
                    <StoreCard key={store.id} store={store} />
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* If no stores, add extra margin */}
          {sortedStores.length === 0 && !loadingStores && (
            <div className="mb-6"></div> 
          )}
          
          {/* Location Banner or Nearest Books */}
          {!userLocation ? (
             <motion.div 
               initial={{ opacity: 0, y: -10 }} 
               animate={{ opacity: 1, y: 0 }} 
               className="mb-8 bg-gradient-to-r from-[#f4f1ea] to-white border border-[#d8d8d8] p-4 shadow-sm flex items-center gap-4 rounded-[2px] relative overflow-hidden"
             >
                <div className="bg-[#382110] p-3 rounded-full text-white z-10">
                  <FaLocationArrow />
                </div>
                <div className="flex-1 z-10">
                   <h2 className="font-serif font-bold text-[#382110] text-sm md:text-base">Enhance Your Experience</h2>
                   <p className="text-xs text-[#555]">Enter your location to see books available in your immediate neighborhood.</p>
                </div>
                <button 
                  onClick={() => setShowLocationModal(true)} 
                  className="relative z-10 px-4 py-2 bg-[#d37e2f] text-white text-xs font-bold rounded-full hover:bg-[#b56b25] transition-colors shadow-sm"
                >
                   Set Location
                </button>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d37e2f]/5 rounded-full blur-2xl -mr-10 -mt-10" />
             </motion.div>
          ) : (
             <div className="mb-10">
                <div className="mb-4">
                   <h2 className="text-[#382110] font-bold text-[16px] font-sans uppercase tracking-widest">Nearest to You</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                   {nearestOffers.length > 0 ? nearestOffers.map(offer => (
                      <div key={offer.id} className="min-w-[140px] w-[140px] flex flex-col gap-2 group">
                         <div 
                           onClick={() => setSelectedOffer(offer)} 
                           className="w-full h-[200px] relative shadow-md cursor-pointer overflow-hidden border border-[#eee]"
                         >
                            <img 
                              src={getImageSource(offer)} 
                              alt={offer.bookTitle}
                              className="w-full h-full object-cover" 
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 text-center font-bold">
                               {offer.distance} away
                            </div>
                         </div>
                         <h3 className="font-serif font-bold text-[#382110] text-xs leading-tight truncate">
                           {offer.bookTitle}
                         </h3>
                         <div className="flex items-center gap-1.5 opacity-80">
                            <div className="w-4 h-4 rounded-full overflow-hidden bg-[#382110]/10 flex-shrink-0">
                               {offer.ownerPhoto ? (
                                  <img 
                                    src={offer.ownerPhoto} 
                                    alt={offer.ownerName}
                                    className="w-full h-full object-cover" 
                                  />
                               ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-[#382110]">
                                     {offer.ownerName?.charAt(0).toUpperCase() || "U"}
                                  </div>
                               )}
                            </div>
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                               <span className="text-[9px] font-bold text-[#382110] truncate">
                                  {offer.ownerName?.split(' ')[0] || "User"}
                                </span>
                               {offer.ownerBadges && offer.ownerBadges.length > 0 && (
                                  <span className="px-1 py-0.5 rounded text-[7px] font-bold bg-[#d37e2f]/20 text-[#d37e2f] border border-[#d37e2f]/30 flex-shrink-0 whitespace-nowrap">
                                     {offer.ownerBadges[offer.ownerBadges.length - 1]}
                                  </span>
                               )}
                            </div>
                         </div>
                      </div>
                   )) : (
                     <div className="text-sm text-[#777] italic">No books in your immediate radius yet.</div>
                   )}
                </div>
             </div>
          )}

          <div className="mb-6 border-b border-[#d8d8d8] pb-2 flex justify-between items-end">
             <h2 className="text-[#382110] font-bold text-[16px] font-sans uppercase tracking-widest">Recent Community Listings</h2>
          </div>

          {loading ? (
             <div className="flex justify-center p-12 text-[#999]">Loading community...</div>
          ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {offers.length > 0 ? offers.map(offer => (
                   <motion.div 
                      key={offer.id} 
                      whileHover={{ y: -4 }}
                      className="flex flex-col gap-2 group bg-white p-2.5 rounded-xl border border-[#ece9e4] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] transition-all duration-300"
                   >
                      <div 
                        onClick={() => setSelectedOffer(offer)}
                        className="w-full h-[200px] md:h-[220px] relative rounded-lg overflow-hidden bg-[#f8f6f3]"
                      >
                         <img 
                            src={getImageSource(offer)} 
                            alt={offer.bookTitle}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-95 group-hover:opacity-100" 
                         />
                         
                         {/* Type Badge */}
                         <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                             <div className={`text-[10px] font-bold px-2 py-1 text-white shadow-sm rounded-md tracking-wider uppercase
                               ${offer.type === 'sell' ? 'bg-[#d37e2fcc] backdrop-blur-md' : offer.type === 'exchange' ? 'bg-[#00635dcc] backdrop-blur-md' : 'bg-[#764d91cc] backdrop-blur-md'}`}>
                               {offer.type}
                             </div>
                         </div>

                         {/* Distance Badge */}
                         {userLocation && offer.latitude !== undefined && offer.longitude !== undefined && (
                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                               <FaLocationArrow size={8} /> 
                               {getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, offer.latitude, offer.longitude).toFixed(1)} km
                            </div>
                         )}
                      </div>

                      <div className="px-1">
                         <h3 
                            onClick={() => setSelectedOffer(offer)}
                            className="font-serif font-bold text-[#2d2520] text-[15px] leading-tight cursor-pointer line-clamp-2 min-h-[40px] group-hover:text-[#8b4513] transition-colors"
                         >
                            {offer.bookTitle}
                         </h3>
                         <div className="text-xs text-[#777] mb-3 truncate font-medium">
                           by {offer.author}
                         </div>
                         
                         {/* Owner Info Section */}
                         <div className="flex items-center gap-2 pt-2 border-t border-[#f4f4f4]">
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-[#f4f1ea] border border-[#e5e5e5] flex-shrink-0 shadow-sm">
                               {offer.ownerPhoto ? (
                                  <img 
                                    src={offer.ownerPhoto} 
                                    alt={offer.ownerName}
                                    className="w-full h-full object-cover" 
                                  />
                               ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#382110]">
                                     {offer.ownerName?.charAt(0).toUpperCase() || "U"}
                                  </div>
                               )}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0 justify-center">
                               <span className="text-[11px] font-bold text-[#444] truncate leading-none">
                                  {offer.ownerName?.split(' ')[0] || "Member"}
                               </span>
                               {offer.ownerBadges && offer.ownerBadges.length > 0 ? (
                                  <span className="text-[9px] text-[#d37e2f] font-semibold truncate leading-tight mt-0.5">
                                     {offer.ownerBadges[offer.ownerBadges.length - 1]}
                                  </span>
                               ) : (
                                  <span className="text-[9px] text-[#999] truncate leading-tight mt-0.5">Nearby</span>
                               )}
                            </div>
                         </div>
                      </div>
                   </motion.div>
                )) : (
                  <div className="text-[#777] italic col-span-full">No offers found.</div>
                )}
             </div>
          )}
       </div>

       {/* Artistic Sidebar (Desktop) */}
       <aside className="hidden md:block w-[300px] shrink-0 mt-6"> {/* Added margin-top here */}
          <div className="bg-[#382110] p-6 rounded-[2px] mb-6 relative overflow-hidden text-white shadow-md group">
            <div className="absolute top-0 right-0 p-4 opacity-20 transform scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
               <FaExchangeAlt size={120} />
            </div>
            <div className="relative z-10">
               <h3 className="font-serif font-bold text-xl mb-2 border-b border-white/30 pb-2">Circulate Stories</h3>
               <p className="text-sm leading-relaxed font-sans opacity-95">Pass your beloved books to a new neighbor. Every exchange builds a stronger, more connected society.</p>
            </div>
          </div>
          
          <div className="bg-[#00635d] p-6 rounded-[2px] mb-6 relative overflow-hidden text-white shadow-md group">
            <div className="absolute top-0 right-0 p-4 opacity-20 transform scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
               <FaBook size={120} />
            </div>
            <div className="relative z-10">
               <h3 className="font-serif font-bold text-xl mb-2 border-b border-white/30 pb-2">Discover Hidden Gems</h3>
               <p className="text-sm leading-relaxed font-sans opacity-95">Find rare editions and local favorites right in your neighborhood at prices you'll love.</p>
            </div>
          </div>
          
          <div className="bg-[#d37e2f] p-6 rounded-[2px] mb-6 relative overflow-hidden text-white shadow-md group">
            <div className="absolute top-0 right-0 p-4 opacity-20 transform scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
               <FaHeart size={120} />
            </div>
            <div className="relative z-10">
               <h3 className="font-serif font-bold text-xl mb-2 border-b border-white/30 pb-2">Join the Movement</h3>
               <p className="text-sm leading-relaxed font-sans opacity-95">Be part of the sustainable reading revolution. Save trees, save money, and make friends.</p>
            </div>
          </div>

          <div className="mt-8 border-t border-[#d8d8d8] pt-6">
             <h4 className="font-bold text-[#382110] mb-4 uppercase text-xs tracking-widest">Marketplace Utils</h4>
             <ul className="space-y-2 text-sm text-[#00635d] font-bold">
                <li>
                  <a href="/offer" className="hover:underline flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#00635d] rounded-full"></div> 
                    Post a Book for Sale
                  </a>
                </li>
                <li>
                  <a href="/offer" className="hover:underline flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#00635d] rounded-full"></div> 
                    Request a Book (ISO)
                  </a>
                </li>
             </ul>
          </div>
       </aside>
    </div>
  );
}