// src/pages/LoginScreen.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { FaBookOpen, FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onLoginSuccess: (user: { email: string; name: string; id: string }) => void; // Changed userId to id
  onGoToSignup: () => void;
};

export default function LoginScreen({ onLoginSuccess, onGoToSignup }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bronze color palette
  const BRONZE = {
    primary: "#CD7F32",
    light: "#E6B17E",
    dark: "#B87333",
    pale: "#F5E7D3",
    shimmer: "#FFD700",
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

      // Use 'id' from backend response (not 'userId')
      const user = {
        email: data.email,
        name: data.name,
        id: data.id.toString(), // Changed from userId to id
      };

      localStorage.setItem("user", JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F9F5F0 0%, #F5F0E6 50%, #F0EAD6 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}
    >
      {/* Background decorative elements */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: `radial-gradient(${BRONZE.light}15 1px, transparent 1px)`,
        backgroundSize: "50px 50px",
        opacity: 0.4,
      }} />

      {/* Floating book icons */}
      <motion.div
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          fontSize: "36px",
          color: BRONZE.light,
          opacity: 0.6,
        }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <FaBookOpen />
      </motion.div>
      
      <motion.div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "8%",
          fontSize: "42px",
          color: BRONZE.primary,
          opacity: 0.5,
          transform: "rotate(15deg)",
        }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <FaBookOpen />
      </motion.div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          background: "rgba(255, 255, 255, 0.92)",
          borderRadius: "24px",
          padding: "40px 32px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: `
            0 20px 60px rgba(205, 127, 50, 0.15),
            0 0 0 1px ${BRONZE.pale}
          `,
          backdropFilter: "blur(10px)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Decorative top border */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100px",
          height: "4px",
          background: `linear-gradient(90deg, transparent, ${BRONZE.primary}, transparent)`,
          borderRadius: "0 0 2px 2px",
        }} />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.2 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${BRONZE.pale}, ${BRONZE.light})`,
              marginBottom: "16px",
              boxShadow: `0 8px 20px ${BRONZE.light}40`,
            }}
          >
            <FaBookOpen size={32} color={BRONZE.dark} />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              color: BRONZE.dark,
              margin: "0 0 8px",
              fontFamily: "'Playfair Display', serif",
              background: `linear-gradient(135deg, ${BRONZE.dark}, ${BRONZE.primary})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Welcome Back
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{
              fontSize: "1rem",
              color: "#666",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Sign in to continue your literary journey
          </motion.p>
        </div>

        {/* Login Form */}
        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {/* Email Input */}
          <div style={{ marginBottom: "20px", position: "relative" }}>
            <div style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: BRONZE.primary,
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
                padding: "14px 14px 14px 44px",
                borderRadius: "12px",
                border: `1px solid ${BRONZE.light}`,
                fontSize: "16px",
                background: "white",
                color: "#333",
                transition: "all 0.3s ease",
                outline: "none",
              }}
              onFocus={(e) => e.target.style.borderColor = BRONZE.primary}
              onBlur={(e) => e.target.style.borderColor = BRONZE.light}
              required
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: "24px", position: "relative" }}>
            <div style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: BRONZE.primary,
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
                padding: "14px 14px 14px 44px",
                borderRadius: "12px",
                border: `1px solid ${BRONZE.light}`,
                fontSize: "16px",
                background: "white",
                color: "#333",
                transition: "all 0.3s ease",
                outline: "none",
              }}
              onFocus={(e) => e.target.style.borderColor = BRONZE.primary}
              onBlur={(e) => e.target.style.borderColor = BRONZE.light}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: BRONZE.dark,
                fontSize: "16px",
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
                background: "rgba(211, 47, 47, 0.1)",
                border: "1px solid rgba(211, 47, 47, 0.3)",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <p style={{
                color: "#d32f2f",
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
              background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
              color: "white",
              border: "none",
              padding: "16px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: `0 6px 20px ${BRONZE.primary}40`,
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {loading ? (
              <>
                <span style={{ marginRight: "8px" }}>🔐</span>
                Authenticating...
              </>
            ) : (
              <>
                <span style={{ marginRight: "8px" }}>📚</span>
                Enter the Library
              </>
            )}
            
            {/* Button shimmer effect */}
            {!loading && (
              <motion.div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                }}
                animate={{ x: ["0%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </motion.button>

          {/* Sign Up Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            style={{
              textAlign: "center",
              marginTop: "28px",
              paddingTop: "20px",
              borderTop: `1px solid ${BRONZE.pale}`,
            }}
          >
            <p style={{
              fontSize: "14px",
              color: "#666",
              margin: "0 0 16px",
            }}>
              New to our book community?
            </p>
            
            <button
              type="button"
              onClick={onGoToSignup}
              style={{
                background: "none",
                border: `2px solid ${BRONZE.light}`,
                color: BRONZE.dark,
                fontWeight: 600,
                cursor: "pointer",
                padding: "12px 28px",
                borderRadius: "12px",
                fontSize: "15px",
                transition: "all 0.3s ease",
                width: "100%",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = BRONZE.pale;
                e.currentTarget.style.borderColor = BRONZE.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.borderColor = BRONZE.light;
              }}
            >
              <span style={{ marginRight: "8px" }}>✨</span>
              Create an Account
              <span style={{ marginLeft: "8px" }}>→</span>
            </button>
          </motion.div>
        </motion.form>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          style={{
            fontSize: "12px",
            color: "#999",
            textAlign: "center",
            marginTop: "24px",
            fontStyle: "italic",
          }}
        >
          Every login opens a new chapter 📖
        </motion.p>
      </motion.div>
    </div>
  );
}