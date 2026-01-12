import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft, FaComments, FaBook, FaFolder, FaUser,
  FaMapMarkerAlt, FaCalendarAlt, FaTimes, FaGlobeAmericas
} from "react-icons/fa";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({ 
  iconUrl: icon, 
  shadowUrl: iconShadow, 
  iconSize: [25, 41], 
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

const API_BASE = "https://boocozmo-api.onrender.com";

type Offer = {
  id: number;
  bookTitle: string;
  author: string;
  type: "sell" | "exchange" | "buy";
  imageUrl: string | null;
  imageBase64: string | null;
  price: number | null;
  condition?: string;
  description?: string;
  visibility: "public" | "private";
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
  latitude?: number;
  longitude?: number;
  offerIds?: number[];
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
};

export default function StoreDetailScreen({ currentUser }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const storeFromState = location.state?.store as Store | undefined;

  const [store, setStore] = useState<Store | null>(storeFromState || null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const fetchStoreAndOffers = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("Invalid store ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch store details & offers using the main route
      const offersResponse = await fetch(`${API_BASE}/offers-by-store?store_id=${id}`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });

      if (!offersResponse.ok) {
        throw new Error(`Failed to load store data (${offersResponse.status})`);
      }

      const data = await offersResponse.json();
      const storeData = data.store;
      const offersData = data.offers || [];

      // 2. Process store data
      let lat = storeData.latitude;
      let lng = storeData.longitude;

      if (!lat || !lng) {
        // Fallback: parse from location string if needed
        const match = storeData.location?.match(/Lat:\s*(-?\d+(\.\d+)?),\s*Lng:\s*(-?\d+(\.\d+)?)/);
        if (match) {
           lat = parseFloat(match[1]);
           lng = parseFloat(match[3]);
        }
      }

      setStore({
        ...storeData,
        latitude: lat ? parseFloat(lat) : undefined,
        longitude: lng ? parseFloat(lng) : undefined,
        ownerName: storeData.ownerName || "Store Owner",
      });

      // 3. Process offers
      const processedOffers = offersData.map((o: any) => ({
        id: o.id,
        bookTitle: o.bookTitle || "Untitled Book",
        author: o.author || "Unknown Author",
        type: o.type || "sell",
        imageUrl: o.imageUrl || o.imageurl || o.imageBase64 || o.image_base64,
        price: o.price ? parseFloat(o.price) : null,
        condition: o.condition,
        description: o.notes || o.description, // Backend uses 'notes' for store_offers
        visibility: o.visibility || "public",
      }));

      setOffers(processedOffers);

    } catch (err: any) {
      console.error("Store & offers fetch error:", err);
      setError(err.message || "Failed to load store details");
    } finally {
      setLoading(false);
    }
  }, [id, currentUser.token]);

  useEffect(() => {
    fetchStoreAndOffers();
  }, [fetchStoreAndOffers]);

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
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";
  };

  const handleContact = async () => {
    if (!store) return;
    // Fixed: Cleaner state structure
    navigate(`/chat/new`, {
      state: {
        chat: {
          id: 0,
          user1: currentUser.email,
          user2: store.ownerEmail,
          other_user_name: store.ownerName || "Seller",
          offer_title: `Inquiry about books in ${store.name}`,
          ownerEmail: store.ownerEmail // Keep this for backward compatibility
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-[#f4f1ea] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#382110]/20 border-t-[#382110] rounded-full animate-spin"></div>
           <div className="text-[#382110] font-medium animate-pulse">Opening Bookstore...</div>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-[#f4f1ea] flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-[#d8d8d8]">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <FaTimes size={30} />
          </div>
          <h2 className="text-2xl font-bold text-[#382110] mb-2">Store Unavailable</h2>
          <p className="text-[#555] mb-6">{error || "This store doesn't exist or is set to private."}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full px-6 py-3 bg-[#382110] text-white rounded-xl font-bold hover:bg-[#2a180c] transition-all shadow-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] bg-[#f4f1ea]">
      {/* Header Section */}
      <div className="bg-white border-b border-[#d8d8d8] sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1100px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 text-[#382110] hover:bg-[#f4f1ea] rounded-xl transition-all border border-transparent hover:border-[#ddd]"
            >
              <FaArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#382110] leading-tight">{store.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-[#777]">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#f4f1ea] rounded-full">
                  <div className="w-4 h-4 rounded-full overflow-hidden bg-[#382110]/20">
                    {store.ownerPhoto ? (
                      <img src={store.ownerPhoto} className="w-full h-full object-cover" alt={store.ownerName} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">
                        {store.ownerName?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-[#382110] text-[12px]">{store.ownerName}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleContact}
            className="px-5 py-2.5 bg-[#409d69] hover:bg-[#358759] text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <FaComments />
            Message Owner
          </button>
        </div>
      </div>

      <main className="max-w-[1100px] mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Books */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold text-[#382110] flex items-center gap-2">
                  <FaBook className="text-[#00635d]" />
                  Available Collection
               </h2>
               <span className="text-sm font-medium text-[#777] bg-white px-3 py-1 rounded-full border border-[#eee]">
                  {offers.length} {offers.length === 1 ? 'book' : 'books'}
               </span>
            </div>

            {offers.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-[#d8d8d8] shadow-sm">
                <FaBook className="mx-auto text-5xl text-[#ddd] mb-4" />
                <p className="text-[#382110] text-lg font-bold">The shelves are empty!</p>
                <p className="text-[#777] text-sm mt-1">This user hasn't added any public books yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                {offers.map((offer) => (
                  <motion.div
                    key={offer.id}
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedOffer(offer)}
                    className="bg-white rounded-2xl overflow-hidden border border-[#eee] hover:border-[#00635d]/30 transition-all shadow-sm cursor-pointer group flex flex-col h-full"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden bg-[#f9f9f9]">
                      <img
                        src={getImageSource(offer)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={offer.bookTitle}
                      />
                      <div className="absolute top-2 right-2">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg shadow-lg text-white ${
                          offer.type === 'sell' ? 'bg-[#d37e2f]' :
                          offer.type === 'exchange' ? 'bg-[#00635d]' :
                          'bg-[#764d91]'
                        }`}>
                          {offer.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-[#382110] text-sm line-clamp-2 leading-tight mb-1 group-hover:text-[#00635d] transition-colors">
                        {offer.bookTitle}
                      </h3>
                      <p className="text-[11px] text-[#777] font-medium mb-3">by {offer.author}</p>
                      <div className="mt-auto">
                        <p className="text-sm font-black text-[#d37e2f]">
                           {offer.price ? `PKR ${offer.price}` : offer.type === 'exchange' ? 'TRADE' : 'FREE'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Store Sidebar */}
          <div className="space-y-6">
             {/* Map Card */}
             <div className="bg-white rounded-2xl border border-[#d8d8d8] overflow-hidden shadow-sm flex flex-col">
                <div className="p-4 border-b border-[#eee] flex items-center justify-between">
                   <h3 className="font-bold text-[#382110] flex items-center gap-2">
                      <FaGlobeAmericas className="text-[#409d69]" /> Location
                   </h3>
                   {store.location && (
                      <span className="text-[10px] font-bold text-[#777] bg-[#f4f1ea] px-2 py-0.5 rounded uppercase">
                         {store.location.split(',')[0]}
                      </span>
                   )}
                </div>
                
                <div className="h-[250px] relative z-0">
                   {store.latitude && store.longitude ? (
                      <MapContainer 
                        center={[store.latitude, store.longitude]} 
                        zoom={13} 
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={false}
                        attributionControl={false}
                      >
                         <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                         <Marker position={[store.latitude, store.longitude]} />
                      </MapContainer>
                   ) : (
                      <div className="h-full w-full bg-[#f4f1ea] flex flex-col items-center justify-center p-6 text-center">
                         <FaMapMarkerAlt size={24} className="text-[#999] mb-2" />
                         <p className="text-xs text-[#777] font-medium">Location not pinpointed on map</p>
                      </div>
                   )}
                </div>

                <div className="p-4 bg-white">
                   <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#f4f1ea] flex items-center justify-center text-[#382110] flex-shrink-0">
                         <FaMapMarkerAlt size={18} />
                      </div>
                      <div className="min-w-0">
                         <p className="text-xs font-bold text-[#382110] mb-0.5 uppercase tracking-wider">Store Address</p>
                         <p className="text-sm text-[#555] line-clamp-2">{store.location || 'Address not listed'}</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Store Meta */}
             <div className="bg-[#382110] text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                   <p className="text-[10px] font-black opacity-60 uppercase mb-4 tracking-[2px]">Store Integrity</p>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-sm opacity-80">Member Since</span>
                         <span className="text-sm font-bold">{new Date(store.created_at).getFullYear()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-sm opacity-80">Total Inventory</span>
                         <span className="text-sm font-bold">{offers.length} active books</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-sm opacity-80">Visibility</span>
                         <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase">{store.visibility}</span>
                      </div>
                   </div>
                </div>
                {/* Decorative Elements */}
                <FaBook className="absolute -bottom-4 -right-4 text-white/5 text-8xl rotate-12" />
             </div>
          </div>

        </div>
      </main>

      {/* Offer Detail Modal */}
      <AnimatePresence>
        {selectedOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOffer(null)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] relative"
            >
              <button
                onClick={() => setSelectedOffer(null)}
                className="absolute top-4 right-4 z-10 text-[#333] bg-white/80 p-2 rounded-full hover:bg-white shadow-md transition-all active:scale-95"
              >
                <FaTimes size={18} />
              </button>

              <div className="w-full md:w-5/12 bg-[#f4f1ea] flex items-center justify-center p-8 md:p-12">
                <img
                  src={getImageSource(selectedOffer)}
                  className="max-h-full max-w-full rounded-xl shadow-2xl object-contain"
                  alt={selectedOffer.bookTitle}
                />
              </div>

              <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col bg-white">
                <div className="mb-6">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full text-white mb-3 inline-block uppercase tracking-wider ${
                    selectedOffer.type === 'sell' ? 'bg-[#d37e2f]' :
                    selectedOffer.type === 'exchange' ? 'bg-[#00635d]' :
                    'bg-[#764d91]'
                  }`}>
                    {selectedOffer.type}
                  </span>
                  <h2 className="font-bold text-3xl text-[#382110] mb-2 leading-tight">
                    {selectedOffer.bookTitle}
                  </h2>
                  <p className="text-lg text-[#777] font-medium">
                    by <span className="text-[#382110] border-b-2 border-[#d37e2f]/30">{selectedOffer.author}</span>
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto mb-8 pr-2 custom-scrollbar">
                  <h4 className="text-[10px] font-black text-[#777] uppercase mb-2 tracking-widest">Story / Description</h4>
                  <p className="leading-relaxed text-[#555] text-sm">
                    {selectedOffer.description || "The owner hasn't shared a specific story for this book yet. It's waiting for you to discover its pages!"}
                  </p>
                  
                  {selectedOffer.condition && (
                    <div className="mt-6 flex items-center gap-2">
                       <span className="text-[10px] font-black text-[#777] uppercase tracking-widest">Condition:</span>
                       <span className="px-3 py-1 bg-[#f4f1ea] text-[#382110] text-[11px] font-bold rounded-lg border border-[#ddd]">
                         {selectedOffer.condition}
                       </span>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-8 border-t border-[#eee] flex items-center justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-[#777] uppercase mb-1">Listing Price</p>
                    <p className="text-3xl font-black text-[#d37e2f]">
                      {selectedOffer.price ? `PKR ${selectedOffer.price}` : selectedOffer.type === 'exchange' ? 'TRADE' : 'FREE'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedOffer(null);
                      handleContact();
                    }}
                    className="flex-1 bg-[#409d69] hover:bg-[#358759] text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <FaComments size={20} /> Interested
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