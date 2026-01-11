/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/OfferScreen.tsx - BOOCOZMO LIGHT THEME
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaArrowLeft, FaCamera, FaMapMarkerAlt, FaDollarSign, FaExchangeAlt, 
  FaPaperPlane, FaTimes
} from "react-icons/fa";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

const createCustomIcon = () => {
  return L.divIcon({
    className: "custom-offer-marker",
    html: `
      <div style="width: 40px; height: 40px; border-radius: 50%; background: #382110; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); cursor: move;">
        📚
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

type Props = {
  onBack?: () => void;
  currentUser: { email: string; name: string; id: string; token: string };
  onProfilePress?: () => void;
  onMapPress?: () => void;
  onAddPress?: () => void;
};

export default function OfferScreen({ onBack, currentUser }: Props) {
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
    
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 20 }).addTo(map);
    
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

  return (
    <div className="min-h-screen bg-[#f4f1ea] font-sans text-[#333]">
       <header className="px-4 py-3 border-b border-[#d8d8d8] bg-white sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={onBack || (() => navigate(-1))} className="p-2 text-[#555] hover:bg-[#f4f1ea] rounded-full"><FaArrowLeft /></button>
             <h1 className="text-xl font-serif font-bold text-[#382110]">Post a Listing</h1>
          </div>
       </header>

       <main className="max-w-3xl mx-auto px-4 pb-8 pt-0 md:px-8 md:pb-8">
          {/* Instructional Poster */}
          <div className="mb-6 w-full bg-white border border-[#e8e0d5] rounded-lg p-5 relative overflow-hidden flex flex-col md:flex-row items-center gap-5">
              <div className="absolute top-0 right-0 w-1/4 h-full opacity-10 pointer-events-none grayscale">
                 <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80" className="w-full h-full object-cover" />
              </div>
              
              <div className="w-16 h-16 md:w-20 md:h-20 bg-[#f4f1ea] rounded-full flex-shrink-0 flex items-center justify-center text-[#382110] shadow-inner border border-[#e8e0d5]">
                 <FaPaperPlane size={24} className="opacity-40" />
              </div>

              <div className="z-10 text-center md:text-left flex-1">
                 <h2 className="text-xl font-serif font-bold text-[#382110] mb-1">Direct Community Posting</h2>
                 <div className="text-[#5c4a3c] text-xs leading-snug max-w-2xl">
                    <p>Post a book offer directly to the public without needing a library catalog first. Your offer will be immediately visible on the Home and Map screens.</p>
                 </div>
              </div>
          </div>

          <div className="bg-white rounded border border-[#d8d8d8] p-6 md:p-8 shadow-sm">
             
             {/* Photo Upload */}
             <div onClick={() => fileInputRef.current?.click()} className="h-56 rounded bg-[#f9f9f9] border-2 border-dashed border-[#ccc] hover:border-[#382110] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group mb-6 transition-colors">
                {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <>
                   <FaCamera className="text-3xl text-[#999] mb-2 group-hover:text-[#382110] transition-colors" />
                   <span className="text-xs text-[#777] font-bold uppercase">Upload Book Cover</span>
                </>}
                {imagePreview && <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold">Change</div>}
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImagePick} />
             </div>

             {/* Form Fields */}
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold uppercase text-[#555] mb-1">Book Title & Description</label>
                   <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. The Great Gatsby, decent condition..." className="w-full bg-white border border-[#d8d8d8] rounded p-3 text-[#333] placeholder-black focus:border-[#382110] focus:ring-1 focus:ring-[#382110] outline-none min-h-[100px]" />
                </div>

                <div>
                   <label className="block text-xs font-bold uppercase text-[#555] mb-1">Condition</label>
                   <div className="flex flex-wrap gap-2">
                      {['Excellent', 'Very Good', 'Good', 'Fair'].map((c: any) => (
                         <button key={c} onClick={() => setCondition(c)} className={`px-4 py-2 rounded-[3px] text-sm font-bold border transition-all ${condition === c ? 'bg-[#382110] text-white border-[#382110]' : 'bg-white text-[#555] border-[#d8d8d8] hover:bg-[#f4f1ea]'}`}>{c}</button>
                      ))}
                   </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-[#555] mb-1">I want to</label>
                    <div className="flex gap-4">
                       <button onClick={() => setAction('sell')} className={`flex-1 py-3 rounded-[3px] flex items-center justify-center gap-2 font-bold border ${action === 'sell' ? 'bg-[#d37e2f] text-white border-[#d37e2f]' : 'bg-white text-[#555] border-[#d8d8d8]'}`}><FaDollarSign /> Sell (PKR)</button>
                       <button onClick={() => setAction('trade')} className={`flex-1 py-3 rounded-[3px] flex items-center justify-center gap-2 font-bold border ${action === 'trade' ? 'bg-[#00635d] text-white border-[#00635d]' : 'bg-white text-[#555] border-[#d8d8d8]'}`}><FaExchangeAlt /> Trade/Exchange</button>
                    </div>
                </div>

                {action === 'sell' ? (
                   <div>
                      <label className="block text-xs font-bold uppercase text-[#555] mb-1">Price (PKR)</label>
                      <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className="w-full bg-white border border-[#d8d8d8] rounded p-3 text-[#333] placeholder-black focus:border-[#382110] focus:ring-1 focus:ring-[#382110] outline-none font-bold text-lg" />
                   </div>
                ) : (
                   <div>
                      <label className="block text-xs font-bold uppercase text-[#555] mb-1">Trading For</label>
                      <input value={exchangeBook} onChange={e => setExchangeBook(e.target.value)} placeholder="What book do you want?" className="w-full bg-white border border-[#d8d8d8] rounded p-3 text-[#333] placeholder-black focus:border-[#382110] focus:ring-1 focus:ring-[#382110] outline-none" />
                   </div>
                )}
             </div>

             {/* Map Section */}
             <div className="mt-8">
                 <label className="block text-xs font-bold uppercase text-[#555] mb-1">Location</label>
                 <div className="h-48 rounded bg-[#eee] relative border border-[#d8d8d8] overflow-hidden">
                     <div ref={mapRef} className="absolute inset-0 z-0" />
                     <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur px-3 py-2 rounded border border-[#ccc] flex items-center gap-2 text-xs text-[#333] z-10">
                        <FaMapMarkerAlt className="text-[#d37e2f]" />
                        <span className="truncate">{currentAddress || "Tap map to set location"}</span>
                     </div>
                 </div>
             </div>

             {/* Action Button */}
             <div className="mt-8 pt-6 border-t border-[#eee]">
                {error && <div className="p-3 bg-red-50 text-red-600 text-sm mb-4 border border-red-200 text-center">{error}</div>}
                
                <button onClick={handleSubmit} disabled={loading || success} className="w-full py-3 bg-[#409d69] hover:bg-[#358759] text-white rounded-[3px] font-bold text-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                   {loading ? "Posting..." : success ? "Posted!" : <><FaPaperPlane /> Post Listing</>}
                </button>
             </div>

          </div>
       </main>
    </div>
  );
}