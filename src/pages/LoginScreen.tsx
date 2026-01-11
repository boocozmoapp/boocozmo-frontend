/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/LoginScreen.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaGoogle, FaEnvelope, FaFeatherAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onLoginSuccess: (user: { email: string; name: string; id: string; token: string }) => void;
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
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkExistingSession();
  }, [onLoginSuccess]);

  // Google OAuth - Direct to Supabase
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setError(null);

    const frontendUrl = window.location.origin;
    const redirectUrl = `${frontendUrl}/auth/callback`;
    const supabaseUrl = `https://ffbilizmhmnkjapgdzdk.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;

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
      if (data.user && data.token) {
        user = {
          id: data.user.id.toString(),
          name: data.user.name || data.user.username || "User",
          email: data.user.email,
          token: data.token,
        };
      } else if (data.id && data.token) {
        user = {
          id: data.id.toString(),
          name: data.name || data.username || "User",
          email: data.email,
          token: data.token,
        };
      } else {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("user", JSON.stringify(user));
      onLoginSuccess(user);
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
      window.history.replaceState({}, document.title, "/login");
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-[#fdfaf5] overflow-hidden font-serif text-[#382110] leading-relaxed">
      {/* Background Layers – same universe as Welcome */}
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

      {/* Tiny bookmark ribbon */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-48 opacity-35 pointer-events-none z-10">
        <div className="w-full h-full bg-gradient-to-b from-[#8B0000] via-[#A52A2A] to-transparent rounded-t-full" />
      </div>

      {/* Header with logo */}
      <header className="sticky top-0 left-0 right-0 h-20 px-6 md:px-12 flex items-center justify-between z-50 bg-[#fdfaf5]/92 backdrop-blur-sm border-b border-[#d9c9b8]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#382110] rounded-sm flex items-center justify-center text-white text-xl">
            <FaFeatherAlt />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Boocozmo</h1>
        </div>
      </header>

      <div className="relative z-10 pt-16 pb-16 px-6 md:px-12 max-w-md mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="w-full bg-white/65 backdrop-blur-sm border border-[#d9c9b8] rounded-lg p-8 md:p-10 shadow-md"
        >
          {/* Title */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Welcome Back</h2>
            <p className="text-[#5c4033] text-sm md:text-base">Return to your shelves of stories</p>
          </div>

          {/* Error message */}
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

          {/* Email Form */}
          <form onSubmit={handleLogin} className="space-y-5">
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#d9c9b8] rounded px-4 py-3 bg-white/70 focus:border-[#382110] focus:ring-1 focus:ring-[#382110]/50 outline-none text-[#382110] placeholder-[#8b6f47]"
              autoComplete="current-password"
              required
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setError("Password reset coming soon...")}
                className="text-sm text-[#5c4033] hover:text-[#382110] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#382110] hover:bg-[#2a190c] text-white font-medium py-3 rounded shadow-md transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <FaEnvelope size={16} />
              {loading ? "Signing in..." : "Sign in with Email"}
            </motion.button>
          </form>

          {/* Signup link */}
          <div className="text-center mt-8 text-sm text-[#5c4033]">
            Not yet part of the society?{" "}
            <button
              onClick={onGoToSignup}
              className="text-[#382110] font-medium hover:underline transition-all"
            >
              Create an account
            </button>
          </div>

          {/* Demo hint */}
          <div className="mt-10 p-4 bg-[#fdfaf5]/80 border border-[#d9c9b8]/70 rounded text-xs text-[#5c4033] text-center">
            <p className="font-medium mb-1">Demo Account (testing only)</p>
            <p>Email: demo@boocozmo.com</p>
            <p>Password: demo123</p>
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