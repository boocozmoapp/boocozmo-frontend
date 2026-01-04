/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/LoginScreen.tsx - MINIMAL GOODREADS STYLE
import React, { useState, useEffect } from "react";
import { FaAmazon, FaApple, FaEnvelope } from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onLoginSuccess: (user: { email: string; name: string; id: string; token: string }) => void;
  onGoToSignup: () => void;
};

export default function LoginScreen({ onLoginSuccess, onGoToSignup }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
      if (!res.ok) throw new Error(data.error || "Login failed");

      const user = {
        id: data.id.toString(),
        name: data.name,
        email: data.email,
        token: data.token,
      };

      localStorage.setItem("user", JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-12 sm:pt-20 px-4">
      <div className="w-full max-w-[350px] space-y-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-[#382110] tracking-tight">Boocozmo</h1>
        </div>

        {/* Social Buttons (Mock) */}
        <button className="w-full border border-[#d8d8d8] bg-[#fcd46e] hover:bg-[#fbc649] text-black font-medium py-2 rounded-[3px] flex items-center justify-center gap-2 shadow-sm transition-colors">
          <FaAmazon /> Continue with Amazon
        </button>
        <button className="w-full border border-[#ccc] bg-white hover:bg-[#f4f1ea] text-black font-medium py-2 rounded-[3px] flex items-center justify-center gap-2 shadow-sm transition-colors">
          <FaApple /> Continue with Apple
        </button>

        {/* Divider */}
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-[#d8d8d8]"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase">OR</span>
          <div className="flex-grow border-t border-[#d8d8d8]"></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          {error && <div className="text-red-600 text-xs text-center border border-red-200 bg-red-50 p-2 rounded">{error}</div>}
          
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#d8d8d8] rounded-[3px] px-3 py-2 text-sm focus:border-[#382110] focus:ring-1 focus:ring-[#382110] outline-none text-[#333] placeholder-gray-500 bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#382110] hover:bg-[#2a190c] text-white font-bold py-2 rounded-[3px] shadow-sm transition-colors disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="text-center text-xs text-[#555] mt-4">
           By creating an account, you agree to the Boocozmo <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
        </div>

        <div className="text-center text-sm mt-6 pt-4 border-t border-[#eee]">
           Not a member? <button onClick={onGoToSignup} className="text-[#00635d] hover:underline">Sign up</button>
        </div>
      </div>
    </div>
  );
}