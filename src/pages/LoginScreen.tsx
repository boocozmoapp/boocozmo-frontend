// src/pages/LoginScreen.tsx - PINTEREST-STYLE (Fixed: Token + No Dark Overlay Bug)
import { useState } from "react";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onLoginSuccess: (user: { email: string; name: string; id: string; token: string }) => void;
  onGoToSignup: () => void;
};

const PINTEREST = {
  primary: "#E60023",
  light: "#FF4D6D",
  bg: "#FFFFFF",
  textDark: "#000000",
  textLight: "#5F5F5F",
  textMuted: "#8E8E8E",
  border: "#E1E1E1",
  grayLight: "#F7F7F7",
  redLight: "#FFE2E6",
  hoverBg: "#F5F5F5",
};

export default function LoginScreen({ onLoginSuccess, onGoToSignup }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password");
      }

      // Full user with token
      const user = {
        id: data.id.toString(),
        name: data.name,
        email: data.email,
        token: data.token, // ← Token included
      };

      localStorage.setItem("user", JSON.stringify(user));
      onLoginSuccess(user);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PINTEREST.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Subtle animated background glow */}
      <motion.div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: PINTEREST.redLight,
          filter: "blur(100px)",
          opacity: 0.5,
          pointerEvents: "none", // Prevents interference
        }}
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "white",
          borderRadius: "32px",
          boxShadow: "0 32px 80px rgba(0, 0, 0, 0.08)",
          border: `1px solid ${PINTEREST.border}`,
          overflow: "hidden",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Hill with Logo */}
        <div
          style={{
            position: "relative",
            height: "140px",
            background: PINTEREST.bg,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "20px",
          }}
        >
          <div
            style={{
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.12)",
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: PINTEREST.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "48px",
                fontWeight: "700",
                boxShadow: "0 8px 32px rgba(230, 0, 35, 0.3)",
              }}
            >
              B
            </div>
          </div>

          {/* Smooth curve at bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "40px",
              background: "white",
              borderRadius: "100% 100% 0 0",
              boxShadow: "inset 0 8px 16px rgba(0, 0, 0, 0.05)",
            }}
          />
        </div>

        {/* Form */}
        <div style={{ padding: "40px", paddingTop: "20px" }}>
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: PINTEREST.textDark,
              textAlign: "center",
              margin: "0 0 32px 0",
            }}
          >
            Welcome back
          </h2>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Email */}
            <div style={{ position: "relative" }}>
              <FaEnvelope
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: PINTEREST.textMuted,
                  fontSize: "18px",
                  pointerEvents: "none",
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "16px 16px 16px 48px",
                  borderRadius: "16px",
                  border: `1px solid ${PINTEREST.border}`,
                  background: PINTEREST.grayLight,
                  fontSize: "16px",
                  color: PINTEREST.textDark,
                  outline: "none",
                  opacity: loading ? 0.7 : 1,
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
                  color: PINTEREST.textMuted,
                  fontSize: "18px",
                  pointerEvents: "none",
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "16px 16px 16px 48px",
                  borderRadius: "16px",
                  border: `1px solid ${PINTEREST.border}`,
                  background: PINTEREST.grayLight,
                  fontSize: "16px",
                  color: PINTEREST.textDark,
                  outline: "none",
                  opacity: loading ? 0.7 : 1,
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
                  color: PINTEREST.textLight,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: PINTEREST.redLight,
                  padding: "14px",
                  borderRadius: "12px",
                  textAlign: "center",
                  color: PINTEREST.primary,
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Login Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: "24px",
                background: loading ? PINTEREST.hoverBg : PINTEREST.primary,
                color: "white",
                border: "none",
                fontSize: "16px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "8px",
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </motion.button>

            {/* Sign Up Link */}
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <span style={{ color: PINTEREST.textLight, fontSize: "15px" }}>
                Don't have an account?{" "}
              </span>
              <motion.button
                type="button"
                onClick={onGoToSignup}
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.05 }}
                style={{
                  background: "none",
                  border: "none",
                  color: PINTEREST.primary,
                  fontWeight: 600,
                  fontSize: "15px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Create one
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}