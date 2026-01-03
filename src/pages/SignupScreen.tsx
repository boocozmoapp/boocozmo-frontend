// src/pages/SignupScreen.tsx - UPDATED FOR NEW BACKEND
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaCheck } from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onSignupSuccess: (user: { email: string; name: string; id: string; token: string }) => void;
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
  green: "#00A86B",
  greenLight: "#E7F9F1",
};

export default function SignupScreen({ onSignupSuccess, onGoToLogin }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return false;
    }

    if (!email.trim()) {
      setError("Please enter your email");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!password) {
      setError("Please enter a password");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim().toLowerCase(), 
          password 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error cases from new backend
        if (res.status === 400) {
          throw new Error(data.error || "All fields required");
        } else if (res.status === 409) {
          throw new Error("Email already registered. Please login instead.");
        } else if (res.status === 429) {
          throw new Error("Too many signup attempts. Please try again later.");
        } else {
          throw new Error(data.error || "Signup failed. Please try again.");
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
      
      // Show success message briefly
      setSuccess(true);
      setTimeout(() => {
        onSignupSuccess(user);
      }, 1500);
      
      // Clear form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage = err.message || "Network error. Please check your connection and try again.";
      setError(errorMessage);
      
      // Clear passwords on error
      setPassword("");
      setConfirmPassword("");
      
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { strength: 0, label: "", color: PINTEREST.textLight };
    if (pass.length < 6) return { strength: 33, label: "Weak", color: PINTEREST.primary };
    if (pass.length < 10) return { strength: 66, label: "Medium", color: "#FFA500" };
    return { strength: 100, label: "Strong", color: PINTEREST.green };
  };

  const passwordStrength = getPasswordStrength(password);

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
      {/* Background glow */}
      <motion.div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: success ? PINTEREST.greenLight : PINTEREST.redLight,
          filter: "blur(100px)",
          opacity: 0.5,
          pointerEvents: "none",
        }}
        animate={{ 
          scale: success ? 1 : [1, 1.15, 1],
          background: success ? PINTEREST.greenLight : PINTEREST.redLight
        }}
        transition={{ 
          duration: success ? 0 : 8,
          repeat: success ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "white",
          borderRadius: "32px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.08)",
          border: `1px solid ${PINTEREST.border}`,
          overflow: "hidden",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Success overlay */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(255, 255, 255, 0.95)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 20,
                padding: "40px",
                textAlign: "center",
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: PINTEREST.green,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "24px",
                  color: "white",
                  fontSize: "32px",
                }}
              >
                <FaCheck />
              </motion.div>
              <h3 style={{
                fontSize: "24px",
                fontWeight: 700,
                color: PINTEREST.textDark,
                marginBottom: "12px",
              }}>
                Welcome to Boocozmo!
              </h3>
              <p style={{
                fontSize: "16px",
                color: PINTEREST.textLight,
                marginBottom: "32px",
                lineHeight: 1.5,
              }}>
                Your account has been created successfully.
                <br />
                Redirecting you...
              </p>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: `3px solid ${PINTEREST.border}`,
                  borderTopColor: PINTEREST.green,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hill with Logo */}
        <div style={{
          position: "relative",
          height: "140px",
          background: PINTEREST.bg,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: "20px",
        }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
            style={{
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{
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
              boxShadow: "0 8px 32px rgba(230,0,35,0.3)",
            }}>
              B
            </div>
          </motion.div>

          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "40px",
            background: "white",
            borderRadius: "100% 100% 0 0",
            boxShadow: "inset 0 8px 16px rgba(0,0,0,0.05)",
          }} />
        </div>

        {/* Form */}
        <div style={{ padding: "40px", paddingTop: "20px" }}>
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: PINTEREST.textDark,
              textAlign: "center",
              margin: "0 0 24px 0",
            }}
          >
            Join Boocozmo
          </motion.h2>

          <p style={{
            textAlign: "center",
            color: PINTEREST.textLight,
            fontSize: "15px",
            marginBottom: "32px",
            lineHeight: 1.5,
          }}>
            Start sharing and discovering books in your community
          </p>

          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Name */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ position: "relative" }}
            >
              <FaUser style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: PINTEREST.textMuted,
                fontSize: "18px",
                pointerEvents: "none",
              }} />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Full name"
                required
                disabled={loading || success}
                style={{
                  width: "100%",
                  padding: "16px 16px 16px 48px",
                  borderRadius: "16px",
                  border: `1px solid ${error && !name.trim() ? PINTEREST.primary : PINTEREST.border}`,
                  background: PINTEREST.grayLight,
                  fontSize: "16px",
                  color: PINTEREST.textDark,
                  outline: "none",
                  opacity: loading || success ? 0.7 : 1,
                  transition: "border-color 0.2s ease",
                }}
              />
            </motion.div>

            {/* Email */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ position: "relative" }}
            >
              <FaEnvelope style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: PINTEREST.textMuted,
                fontSize: "18px",
                pointerEvents: "none",
              }} />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="Email address"
                required
                disabled={loading || success}
                style={{
                  width: "100%",
                  padding: "16px 16px 16px 48px",
                  borderRadius: "16px",
                  border: `1px solid ${error && !email.trim() ? PINTEREST.primary : PINTEREST.border}`,
                  background: PINTEREST.grayLight,
                  fontSize: "16px",
                  color: PINTEREST.textDark,
                  outline: "none",
                  opacity: loading || success ? 0.7 : 1,
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
              <FaLock style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: PINTEREST.textMuted,
                fontSize: "18px",
                pointerEvents: "none",
              }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Password (min 6 characters)"
                required
                disabled={loading || success}
                style={{
                  width: "100%",
                  padding: "16px 16px 16px 48px",
                  borderRadius: "16px",
                  border: `1px solid ${error && !password ? PINTEREST.primary : PINTEREST.border}`,
                  background: PINTEREST.grayLight,
                  fontSize: "16px",
                  color: PINTEREST.textDark,
                  outline: "none",
                  opacity: loading || success ? 0.7 : 1,
                  transition: "border-color 0.2s ease",
                }}
              />
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || success}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: PINTEREST.textLight,
                  cursor: loading || success ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                }}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </motion.button>
            </motion.div>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                style={{ marginTop: "-8px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <div style={{ 
                    flex: 1, 
                    height: "4px", 
                    background: PINTEREST.border,
                    borderRadius: "2px",
                    overflow: "hidden"
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength.strength}%` }}
                      style={{
                        height: "100%",
                        background: passwordStrength.color,
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                  <span style={{ 
                    fontSize: "12px", 
                    fontWeight: 600, 
                    color: passwordStrength.color,
                    minWidth: "40px"
                  }}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: PINTEREST.textLight }}>
                  Password must be at least 6 characters long
                </div>
              </motion.div>
            )}

            {/* Confirm Password */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ position: "relative" }}
            >
              <FaLock style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: PINTEREST.textMuted,
                fontSize: "18px",
                pointerEvents: "none",
              }} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Confirm password"
                required
                disabled={loading || success}
                style={{
                  width: "100%",
                  padding: "16px 16px 16px 48px",
                  borderRadius: "16px",
                  border: `1px solid ${error && !confirmPassword ? PINTEREST.primary : PINTEREST.border}`,
                  background: PINTEREST.grayLight,
                  fontSize: "16px",
                  color: PINTEREST.textDark,
                  outline: "none",
                  opacity: loading || success ? 0.7 : 1,
                  transition: "border-color 0.2s ease",
                }}
              />
              <motion.button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading || success}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: PINTEREST.textLight,
                  cursor: loading || success ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                }}
              >
                {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </motion.button>
            </motion.div>

            {/* Password match indicator */}
            {confirmPassword.length > 0 && password.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "-8px" }}
              >
                <div style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: password === confirmPassword ? PINTEREST.green : PINTEREST.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "10px",
                }}>
                  {password === confirmPassword ? <FaCheck /> : "!"}
                </div>
                <span style={{ 
                  fontSize: "12px", 
                  color: password === confirmPassword ? PINTEREST.green : PINTEREST.primary,
                  fontWeight: 500
                }}>
                  {password === confirmPassword ? "Passwords match" : "Passwords do not match"}
                </span>
              </motion.div>
            )}

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
                    marginTop: "8px",
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Terms */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{ marginTop: "8px" }}
            >
              <p style={{
                fontSize: "12px",
                color: PINTEREST.textLight,
                textAlign: "center",
                lineHeight: 1.5,
              }}>
                By creating an account, you agree to our{" "}
                <button type="button" style={{
                  background: "none",
                  border: "none",
                  color: PINTEREST.primary,
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "12px",
                }}>
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" style={{
                  background: "none",
                  border: "none",
                  color: PINTEREST.primary,
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "12px",
                }}>
                  Privacy Policy
                </button>
              </p>
            </motion.div>

            {/* Signup Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              type="submit"
              disabled={loading || success}
              whileHover={loading || success ? {} : { scale: 1.02 }}
              whileTap={loading || success ? {} : { scale: 0.98 }}
              style={{
                width: "100%",
                padding: "18px",
                borderRadius: "24px",
                background: loading || success ? PINTEREST.hoverBg : PINTEREST.primary,
                color: "white",
                border: "none",
                fontSize: "16px",
                fontWeight: 700,
                cursor: loading || success ? "not-allowed" : "pointer",
                marginTop: "8px",
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
                  Creating account...
                </>
              ) : success ? (
                <>
                  <FaCheck size={16} />
                  Account Created!
                </>
              ) : (
                "Create Account"
              )}
            </motion.button>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
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
                Already have an account?
              </span>
              <div style={{ flex: 1, height: "1px", background: PINTEREST.border }} />
            </motion.div>

            {/* Login Link */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              type="button"
              onClick={onGoToLogin}
              disabled={loading || success}
              whileHover={loading || success ? {} : { scale: 1.02 }}
              whileTap={loading || success ? {} : { scale: 0.98 }}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "20px",
                background: "transparent",
                color: PINTEREST.primary,
                border: `2px solid ${PINTEREST.primary}`,
                fontSize: "16px",
                fontWeight: 600,
                cursor: loading || success ? "not-allowed" : "pointer",
              }}
            >
              Sign In Instead
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}