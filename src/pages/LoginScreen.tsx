// src/pages/LoginScreen.tsx - UPDATED FOR NEW BACKEND
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";

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
  const [checkingSession, setCheckingSession] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          
          // Validate the token with backend
          const response = await fetch(`${API_BASE}/validate-session`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${user.token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            // Token is valid, auto-login
            onLoginSuccess(user);
            return;
          }
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        console.log("No valid session found");
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

    // Basic email validation
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
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error cases from new backend
        if (res.status === 401) {
          throw new Error("Invalid email or password");
        } else if (res.status === 400) {
          throw new Error(data.error || "Email and password required");
        } else if (res.status === 429) {
          throw new Error("Too many login attempts. Please try again later.");
        } else {
          throw new Error(data.error || "Login failed. Please try again.");
        }
      }

      // Validate response structure from new backend
      if (!data.id || !data.email || !data.name || !data.token) {
        throw new Error("Invalid response from server");
      }

      // Full user with token
      const user = {
        id: data.id.toString(),
        name: data.name,
        email: data.email,
        token: data.token,
      };

      // Store in localStorage
      localStorage.setItem("user", JSON.stringify(user));
      
      // Notify parent component
      onLoginSuccess(user);
      
      // Clear form
      setEmail("");
      setPassword("");
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage = err.message || "Network error. Please check your connection and try again.";
      setError(errorMessage);
      
      // Clear password on error
      setPassword("");
      
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Forgot password functionality (to be implemented)
    alert("Forgot password feature coming soon!");
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div style={{
        minHeight: "100vh",
        background: PINTEREST.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: `4px solid ${PINTEREST.border}`,
            borderTopColor: PINTEREST.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FaSpinner size={24} color={PINTEREST.primary} />
        </motion.div>
      </div>
    );
  }

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
          pointerEvents: "none",
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              delay: 0.2, 
              type: "spring", 
              stiffness: 200, 
              damping: 15 
            }}
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
                background: `linear-gradient(135deg, ${PINTEREST.primary}, ${PINTEREST.light})`,
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
          </motion.div>

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
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: PINTEREST.textDark,
              textAlign: "center",
              margin: "0 0 32px 0",
            }}
          >
            Welcome back
          </motion.h2>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Email */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ position: "relative" }}
            >
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null); // Clear error when user starts typing
                }}
                placeholder="Email address"
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "16px 16px 16px 48px",
                  borderRadius: "16px",
                  border: `1px solid ${error ? PINTEREST.primary : PINTEREST.border}`,
                  background: PINTEREST.grayLight,
                  fontSize: "16px",
                  color: PINTEREST.textDark,
                  outline: "none",
                  opacity: loading ? 0.7 : 1,
                  transition: "border-color 0.2s ease",
                }}
              />
            </motion.div>

            {/* Password */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{ position: "relative" }}
            >
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null); // Clear error when user starts typing
                }}
                placeholder="Password"
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "16px 16px 16px 48px",
                  borderRadius: "16px",
                  border: `1px solid ${error ? PINTEREST.primary : PINTEREST.border}`,
                  background: PINTEREST.grayLight,
                  fontSize: "16px",
                  color: PINTEREST.textDark,
                  outline: "none",
                  opacity: loading ? 0.7 : 1,
                  transition: "border-color 0.2s ease",
                }}
              />
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: PINTEREST.textLight,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                }}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </motion.button>
            </motion.div>

            {/* Forgot Password */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ textAlign: "right" }}
            >
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                style={{
                  background: "none",
                  border: "none",
                  color: PINTEREST.primary,
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  textDecoration: "underline",
                }}
              >
                Forgot password?
              </button>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    background: PINTEREST.redLight,
                    padding: "14px",
                    borderRadius: "12px",
                    textAlign: "center",
                    color: PINTEREST.primary,
                    fontSize: "14px",
                    fontWeight: 500,
                    overflow: "hidden",
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              type="submit"
              disabled={loading}
              whileHover={loading ? {} : { scale: 1.02 }}
              whileTap={loading ? {} : { scale: 0.98 }}
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                position: "relative",
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
                      border: `2px solid rgba(255,255,255,0.3)`,
                      borderTopColor: "white",
                    }}
                  />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </motion.button>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{
                display: "flex",
                alignItems: "center",
                margin: "24px 0",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: PINTEREST.border }} />
              <span style={{ 
                padding: "0 16px", 
                color: PINTEREST.textMuted, 
                fontSize: "14px",
                fontWeight: 500 
              }}>
                OR
              </span>
              <div style={{ flex: 1, height: "1px", background: PINTEREST.border }} />
            </motion.div>

            {/* Sign Up Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              style={{ textAlign: "center" }}
            >
              <span style={{ color: PINTEREST.textLight, fontSize: "15px" }}>
                Don't have an account?{" "}
              </span>
              <motion.button
                type="button"
                onClick={onGoToSignup}
                disabled={loading}
                whileHover={loading ? {} : { scale: 1.05 }}
                whileTap={loading ? {} : { scale: 0.95 }}
                style={{
                  background: "none",
                  border: "none",
                  color: PINTEREST.primary,
                  fontWeight: 600,
                  fontSize: "15px",
                  cursor: loading ? "not-allowed" : "pointer",
                  textDecoration: "underline",
                }}
              >
                Create one
              </motion.button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// Need to import AnimatePresence
import { AnimatePresence } from "framer-motion";