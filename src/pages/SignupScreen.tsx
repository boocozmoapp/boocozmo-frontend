/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/SignupScreen.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaGoogle, FaMapMarkerAlt, FaCrosshairs, FaFeatherAlt } from "react-icons/fa";
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

function LocationMarker({
  position,
  setPosition,
}: {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: { lat: number; lng: number }) => void;
}) {
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Location State
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [locationName, setLocationName] = useState("");

  const handleAutoDetect = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(newPos);
          setShowMap(true);
          setLocationName(`Lat: ${newPos.lat.toFixed(4)}, Lng: ${newPos.lng.toFixed(4)}`);
        },
        () => setError("Could not detect location. Please try manually."),
        { enableHighAccuracy: true }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // Google OAuth - Direct to Supabase
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setError(null);

    const frontendUrl = window.location.origin;
    const redirectUrl = `${frontendUrl}/auth/callback`;
    const supabaseUrl = `https://ffbilizmhmnkjapgdzdk.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
      redirectUrl
    )}`;

    window.location.href = supabaseUrl;
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

      // 2. Update Location if selected
      if (location) {
        try {
          await fetch(`${API_BASE}/update-profile`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${user.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              location: `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`,
              latitude: location.lat,
              longitude: location.lng,
            }),
          });
        } catch (locErr) {
          console.error("Failed to save location:", locErr);
          // Non-blocking – signup already succeeded
        }
      }

      localStorage.setItem("user", JSON.stringify(user));
      onSignupSuccess(user);
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth callback errors
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    if (errorParam) {
      setError(`Authentication error: ${errorParam}`);
      window.history.replaceState({}, document.title, "/signup");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfaf5] flex flex-col font-serif text-[#382110]">
      {/* Top Half - Hero with Curved Bottom */}
      <div className="relative h-[30vh] md:h-[35vh] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=2000&auto=format&fit=crop')",
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#382110]/50 to-[#382110]/20" />
        </div>
        
        {/* Curved Bottom Mask */}
        <div 
          className="absolute bottom-[-1px] left-0 right-0 h-16 bg-[#fdfaf5]"
          style={{ 
            clipPath: "ellipse(70% 100% at 50% 100%)" 
          }}
        />

        {/* Identity in Hero */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-2xl mb-3 border border-white/30"
          >
            <FaFeatherAlt />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-3xl md:text-4xl font-bold tracking-tight"
          >
            Join Boocozmo
          </motion.h1>
        </div>
      </div>

      {/* Bottom Section - Form */}
      <div className="flex-1 px-6 pb-12 -mt-6 relative z-20">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold">Request Entry</h2>
            <p className="text-[#8b6f47] mt-1 italic text-sm">Become a seeker of stories and connections</p>
          </motion.div>

          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Google Signup - HIDDEN FOR BETA */}
            {/*
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full bg-white border-2 border-[#eee] text-[#382110] font-bold py-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <FaGoogle className="text-[#4285F4]" />
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </motion.button>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-[#d9c9b8]"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] uppercase font-bold tracking-[0.2em] text-[#8b6f47]">Or Registry Via</span>
              <div className="flex-grow border-t border-[#d9c9b8]"></div>
            </div>
            */}

            {/* Registration Form */}
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest font-bold text-[#8b6f47] ml-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border-2 border-transparent focus:border-[#382110] rounded-2xl py-4 px-6 outline-none transition-all shadow-sm focus:shadow-md placeholder-[#d9c9b8] text-[#382110]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-widest font-bold text-[#8b6f47] ml-1">Email</label>
                  <input
                    type="email"
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border-2 border-transparent focus:border-[#382110] rounded-2xl py-4 px-6 outline-none transition-all shadow-sm focus:shadow-md placeholder-[#d9c9b8] text-[#382110]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-widest font-bold text-[#8b6f47] ml-1">Secure Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-2 border-transparent focus:border-[#382110] rounded-2xl py-4 px-6 outline-none transition-all shadow-sm focus:shadow-md placeholder-[#d9c9b8] text-[#382110]"
                  required
                />
              </div>

              {/* Enhanced Location Section */}
              <div className="bg-[#f2ede4] rounded-3xl p-5 border border-[#d9c9b8]/50">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                       <FaMapMarkerAlt className="text-[#8b4513]" /> Your Neighborhood
                    </h3>
                    <p className="text-[11px] text-[#8b6f47] italic">For local book exchanges</p>
                  </div>
                  {!showMap ? (
                    <button 
                      type="button" 
                      onClick={() => setShowMap(true)}
                      className="text-xs font-bold text-[#382110] underline"
                    >
                      Show Map
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => setShowMap(false)}
                      className="text-xs font-bold text-[#382110] underline"
                    >
                      Hide Map
                    </button>
                  )}
                </div>

                {!showMap ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAutoDetect}
                      className="flex-1 bg-white hover:bg-[#faf8f5] py-3 rounded-xl border border-[#d9c9b8] transition-all flex items-center justify-center gap-2 text-xs font-bold"
                    >
                      <FaCrosshairs className="text-[#382110]" /> Auto Detect
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="flex-1 bg-white hover:bg-[#faf8f5] py-3 rounded-xl border border-[#d9c9b8] transition-all text-xs font-bold"
                    >
                      Select Manually
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="h-56 w-full rounded-2xl border-2 border-white overflow-hidden shadow-inner relative z-0">
                      <MapContainer
                        center={location || { lat: 37.7749, lng: -122.4194 }}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationMarker position={location} setPosition={setLocation} />
                      </MapContainer>
                    </div>
                    {location && (
                      <p className="text-[10px] text-center bg-white/50 py-1 rounded-full text-[#8b6f47]">
                        Pin set at {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-[#382110] text-white font-bold py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 mt-4"
              >
                {loading ? "Creating Account..." : "Join the Society"}
              </motion.button>
            </form>

            {/* Login Redirect */}
            <div className="text-center pt-2">
              <p className="text-sm text-[#8b6f47]">
                Already a seeker?{" "}
                <button
                  onClick={onGoToLogin}
                  className="text-[#382110] font-bold underline hover:no-underline underline-offset-4"
                >
                  Enter the Society
                </button>
              </p>
            </div>
            
            <p className="text-[10px] text-center text-[#8b6f47]/60 px-8">
              By joining, you agree to our Terms of Service & Privacy Policy. 
              We respect your story and your data.
            </p>
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="py-6 text-center text-[10px] uppercase tracking-widest text-[#8b6f47] opacity-60">
        &copy; 2026 Boocozmo Society &bull; All Rights Reserved
      </footer>
    </div>
  );
}