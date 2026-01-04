/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/OfferScreen.tsx - PREMIUM THEME
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft, FaCamera, FaMapMarkerAlt, FaDollarSign, FaExchangeAlt, 
  FaPaperPlane, FaTimes, FaHome, FaMapMarkedAlt, FaPlus, FaComments, 
  FaBell, FaBookmark, FaCompass, FaBookOpen, FaStar, FaUsers, FaBars
} from "react-icons/fa";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

const createCustomIcon = () => {
  return L.divIcon({
    className: "custom-offer-marker",
    html: `
      <div style="width: 48px; height: 48px; border-radius: 50%; background: #d97706; border: 4px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); cursor: move;">
        📚
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
};

type Props = {
  onBack?: () => void;
  currentUser: { email: string; name: string; id: string; token: string };
  onProfilePress?: () => void;
  onMapPress?: () => void;
  onAddPress?: () => void;
};

export default function OfferScreen({ onBack, currentUser, onProfilePress }: Props) {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<"Excellent" | "Very Good" | "Good" | "Fair">("Excellent");
  const [action, setAction] = useState<"sell" | "trade">("sell");
  const [price, setPrice] = useState("");
  const [exchangeBook, setExchangeBook] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationSet, setLocationSet] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initializeMap = useCallback(() => {
    if (!mapRef.current) return;
    const defaultLat = latitude ?? 40.7128; // Default NYC
    const defaultLng = longitude ?? -74.006;
    
    if (mapInstance.current) mapInstance.current.remove();
    
    const map = L.map(mapRef.current, { center: [defaultLat, defaultLng], zoom: 15, zoomControl: false });
    mapInstance.current = map;
    
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 20 }).addTo(map);
    
    const marker = L.marker([defaultLat, defaultLng], { icon: createCustomIcon(), draggable: true }).addTo(map);
    markerInstance.current = marker;

    marker.on("dragend", async () => {
      const pos = marker.getLatLng();
      setLatitude(pos.lat);
      setLongitude(pos.lng);
      setLocationSet(true);
      await reverseGeocode(pos.lat, pos.lng);
    });

    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setLatitude(lat);
      setLongitude(lng);
      setLocationSet(true);
      marker.setLatLng([lat, lng]);
      await reverseGeocode(lat, lng);
    });
  }, [latitude, longitude]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data.display_name) setCurrentAddress(data.display_name.split(',').slice(0, 3).join(','));
    } catch { setCurrentAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`); }
  };

  useEffect(() => {
    if (navigator.geolocation && !locationSet) {
       navigator.geolocation.getCurrentPosition(
          (pos) => {
             setLatitude(pos.coords.latitude);
             setLongitude(pos.coords.longitude);
             setLocationSet(true);
             reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          },
          () => { /* Access denied, use default */ }
       );
    }
  }, [locationSet]);

  useEffect(() => { setTimeout(initializeMap, 100); }, [initializeMap]);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("Image too large (max 5MB)");
    setImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!description.trim()) return setError("Please describe the book");
    if (action === "sell" && (!price || isNaN(Number(price)))) return setError("Enter a valid price");
    if (action === "trade" && !exchangeBook.trim()) return setError("Enter exchange details");
    if (!locationSet) return setError("Please confirm location on map");

    setLoading(true); setError(null);
    try {
      let imageBase64: string | null = null;
      if (image) {
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve) => { reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(image); });
      }

      await fetch(`${API_BASE}/submit-offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${currentUser.token}` },
        body: JSON.stringify({
          type: action === "sell" ? "sell" : "exchange",
          bookTitle: description.trim(),
          exchangeBook: action === "trade" ? exchangeBook.trim() : null,
          price: action === "sell" ? Number(price) : null,
          latitude: latitude!,
          longitude: longitude!,
          image: imageBase64,
          condition,
          ownerEmail: currentUser.email,
        }),
      });
      
      setSuccess(true);
      setTimeout(() => {
         if (onBack) onBack();
         else navigate("/");
      }, 1500);
    } catch (e: any) { setError(e.message || "Failed"); } 
    finally { setLoading(false); }
  };

  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaMapMarkedAlt, label: "Map", onClick: () => navigate("/map") },
    { icon: FaBookOpen, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaCompass, label: "Discover", onClick: () => navigate("/discover") },
    { icon: FaBookmark, label: "Saved", onClick: () => navigate("/saved") },
    { icon: FaUsers, label: "Following", onClick: () => navigate("/following") },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
  ];

  return (
    <div className="h-screen w-full bg-primary flex overflow-hidden font-sans text-text-main">
      <AnimatePresence>
        {sidebarOpen && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden" />}
      </AnimatePresence>
      <motion.aside initial={false} animate={{ width: sidebarOpen ? 260 : 80 }} className="hidden md:flex flex-col bg-primary-light/80 backdrop-blur-xl border-r border-white/5 z-50 overflow-hidden">
        <div className="p-6 flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white text-xl font-bold font-serif">B</div>{sidebarOpen && <span className="font-serif font-bold text-xl text-white">Boocozmo</span>}</div>
        <nav className="flex-1 px-4 space-y-2">{navItems.map(item => (<button key={item.label} onClick={item.onClick} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all"><item.icon size={20} />{sidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}</button>))}</nav>
      </motion.aside>

      <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-primary via-primary-light/20 to-primary relative overflow-hidden">
         <header className="h-20 px-6 flex items-center justify-between border-b border-white/5 bg-primary/80 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-4">
               <button onClick={onBack || (() => navigate(-1))} className="p-2 text-white hover:text-secondary"><FaArrowLeft /></button>
               <h1 className="text-2xl font-serif font-bold text-white">Share a Book</h1>
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 text-white"><FaBars /></button>
         </header>

         <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Left Column - Form */}
               <div className="space-y-6">
                  {/* Photo Upload */}
                  <div onClick={() => fileInputRef.current?.click()} className="h-64 rounded-3xl border-2 border-dashed border-white/20 hover:border-secondary flex flex-col items-center justify-center bg-primary-light/30 cursor-pointer relative overflow-hidden group">
                     {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <>
                        <FaCamera className="text-4xl text-gray-400 mb-2 group-hover:text-secondary transition-colors" />
                        <span className="text-sm text-gray-400">Tap to upload cover</span>
                     </>}
                     {imagePreview && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold">Change Photo</div>}
                     <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImagePick} />
                  </div>

                  {/* Details Form */}
                  <div className="bg-primary-light/30 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                     <h3 className="text-lg font-bold text-white mb-4">Book Details</h3>
                     <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Book Title & Description..." className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 min-h-[100px] mb-4 focus:border-secondary outline-none" />
                     
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        {['Excellent', 'Very Good', 'Good', 'Fair'].map((c: any) => (
                           <button key={c} onClick={() => setCondition(c)} className={`py-2 rounded-lg text-sm font-medium border ${condition === c ? 'bg-secondary border-secondary text-white' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>{c}</button>
                        ))}
                     </div>

                     <div className="flex gap-4 mb-4">
                        <button onClick={() => setAction('sell')} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold ${action === 'sell' ? 'bg-secondary text-white' : 'bg-white/5 text-gray-400'}`}><FaDollarSign /> Sell</button>
                        <button onClick={() => setAction('trade')} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold ${action === 'trade' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}><FaExchangeAlt /> Trade</button>
                     </div>

                     {action === 'sell' ? (
                        <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price ($)" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-secondary outline-none" />
                     ) : (
                        <input value={exchangeBook} onChange={e => setExchangeBook(e.target.value)} placeholder="Trading for..." className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-secondary outline-none" />
                     )}
                  </div>
               </div>

               {/* Right Column - Map & Submit */}
               <div className="flex flex-col h-full">
                  <div className="flex-1 bg-white/5 rounded-3xl overflow-hidden relative border border-white/10 min-h-[300px] mb-6">
                     <div ref={mapRef} className="absolute inset-0 z-0" />
                     <div className="absolute bottom-4 left-4 right-4 bg-primary/90 backdrop-blur-md p-3 rounded-xl border border-white/10 z-10">
                        <div className="flex items-center gap-3 text-sm text-gray-300">
                           <FaMapMarkerAlt className="text-secondary" />
                           <span className="truncate">{currentAddress || "Tap map to set location"}</span>
                        </div>
                     </div>
                  </div>

                  {error && <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm mb-4 text-center">{error}</div>}
                  {success && <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-sm mb-4 text-center">Book posted successfully!</div>}

                  <button onClick={handleSubmit} disabled={loading || success} className="w-full py-4 bg-secondary text-white rounded-2xl font-bold text-lg shadow-lg shadow-secondary/20 hover:bg-secondary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                     {loading ? "Posting..." : <><FaPaperPlane /> Post Book</>}
                  </button>
               </div>
            </div>
         </main>
      </div>
    </div>
  );
}