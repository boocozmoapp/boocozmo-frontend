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
    <div className="relative min-h-screen bg-[#fdfaf5] overflow-hidden font-serif text-[#382110] leading-relaxed">
      {/* Background Layers */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-32 pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage:
            "url('https://media.istockphoto.com/id/1203011577/vector/newspaper-with-old-grunge-vintage-unreadable-paper-texture-background.jpg?s=612x612&w=0&k=20&c=b16KyYgiKLgpjf1Z18HDLjD4z3QfDB31e3tVgk-GoYk=')",
        }}
      />
      <div
        className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-paper.png')] opacity-18 pointer-events-none"
      />

      {/* Gentle vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(139,69,19,0.08) 100%)",
        }}
      />

      {/* Stitched side pages */}
      <div
        className="fixed top-0 bottom-0 left-0 w-[15vw] max-w-[190px] opacity-22 pointer-events-none z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "right center",
          transform: "skew(-5deg) translateX(-10px)",
          boxShadow: "inset -20px 0 40px rgba(0,0,0,0.28)",
        }}
      />
      <div
        className="fixed top-0 bottom-0 right-0 w-[15vw] max-w-[190px] opacity-22 pointer-events-none z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1589995632479-ab97cbddc28c?ixlib=rb-4.0.3&auto=format&fit=crop&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "left center",
          transform: "skew(5deg) translateX(10px)",
          boxShadow: "inset 20px 0 40px rgba(0,0,0,0.28)",
        }}
      />

      {/* Bookmark ribbon */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-48 opacity-35 pointer-events-none z-10">
        <div className="w-full h-full bg-gradient-to-b from-[#8B0000] via-[#A52A2A] to-transparent rounded-t-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 left-0 right-0 h-20 px-6 md:px-12 flex items-center justify-between z-50 bg-[#fdfaf5]/92 backdrop-blur-sm border-b border-[#d9c9b8]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#382110] rounded-sm flex items-center justify-center text-white text-xl">
            <FaFeatherAlt />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Boocozmo</h1>
        </div>
      </header>

      <div className="relative z-10 pt-16 pb-16 px-6 md:px-12 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="w-full bg-white/65 backdrop-blur-sm border border-[#d9c9b8] rounded-lg p-8 md:p-10 shadow-md"
        >
          {/* Title */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Join the Society</h2>
            <p className="text-[#5c4033] text-sm md:text-base">Become a seeker of stories and connections</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-50/80 border border-red-200 rounded text-red-700 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Google Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full mb-6 border border-[#4285F4]/40 bg-white/80 hover:bg-[#f8f9fa] text-[#4285F4] font-medium py-3 rounded shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-60"
          >
            <FaGoogle size={20} />
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </motion.button>

          {/* Divider */}
          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-[#d9c9b8]"></div>
            <span className="flex-shrink-0 mx-4 text-[#5c4033] text-xs uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-[#d9c9b8]"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#d9c9b8] rounded px-4 py-3 bg-white/70 focus:border-[#382110] focus:ring-1 focus:ring-[#382110]/50 outline-none text-[#382110] placeholder-[#8b6f47]"
              autoComplete="name"
              required
            />

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#d9c9b8] rounded px-4 py-3 bg-white/70 focus:border-[#382110] focus:ring-1 focus:ring-[#382110]/50 outline-none text-[#382110] placeholder-[#8b6f47]"
              autoComplete="email"
              required
            />

            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#d9c9b8] rounded px-4 py-3 bg-white/70 focus:border-[#382110] focus:ring-1 focus:ring-[#382110]/50 outline-none text-[#382110] placeholder-[#8b6f47]"
              autoComplete="new-password"
              required
            />

            {/* Location Picker */}
            <div className="border border-[#d9c9b8] rounded-lg p-4 bg-white/50">
              <label className="block text-sm font-bold text-[#382110] mb-3 flex items-center gap-2">
                <FaMapMarkerAlt /> Your Neighborhood (Optional)
              </label>

              {!showMap ? (
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    type="button"
                    onClick={handleAutoDetect}
                    className="py-3 px-4 bg-[#fdfaf5] border border-[#d9c9b8] rounded text-[#382110] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#f5f0e8] transition-colors"
                  >
                    <FaCrosshairs size={16} />
                    Auto Detect
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="py-3 px-4 bg-[#fdfaf5] border border-[#d9c9b8] rounded text-[#382110] text-sm font-medium hover:bg-[#f5f0e8] transition-colors"
                  >
                    Choose on Map
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="h-64 w-full rounded-lg border border-[#d9c9b8] overflow-hidden shadow-inner bg-[#fdfaf5]/50 relative z-0">
                    <MapContainer
                      center={location || { lat: 37.7749, lng: -122.4194 }} // Default: San Francisco
                      zoom={13}
                      style={{ height: "100%", width: "100%" }}
                      className="rounded-lg"
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      <LocationMarker position={location} setPosition={setLocation} />
                    </MapContainer>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#5c4033]">
                      {location ? "Location pinned" : "Click anywhere on the map"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMap(false)}
                      className="text-[#382110] hover:text-[#2a190c] underline text-sm transition-colors"
                    >
                      Hide Map
                    </button>
                  </div>
                </div>
              )}

              <p className="mt-3 text-xs text-[#5c4033]/80 leading-relaxed">
                Your location helps us show nearby book offers and neighborhood exchanges.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#382110] hover:bg-[#2a190c] text-white font-medium py-3 rounded shadow-md transition-all disabled:opacity-60 mt-4"
            >
              {loading ? "Creating your place..." : "Join the Society"}
            </motion.button>
          </form>

          {/* Login link */}
          <div className="text-center mt-8 text-sm text-[#5c4033]">
            Already part of the society?{" "}
            <button
              onClick={onGoToLogin}
              className="text-[#382110] font-medium hover:underline transition-all"
            >
              Sign in
            </button>
          </div>

          {/* Privacy */}
          <div className="text-center mt-6 text-xs text-[#5c4033]/80">
            By joining, you agree to our{" "}
            <a href="#" className="hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-auto py-8 text-center text-sm text-[#5c4033]/80 border-t border-[#d9c9b8]/30">
        <p>Boocozmo — Where Books Still Breathe • © 2026</p>
      </footer>
    </div>
  );
}