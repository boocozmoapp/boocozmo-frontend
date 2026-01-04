/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/LoginScreen.tsx - GREEN ENERGY THEME: Calm, Sustainable, Professional
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onLoginSuccess: (user: { email: string; name: string; id: string; token: string }) => void;
  onGoToSignup: () => void;
};

const GREEN = {
  dark: "#0F2415",           // Deep forest green background
  medium: "#1A3A2A",         // Card background
  accent: "#4A7C59",         // Soft sage green for accents
  accentLight: "#6BA87A",
  textPrimary: "#E8F0E8",    // Soft off-white
  textSecondary: "#A8B8A8",  // Muted green
  textMuted: "#80A080",      // ← Added this line
  border: "rgba(74, 124, 89, 0.3)",
  grayLight: "#2A4A3A",
  error: "#FF6B6B",          // Soft red for errors
};

export default function LoginScreen({ onLoginSuccess, onGoToSignup }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

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
            return;
          }
        }
      } catch {
        console.log("No valid session");
      } finally {
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [onLoginSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid email or password");
        if (res.status === 400) throw new Error(data.error || "Email and password required");
        if (res.status === 429) throw new Error("Too many attempts. Try again later.");
        throw new Error(data.error || "Login failed");
      }

      if (!data.id || !data.email || !data.name || !data.token) {
        throw new Error("Invalid response from server");
      }

      const user = {
        id: data.id.toString(),
        name: data.name,
        email: data.email,
        token: data.token,
      };

      localStorage.setItem("user", JSON.stringify(user));
      onLoginSuccess(user);

      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };


  if (checkingSession) {
    return (
      <div style={{
        minHeight: "100vh",
        background: GREEN.dark,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: `4px solid ${GREEN.accent}`,
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(to bottom, ${GREEN.dark} 0%, #0A1C10 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Login Card - Clean & Compact */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: GREEN.medium,
          borderRadius: "24px",
          padding: "48px 32px",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.3)",
          border: `1px solid ${GREEN.border}`,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: GREEN.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 24px rgba(74, 124, 89, 0.3)",
            }}
          >
            <span style={{ fontSize: "36px", fontWeight: "800", color: "white" }}>B</span>
          </div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: GREEN.textPrimary, margin: 0 }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: "0.95rem", color: GREEN.textSecondary, marginTop: "8px" }}>
            Sign in to your book community
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Email */}
          <div style={{ position: "relative" }}>
            <FaEnvelope
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: GREEN.textMuted,
                fontSize: "18px",
              }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="Email address"
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 14px 14px 48px",
                borderRadius: "16px",
                border: `1px solid ${error ? GREEN.error : GREEN.border}`,
                background: GREEN.grayLight,
                color: GREEN.textPrimary,
                fontSize: "15px",
                outline: "none",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ position: "relative" }}>
            <FaLock
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: GREEN.textMuted,
                fontSize: "18px",
              }}
            />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Password"
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 14px 14px 48px",
                borderRadius: "16px",
                border: `1px solid ${error ? GREEN.error : GREEN.border}`,
                background: GREEN.grayLight,
                color: GREEN.textPrimary,
                fontSize: "15px",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: GREEN.textSecondary,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          {/* Forgot Password */}
          <div style={{ textAlign: "right" }}>
            <button
              type="button"
              onClick={() => alert("Forgot password feature coming soon!")}
              disabled={loading}
              style={{
                background: "none",
                border: "none",
                color: GREEN.accent,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Forgot password?
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(255, 107, 107, 0.1)",
              padding: "12px",
              borderRadius: "12px",
              color: GREEN.error,
              fontSize: "14px",
              textAlign: "center",
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              background: loading ? GREEN.grayLight : GREEN.accent,
              color: "white",
              border: "none",
              borderRadius: "16px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: "2px solid white",
                    borderTopColor: "transparent",
                  }}
                />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Sign Up Link */}
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <span style={{ color: GREEN.textSecondary, fontSize: "15px" }}>
              Don't have an account?{" "}
            </span>
            <button
              type="button"
              onClick={onGoToSignup}
              disabled={loading}
              style={{
                background: "none",
                border: "none",
                color: GREEN.accent,
                fontSize: "15px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Create one
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}