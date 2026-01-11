/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/LoginScreen.tsx - DIRECT SUPABASE OAUTH VERSION
import React, { useState, useEffect } from "react";
import { FaGoogle, FaEnvelope } from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onLoginSuccess: (user: { email: string; name: string; id: string; token: string }) => void;
  onGoToSignup: () => void;
};

export default function LoginScreen({ onLoginSuccess, onGoToSignup }: Props) {
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

  // Google OAuth Login - DIRECT TO SUPABASE
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setError(null);
    
    console.log("🚀 Starting Google OAuth...");
    
    // Direct Supabase OAuth URL (NO backend involved!)
    const frontendUrl = window.location.origin; // e.g., http://localhost:5173 or https://yourdomain.com
    const redirectUrl = `${frontendUrl}/auth/callback`;
    const supabaseUrl = `https://ffbilizmhmnkjapgdzdk.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
    
    console.log("🔗 Direct Supabase OAuth URL:", supabaseUrl);
    console.log("🌐 Frontend URL:", frontendUrl);
    console.log("📍 Redirect URL:", redirectUrl);
    
    // Redirect immediately to Supabase
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
      
      console.log("🔍 Login API Response:", data);
      console.log("🔍 Login API Status:", res.status);
      
      if (!res.ok) {
        throw new Error(data.error || data.message || "Login failed");
      }

      // Extract user info
      let user;
      
      if (data.user && data.token) {
        // Structure: { user: { id, name, email }, token }
        user = {
          id: data.user.id.toString(),
          name: data.user.name || data.user.username || "User",
          email: data.user.email,
          token: data.token,
        };
      } else if (data.id && data.token) {
        // Structure: { id, name, email, token }
        user = {
          id: data.id.toString(),
          name: data.name || data.username || "User",
          email: data.email,
          token: data.token,
        };
      } else {
        throw new Error("Invalid login response");
      }

      console.log("✅ Login successful, user:", user);
      
      // Double-check required fields
      if (!user.email || !user.token) {
        throw new Error("Incomplete user data received");
      }

      localStorage.setItem("user", JSON.stringify(user));
      onLoginSuccess(user);
      
    } catch (err: any) {
      console.error("❌ Login error details:", err);
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Clear any OAuth state
  useEffect(() => {
    // Check for any error in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    
    if (error) {
      setError(`Authentication error: ${error}`);
      // Clean URL
      window.history.replaceState({}, document.title, "/login");
    }
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-12 sm:pt-20 px-4">
      <div className="w-full max-w-[350px] space-y-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-[#382110] tracking-tight">Boocozmo</h1>
          <p className="text-xs text-[#555] mt-2 font-sans">Login to your account</p>
        </div>

        {/* Google OAuth Button */}
        <button 
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full border border-[#4285F4] bg-white hover:bg-[#f8f9fa] text-[#4285F4] font-medium py-2.5 rounded-[3px] flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-70"
        >
          <FaGoogle className="text-[#4285F4]" size={18} />
          {googleLoading ? "Redirecting to Google..." : "Continue with Google"}
        </button>

        {/* Divider */}
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-[#d8d8d8]"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase">OR</span>
          <div className="flex-grow border-t border-[#d8d8d8]"></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          {error && (
            <div className="text-red-600 text-xs text-center border border-red-200 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#d8d8d8] rounded-[3px] px-3 py-2.5 text-sm focus:border-[#382110] focus:ring-1 focus:ring-[#382110] outline-none text-[#333] placeholder-gray-500 bg-white"
              autoComplete="email"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#d8d8d8] rounded-[3px] px-3 py-2.5 text-sm focus:border-[#382110] focus:ring-1 focus:ring-[#382110] outline-none text-[#333] placeholder-gray-500 bg-white"
              autoComplete="current-password"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setError("Password reset coming soon")}
              className="text-xs text-[#00635d] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#382110] hover:bg-[#2a190c] text-white font-bold py-2.5 rounded-[3px] shadow-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            <FaEnvelope size={14} />
            {loading ? "Signing in..." : "Sign in with Email"}
          </button>
        </form>

        <div className="text-center text-xs text-[#555] mt-4 pt-4 border-t border-[#eee]">
          By signing in, you agree to the Boocozmo{" "}
          <a href="#" className="text-[#00635d] hover:underline">Terms of Service</a> and{" "}
          <a href="#" className="text-[#00635d] hover:underline">Privacy Policy</a>.
        </div>

        <div className="text-center text-sm mt-6 pt-4 border-t border-[#eee]">
          Not a member?{" "}
          <button onClick={onGoToSignup} className="text-[#00635d] font-medium hover:underline">
            Create an account
          </button>
        </div>

        {/* Demo Account Hint */}
        <div className="text-center text-xs text-gray-400 mt-6 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="font-medium mb-1">Demo Account (for testing):</p>
          <p className="mb-1">Email: demo@boocozmo.com</p>
          <p>Password: demo123</p>
        </div>

        {/* Debug info - remove in production */}
        <div className="text-center text-xs text-gray-400 mt-4 p-2 bg-gray-50 rounded">
          <p className="font-medium mb-1">Debug Info:</p>
          <p>URL: {window.location.pathname}</p>
          <p>Origin: {window.location.origin}</p>
          <p>Has error param: {new URLSearchParams(window.location.search).get("error") ? "Yes" : "No"}</p>
          <p>Has token param: {new URLSearchParams(window.location.search).get("token") ? "Yes" : "No"}</p>
          <p>Has hash: {window.location.hash ? "Yes" : "No"}</p>
        </div>
      </div>
    </div>
  );
}