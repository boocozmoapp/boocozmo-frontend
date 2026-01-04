/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/SignupScreen.tsx - MINIMAL GOODREADS STYLE
import React, { useState, useEffect } from "react";
import { FaAmazon, FaApple, FaMapMarkerAlt, FaCrosshairs } from "react-icons/fa";
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

type Props = {
  onSignupSuccess: (user: { email: string; name: string; id: string; token: string }) => void;
  onGoToLogin: () => void;
};

function LocationMarker({ position, setPosition }: { position: { lat: number; lng: number } | null, setPosition: (pos: { lat: number; lng: number }) => void }) {
  const map = useMapEvents({
    click(e: LeafletMouseEvent) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (position) map.flyTo(position, map.getZoom());
  }, [position, map]);

  return position ? <Marker position={position} /> : null;
}

export default function SignupScreen({ onSignupSuccess, onGoToLogin }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Location State
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [locationName, setLocationName] = useState("");

  const handleAutoDetect = () => {
     if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
           setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
           setShowMap(true);
           setLocationName(`Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`);
        });
     } else {
        alert("Geolocation not supported");
     }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return setError("All fields are required");

    setLoading(true);
    setError(null);

    try {
      // 1. Signup
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      const user = {
        id: data.id.toString(),
        name: data.name,
        email: data.email,
        token: data.token,
      };

      // 2. Update Location (if selected)
      if (location) {
         try {
            await fetch(`${API_BASE}/update-profile`, {
               method: 'PATCH',
               headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
               body: JSON.stringify({
                  // Store coordinates in location string as fallback/primary parsing source
                  location: `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`, 
                  latitude: location.lat,
                  longitude: location.lng
               })
            });
         } catch (locErr) {
            console.error("Failed to save location", locErr);
            // Continue anyway, signup was successful
         }
      }

      localStorage.setItem("user", JSON.stringify(user));
      onSignupSuccess(user);
    } catch (err: any) {
      setError(err.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-8 sm:pt-16 px-4 pb-10">
      <div className="w-full max-w-[400px] space-y-4">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-serif font-bold text-[#382110] tracking-tight">Boocozmo</h1>
          <p className="text-xs text-[#555] mt-1 font-sans uppercase tracking-widest">Join the Society of Seekers</p>
        </div>

        {/* Social Buttons */}
        <button className="w-full border border-[#d8d8d8] bg-[#fcd46e] hover:bg-[#fbc649] text-black font-medium py-2 rounded-[3px] flex items-center justify-center gap-2 shadow-sm transition-colors">
          <FaAmazon /> Sign up with Amazon
        </button>
        <button className="w-full border border-[#ccc] bg-white hover:bg-[#f4f1ea] text-black font-medium py-2 rounded-[3px] flex items-center justify-center gap-2 shadow-sm transition-colors">
          <FaApple /> Sign up with Apple
        </button>

        {/* Divider */}
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-[#d8d8d8]"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase">OR</span>
          <div className="flex-grow border-t border-[#d8d8d8]"></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSignup} className="space-y-3">
          {error && <div className="text-red-600 text-xs text-center border border-red-200 bg-red-50 p-2 rounded">{error}</div>}
          
          <div>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#d8d8d8] rounded-[3px] px-3 py-2 text-sm focus:border-[#382110] focus:ring-1 focus:ring-[#382110] outline-none text-[#333] placeholder-gray-500 bg-white"
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#d8d8d8] rounded-[3px] px-3 py-2 text-sm focus:border-[#382110] focus:ring-1 focus:ring-[#382110] outline-none text-[#333] placeholder-gray-500 bg-white"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#d8d8d8] rounded-[3px] px-3 py-2 text-sm focus:border-[#382110] focus:ring-1 focus:ring-[#382110] outline-none text-[#333] placeholder-gray-500 bg-white"
            />
          </div>

          {/* Location Picker */}
          <div className="border border-[#d8d8d8] rounded-[3px] p-3 bg-[#f9f9f9]">
             <label className="block text-xs font-bold text-[#382110] mb-2 uppercase tracking-wide flex items-center gap-2">
                <FaMapMarkerAlt /> Set Your Location
             </label>
             
             {!showMap ? (
                <div className="flex gap-2">
                   <button type="button" onClick={handleAutoDetect} className="flex-1 bg-white border border-[#ccc] py-2 text-xs font-bold text-[#555] hover:bg-[#eee] flex items-center justify-center gap-1">
                      <FaCrosshairs /> Auto Detect
                   </button>
                   <button type="button" onClick={() => setShowMap(true)} className="flex-1 bg-white border border-[#ccc] py-2 text-xs font-bold text-[#555] hover:bg-[#eee]">
                      Point on Map
                   </button>
                </div>
             ) : (
                <div className="space-y-2">
                   <div className="h-40 w-full rounded border border-[#ccc] overflow-hidden relative z-0">
                      <MapContainer center={location || { lat: 40.7128, lng: -74.0060 }} zoom={13} style={{ height: "100%", width: "100%" }}>
                         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                         <LocationMarker position={location} setPosition={setLocation} />
                      </MapContainer>
                   </div>
                   <div className="flex justify-between items-center text-xs text-[#555]">
                      <span>{location ? "Location selected" : "Tap map to select"}</span>
                      <button type="button" onClick={() => setShowMap(false)} className="underline text-red-500">Close Map</button>
                   </div>
                </div>
             )}
             <p className="text-[10px] text-[#777] mt-2 leading-tight">
                We use your location to curate the closest book offers for neighborhood exchange.
             </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#382110] hover:bg-[#2a190c] text-white font-bold py-2 rounded-[3px] shadow-sm transition-colors disabled:opacity-70 mt-4"
          >
            {loading ? "Creating Account..." : "Sign up"}
          </button>
        </form>

        <div className="text-center text-sm mt-6 pt-4 border-t border-[#eee]">
           Already a member? <button onClick={onGoToLogin} className="text-[#00635d] hover:underline">Sign in</button>
        </div>
      </div>
    </div>
  );
}