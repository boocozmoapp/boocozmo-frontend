/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/LoginScreen.tsx - UPDATED WITH FIXED GOOGLE OAUTH
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaGoogle, FaEnvelope, FaFeatherAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onLoginSuccess: (user: { email: string; name: string; id: string; token: string; profilePhoto?: string | null }) => void;
  onGoToSignup: () => void;
};

export default function LoginScreen({ onLoginSuccess, onGoToSignup }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const response = await fetch(`${API_BASE}/validate-session`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });

          if (response.ok) {
            onLoginSuccess(user);
            navigate("/home", { replace: true });
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkExistingSession();
  }, [onLoginSuccess, navigate]);

  // Google OAuth - Fixed Supabase URL
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setError(null);

    const frontendUrl = window.location.origin;
    const redirectUrl = `${frontendUrl}/auth/callback`;
    
    // FIXED: Added response_type=token and proper encoding
    const supabaseUrl = `https://ffbilizmhmnkjapgdzdk.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}&response_type=token`;
    
    console.log("🔐 Google OAuth: Redirecting to Supabase");
    console.log("📋 Redirect URL:", redirectUrl);
    console.log("🔗 Supabase URL:", supabaseUrl);
    
    // Clear any existing errors
    window.history.replaceState({}, document.title, "/login");
    
    // Redirect to Supabase
    window.location.href = supabaseUrl;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError("Please enter email and password");

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Login failed");
      }

      let user;
      if (data.id && data.token) {
        // Fetch full profile to get profilePhoto since /login doesn't return it
        let profilePhoto = null;
        try {
          const pResp = await fetch(`${API_BASE}/profile/${data.email}`, {
            headers: { Authorization: `Bearer ${data.token}` }
          });
          if (pResp.ok) {
            const pData = await pResp.json();
            profilePhoto = pData.profilePhoto;
          }
        } catch (e) {
          console.warn("Could not fetch profile photo on login", e);
        }

        user = {
          id: data.id.toString(),
          name: data.name || "User",
          email: data.email,
          token: data.token,
          profilePhoto: profilePhoto
        };
      } else {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("user", JSON.stringify(user));
      onLoginSuccess(user);

      // Immediately redirect to home after success
      navigate("/home", { replace: true });

    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth callback errors from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get("error");
    const errorDescription = urlParams.get("error_description");
    
    if (errorParam) {
      const errorMsg = errorDescription || errorParam;
      setError(`Authentication error: ${errorMsg}`);
      // Clean the URL
      window.history.replaceState({}, document.title, "/login");
    }
  }, []);

  // Also check hash for errors (common with OAuth)
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const errorHash = hashParams.get("error");
      const errorDesc = hashParams.get("error_description");
      
      if (errorHash) {
        setError(`OAuth error: ${errorDesc || errorHash}`);
        window.history.replaceState({}, document.title, "/login");
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfaf5] flex flex-col font-serif text-[#382110]">
      {/* Top Half - Hero with Curved Bottom */}
      <div className="relative h-[40vh] md:h-[45vh] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop')",
          }}
        >
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#382110]/60 to-[#382110]/20" />
        </div>
        
        {/* Curved Bottom Mask */}
        <div 
          className="absolute bottom-[-1px] left-0 right-0 h-20 bg-[#fdfaf5]"
          style={{ 
            clipPath: "ellipse(70% 100% at 50% 100%)" 
          }}
        />

        {/* Logo/Identity in Hero */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl mb-4 border border-white/30"
          >
            <FaFeatherAlt />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold tracking-tight"
          >
            Boocozmo
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-white/80 text-sm tracking-[0.2em] mt-2 uppercase"
          >
            Where Stories Breathe
          </motion.p>
        </div>
      </div>

      {/* Bottom Half - Form Section */}
      <div className="flex-1 px-6 pb-12 -mt-8 relative z-20">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold">Welcome Back</h2>
            <p className="text-[#8b6f47] mt-1 italic">The society has missed you</p>
          </motion.div>

          {/* Form and Social Login */}
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

            {/* Email Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-widest font-bold text-[#8b6f47] ml-1">Email</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b6f47]">
                    <FaEnvelope size={14} />
                  </span>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border-2 border-transparent focus:border-[#382110] rounded-2xl py-4 pl-12 pr-4 outline-none transition-all shadow-sm focus:shadow-md placeholder-[#d9c9b8] text-[#382110]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs uppercase tracking-widest font-bold text-[#8b6f47]">Password</label>
                  <button 
                    type="button"
                    onClick={() => setError("Feature coming soon.")}
                    className="text-[10px] uppercase tracking-tighter text-[#8b6f47] hover:text-[#382110]"
                  >
                    Forgot?
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-2 border-transparent focus:border-[#382110] rounded-2xl py-4 px-6 outline-none transition-all shadow-sm focus:shadow-md placeholder-[#d9c9b8] text-[#382110]"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-[#382110] text-white font-bold py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? "Authenticating..." : "Enter the Society"}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-[#d9c9b8]"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] uppercase font-bold tracking-[0.2em] text-[#8b6f47]">Or Seek Via</span>
              <div className="flex-grow border-t border-[#d9c9b8]"></div>
            </div>

            {/* Google Login */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full bg-white border-2 border-[#eee] text-[#382110] font-bold py-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <FaGoogle className="text-[#4285F4]" />
              {googleLoading ? "Connecting..." : "Google Account"}
            </motion.button>

            {/* Signup Redirect */}
            <div className="text-center pt-4">
              <p className="text-sm text-[#8b6f47]">
                New to the society?{" "}
                <button
                  onClick={onGoToSignup}
                  className="text-[#382110] font-bold underline hover:no-underline underline-offset-4"
                >
                  Request Entry
                </button>
              </p>
            </div>
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