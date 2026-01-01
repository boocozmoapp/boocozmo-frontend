// src/pages/LoginScreen.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { FaBookOpen, FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onLoginSuccess: (user: { email: string; name: string; id: string }) => void;
  onGoToSignup: () => void;
};

export default function LoginScreen({ onLoginSuccess, onGoToSignup }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Elegant bronze palette (matching SplashScreen)
  const BRONZE = {
    primary: "#CD7F32",
    light: "#E6B17E",
    dark: "#B87333",
    pale: "#F5E7D3",
    bgLight: "#FDF8F3",
    bgDark: "#F5F0E6",
    textDark: "#2C1810",
    textLight: "#5D4037",
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError("All fields are required");

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      const user = {
        email: data.email,
        name: data.name,
        id: data.id.toString(),
      };

      localStorage.setItem("user", JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  // Match splash screen styling
  const USE_WHITE_ON_BRONZE = true;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: USE_WHITE_ON_BRONZE 
          ? `linear-gradient(135deg, ${BRONZE.dark} 0%, ${BRONZE.primary} 100%)`
          : BRONZE.bgLight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Background pattern matching splash screen */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: USE_WHITE_ON_BRONZE
          ? `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)`
          : `radial-gradient(${BRONZE.light}05 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        opacity: 0.4,
      }} />

      {/* Subtle floating elements - minimal like splash */}
      <motion.div
        style={{
          position: "absolute",
          top: "15%",
          right: "10%",
          fontSize: "48px",
          color: USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.08)" : `${BRONZE.primary}10`,
          opacity: 0.7,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <FaBookOpen />
      </motion.div>

      <motion.div
        style={{
          position: "absolute",
          bottom: "20%",
          left: "8%",
          fontSize: "36px",
          color: USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.06)" : `${BRONZE.light}15`,
          opacity: 0.5,
        }}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <FaBookOpen />
      </motion.div>

      {/* Main card - matches splash screen styling */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          background: USE_WHITE_ON_BRONZE 
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(255, 255, 255, 0.95)",
          borderRadius: "28px",
          padding: "48px 40px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: USE_WHITE_ON_BRONZE
            ? "0 20px 60px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
            : "0 20px 60px rgba(205, 127, 50, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
          border: USE_WHITE_ON_BRONZE
            ? "1px solid rgba(255, 255, 255, 0.15)"
            : `1px solid ${BRONZE.pale}`,
          backdropFilter: "blur(12px)",
          position: "relative",
          zIndex: 10,
          margin: "20px",
        }}
      >
        {/* Decorative top line - matches splash */}
        <motion.div
          style={{
            position: "absolute",
            top: "-2px",
            width: "100px",
            height: "4px",
            background: USE_WHITE_ON_BRONZE 
              ? "rgba(255, 255, 255, 0.5)"
              : BRONZE.primary,
            borderRadius: "2px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
          initial={{ width: 0 }}
          animate={{ width: "100px" }}
          transition={{ delay: 0.2, duration: 0.4 }}
        />

        {/* Header */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          style={{ textAlign: "center", marginBottom: "40px", position: "relative" }}
        >
          {/* Logo background accent */}
          <motion.div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "160px",
              height: "160px",
              borderRadius: "50%",
              background: USE_WHITE_ON_BRONZE
                ? "radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)"
                : `radial-gradient(circle, ${BRONZE.primary}08 0%, transparent 70%)`,
              filter: "blur(12px)",
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Logo - matches splash screen font */}
          <div style={{
            fontSize: "3.2rem",
            fontWeight: 700,
            color: USE_WHITE_ON_BRONZE ? "#FFFFFF" : BRONZE.primary,
            letterSpacing: "0.02em",
            fontFamily: "'Merriweather', serif",
            position: "relative",
            textShadow: USE_WHITE_ON_BRONZE
              ? "0 2px 8px rgba(0, 0, 0, 0.2)"
              : "0 2px 4px rgba(205, 127, 50, 0.1)",
            marginBottom: "8px",
          }}>
            boocozmo
          </div>

          {/* Logo underline */}
          <motion.div
            style={{
              position: "absolute",
              bottom: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "140px",
              height: "2px",
              background: USE_WHITE_ON_BRONZE
                ? "rgba(255, 255, 255, 0.3)"
                : `${BRONZE.primary}40`,
              borderRadius: "1px",
            }}
            initial={{ width: 0 }}
            animate={{ width: "140px" }}
            transition={{ delay: 0.4, duration: 0.5 }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{
              fontSize: "1.1rem",
              color: USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.9)" : BRONZE.textLight,
              marginTop: "16px",
              lineHeight: "1.6",
              fontWeight: 400,
              letterSpacing: "0.02em",
            }}
          >
            Sign in to your literary marketplace
          </motion.p>
        </motion.div>

        {/* Login Form */}
        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
        >
          {/* Email Input */}
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              color: USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.7)" : BRONZE.primary,
              fontSize: "18px",
              zIndex: 2,
            }}>
              <FaEnvelope />
            </div>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "16px 16px 16px 52px",
                borderRadius: "14px",
                border: USE_WHITE_ON_BRONZE
                  ? "1px solid rgba(255, 255, 255, 0.2)"
                  : `1px solid ${BRONZE.light}`,
                fontSize: "16px",
                background: USE_WHITE_ON_BRONZE
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(255, 255, 255, 0.9)",
                color: USE_WHITE_ON_BRONZE ? "#FFFFFF" : BRONZE.textDark,
                transition: "all 0.3s ease",
                outline: "none",
                fontFamily: "'Inter', sans-serif",
              }}
              onFocus={(e) => e.target.style.borderColor = USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.4)" : BRONZE.primary}
              onBlur={(e) => e.target.style.borderColor = USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.2)" : BRONZE.light}
              required
            />
          </div>

          {/* Password Input */}
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              color: USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.7)" : BRONZE.primary,
              fontSize: "18px",
              zIndex: 2,
            }}>
              <FaLock />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "16px 16px 16px 52px",
                borderRadius: "14px",
                border: USE_WHITE_ON_BRONZE
                  ? "1px solid rgba(255, 255, 255, 0.2)"
                  : `1px solid ${BRONZE.light}`,
                fontSize: "16px",
                background: USE_WHITE_ON_BRONZE
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(255, 255, 255, 0.9)",
                color: USE_WHITE_ON_BRONZE ? "#FFFFFF" : BRONZE.textDark,
                transition: "all 0.3s ease",
                outline: "none",
                fontFamily: "'Inter', sans-serif",
              }}
              onFocus={(e) => e.target.style.borderColor = USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.4)" : BRONZE.primary}
              onBlur={(e) => e.target.style.borderColor = USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.2)" : BRONZE.light}
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
                color: USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.7)" : BRONZE.dark,
                fontSize: "18px",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={{
                background: USE_WHITE_ON_BRONZE
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(205, 127, 50, 0.08)",
                border: USE_WHITE_ON_BRONZE
                  ? "1px solid rgba(255, 255, 255, 0.2)"
                  : `1px solid ${BRONZE.primary}40`,
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <p style={{
                color: USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.9)" : "#d32f2f",
                fontSize: "14px",
                margin: 0,
                fontWeight: 500,
              }}>
                {error}
              </p>
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
              background: USE_WHITE_ON_BRONZE
                ? "rgba(255, 255, 255, 0.2)"
                : BRONZE.primary,
              color: USE_WHITE_ON_BRONZE ? "#FFFFFF" : "white",
              border: USE_WHITE_ON_BRONZE
                ? "1px solid rgba(255, 255, 255, 0.3)"
                : "none",
              padding: "18px",
              borderRadius: "14px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden",
              marginTop: "8px",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {loading ? (
              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🔐 Authenticating...
              </motion.span>
            ) : (
              <>
                📚 Enter the Library
                {/* Button shimmer effect */}
                <motion.div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "-100%",
                    width: "100%",
                    height: "100%",
                    background: USE_WHITE_ON_BRONZE
                      ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)"
                      : `linear-gradient(90deg, transparent, ${BRONZE.light}80, transparent)`,
                  }}
                  animate={{ x: ["0%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            margin: "20px 0",
          }}>
            <div style={{
              flex: 1,
              height: "1px",
              background: USE_WHITE_ON_BRONZE
                ? "rgba(255, 255, 255, 0.15)"
                : BRONZE.pale,
            }} />
            <span style={{
              padding: "0 16px",
              fontSize: "14px",
              color: USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.7)" : BRONZE.textLight,
              fontWeight: 400,
            }}>
              New to boocozmo?
            </span>
            <div style={{
              flex: 1,
              height: "1px",
              background: USE_WHITE_ON_BRONZE
                ? "rgba(255, 255, 255, 0.15)"
                : BRONZE.pale,
            }} />
          </div>

          {/* Sign Up Button */}
          <motion.button
            type="button"
            onClick={onGoToSignup}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%",
              background: USE_WHITE_ON_BRONZE
                ? "rgba(255, 255, 255, 0.08)"
                : BRONZE.bgLight,
              color: USE_WHITE_ON_BRONZE ? "#FFFFFF" : BRONZE.primary,
              border: USE_WHITE_ON_BRONZE
                ? "1px solid rgba(255, 255, 255, 0.2)"
                : `2px solid ${BRONZE.primary}`,
              padding: "16px",
              borderRadius: "14px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            ✨ Create an Account
          </motion.button>
        </motion.form>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          style={{
            fontSize: "12px",
            color: USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.6)" : BRONZE.textLight,
            textAlign: "center",
            marginTop: "32px",
            fontStyle: "italic",
            fontWeight: 300,
          }}
        >
          Every login opens a new chapter
        </motion.p>
      </motion.div>
    </div>
  );
}