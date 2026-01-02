// src/pages/SignupScreen.tsx - PINTEREST-STYLE REDESIGN (Matching LoginScreen with Centered Hill)
import { useState } from "react";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onSignupSuccess: (user: { email: string; name: string; id: string }) => void;
  onGoToLogin: () => void;
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

export default function SignupScreen({ onSignupSuccess, onGoToLogin }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return setError("Please fill in all fields");
    if (password.length < 6) return setError("Password must be at least 6 characters");

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      const user = { email: data.email, name: data.name, id: data.id.toString() };
      localStorage.setItem("user", JSON.stringify(user));
      onSignupSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: PINTEREST.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Subtle background glow */}
      <motion.div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: PINTEREST.redLight,
          filter: "blur(100px)",
          opacity: 0.5,
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

      {/* Signup Card with Single Centered Semicircle "Hill" Top */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          width: "100%",
          maxWidth: "460px",
          position: "relative",
          background: "white",
          borderRadius: "32px",
          boxShadow: "0 32px 80px rgba(0, 0, 0, 0.08)",
          border: `1px solid ${PINTEREST.border}`,
          overflow: "hidden",
        }}
      >
        {/* Single Centered Semicircle "Hill" with Logo Inside */}
        <div style={{
          position: "relative",
          height: "140px",
          background: PINTEREST.bg,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: "20px",
        }}>
          {/* The "hill" - white semicircle with red logo centered */}
          <div style={{
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.12)",
            position: "relative",
            zIndex: 2,
          }}>
            {/* Logo inside the hill */}
            <div style={{
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
            }}>
              B
            </div>
          </div>

          {/* Smooth curve connecting hill to card */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "40px",
            background: "white",
            borderRadius: "100% 100% 0 0",
            boxShadow: "inset 0 8px 16px rgba(0, 0, 0, 0.05)",
          }} />
        </div>

        {/* Form Content */}
        <div style={{
          padding: "40px",
          paddingTop: "20px",
        }}>
          <h2 style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: PINTEREST.textDark,
            textAlign: "center",
            margin: "0 0 32px 0",
          }}>
            Create your account
          </h2>

          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Name */}
            <div>
              <div style={{ position: "relative" }}>
                <FaUser style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: PINTEREST.textMuted,
                  fontSize: "18px",
                }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  style={{
                    width: "100%",
                    padding: "16px 16px 16px 48px",
                    borderRadius: "16px",
                    border: `1px solid ${PINTEREST.border}`,
                    background: PINTEREST.grayLight,
                    fontSize: "16px",
                    color: PINTEREST.textDark,
                    outline: "none",
                  }}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <div style={{ position: "relative" }}>
                <FaEnvelope style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: PINTEREST.textMuted,
                  fontSize: "18px",
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  style={{
                    width: "100%",
                    padding: "16px 16px 16px 48px",
                    borderRadius: "16px",
                    border: `1px solid ${PINTEREST.border}`,
                    background: PINTEREST.grayLight,
                    fontSize: "16px",
                    color: PINTEREST.textDark,
                    outline: "none",
                  }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ position: "relative" }}>
              <FaLock style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: PINTEREST.textMuted,
                fontSize: "18px",
              }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (6+ characters)"
                style={{
                  width: "100%",
                  padding: "16px 16px 16px 48px",
                  borderRadius: "16px",
                  border: `1px solid ${PINTEREST.border}`,
                  background: PINTEREST.grayLight,
                  fontSize: "16px",
                  color: PINTEREST.textDark,
                  outline: "none",
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: PINTEREST.textLight,
                  cursor: "pointer",
                }}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>

            {/* Error */}
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

            {/* Signup Button */}
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
              }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </motion.button>

            {/* Login link */}
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <span style={{ color: PINTEREST.textLight, fontSize: "15px" }}>
                Already have an account?{" "}
              </span>
              <motion.button
                type="button"
                onClick={onGoToLogin}
                whileHover={{ scale: 1.05 }}
                style={{
                  background: "none",
                  border: "none",
                  color: PINTEREST.primary,
                  fontWeight: 600,
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                Sign in
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}