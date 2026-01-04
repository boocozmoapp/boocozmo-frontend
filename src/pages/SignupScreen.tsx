/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/SignupScreen.tsx - GREEN ENERGY THEME: Calm, Sustainable, Professional
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaCheck } from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onSignupSuccess: (user: { email: string; name: string; id: string; token: string }) => void;
  onGoToLogin: () => void;
};

const GREEN = {
  dark: "#0F2415",           // Deep forest green background
  medium: "#1A3A2A",         // Card background
  accent: "#4A7C59",         // Soft sage green for accents
  accentLight: "#6BA87A",
  textPrimary: "#E8F0E8",    // Soft off-white
  textSecondary: "#A8B8A8",  // Muted green
  textMuted: "#80A080",
  border: "rgba(74, 124, 89, 0.3)",
  grayLight: "#2A4A3A",
  error: "#FF6B6B",
  successBg: "rgba(74, 124, 89, 0.15)",
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
    if (!name.trim()) return setError("Please enter your name");
    if (!email.trim()) return setError("Please enter your email");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return setError("Please enter a valid email address");
    if (!password) return setError("Please enter a password");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim().toLowerCase(), 
          password 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400) throw new Error(data.error || "All fields required");
        if (res.status === 409) throw new Error("Email already registered. Please login instead.");
        if (res.status === 429) throw new Error("Too many attempts. Try again later.");
        throw new Error(data.error || "Signup failed");
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
      setSuccess(true);

      setTimeout(() => {
        onSignupSuccess(user);
      }, 1500);

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
      setPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { strength: 0, label: "", color: GREEN.textMuted };
    if (pass.length < 6) return { strength: 33, label: "Weak", color: GREEN.error };
    if (pass.length < 10) return { strength: 66, label: "Medium", color: "#FFA500" };
    return { strength: 100, label: "Strong", color: GREEN.accent };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(to bottom, ${GREEN.dark} 0%, #0A1C10 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Signup Card */}
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
        {/* Success Overlay */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                inset: 0,
                background: GREEN.medium,
                borderRadius: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 20,
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: GREEN.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "24px",
                }}
              >
                <FaCheck size={36} color="white" />
              </motion.div>
              <h3 style={{ fontSize: "1.8rem", fontWeight: 700, color: GREEN.textPrimary, marginBottom: "12px" }}>
                Welcome to Boocozmo!
              </h3>
              <p style={{ color: GREEN.textSecondary, textAlign: "center", maxWidth: "300px" }}>
                Your account has been created. Redirecting...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

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
          <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: GREEN.textPrimary }}>
            Join Boocozmo
          </h2>
          <p style={{ fontSize: "0.95rem", color: GREEN.textSecondary, marginTop: "8px" }}>
            Start your sustainable book journey
          </p>
        </div>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Name */}
          <div style={{ position: "relative" }}>
            <FaUser style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: GREEN.textMuted, fontSize: "18px" }} />
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder="Full name"
              required
              disabled={loading || success}
              style={{
                width: "100%",
                padding: "14px 14px 14px 48px",
                borderRadius: "16px",
                border: `1px solid ${error && !name.trim() ? GREEN.error : GREEN.border}`,
                background: GREEN.grayLight,
                color: GREEN.textPrimary,
                fontSize: "15px",
                outline: "none",
              }}
            />
          </div>

          {/* Email */}
          <div style={{ position: "relative" }}>
            <FaEnvelope style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: GREEN.textMuted, fontSize: "18px" }} />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="Email address"
              required
              disabled={loading || success}
              style={{
                width: "100%",
                padding: "14px 14px 14px 48px",
                borderRadius: "16px",
                border: `1px solid ${error && !email.trim() ? GREEN.error : GREEN.border}`,
                background: GREEN.grayLight,
                color: GREEN.textPrimary,
                fontSize: "15px",
                outline: "none",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ position: "relative" }}>
            <FaLock style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: GREEN.textMuted, fontSize: "18px" }} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="Password (min 6 characters)"
              required
              disabled={loading || success}
              style={{
                width: "100%",
                padding: "14px 14px 14px 48px",
                borderRadius: "16px",
                border: `1px solid ${error && !password ? GREEN.error : GREEN.border}`,
                background: GREEN.grayLight,
                color: GREEN.textPrimary,
                fontSize: "15px",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading || success}
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: GREEN.textSecondary,
              }}
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          {/* Password Strength */}
          {password.length > 0 && (
            <div style={{ marginTop: "-8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ flex: 1, height: "4px", background: GREEN.border, borderRadius: "2px", overflow: "hidden" }}>
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
                <span style={{ fontSize: "12px", fontWeight: 600, color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div style={{ position: "relative" }}>
            <FaLock style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: GREEN.textMuted, fontSize: "18px" }} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
              placeholder="Confirm password"
              required
              disabled={loading || success}
              style={{
                width: "100%",
                padding: "14px 14px 14px 48px",
                borderRadius: "16px",
                border: `1px solid ${error && password !== confirmPassword ? GREEN.error : GREEN.border}`,
                background: GREEN.grayLight,
                color: GREEN.textPrimary,
                fontSize: "15px",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading || success}
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: GREEN.textSecondary,
              }}
            >
              {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>

          {/* Password Match */}
          {confirmPassword && password && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "-8px" }}>
              <div style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: password === confirmPassword ? GREEN.accent : GREEN.error,
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
                color: password === confirmPassword ? GREEN.accent : GREEN.error,
                fontWeight: 500
              }}>
                {password === confirmPassword ? "Passwords match" : "Passwords do not match"}
              </span>
            </div>
          )}

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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            style={{
              width: "100%",
              padding: "16px",
              background: loading || success ? GREEN.grayLight : GREEN.accent,
              color: "white",
              border: "none",
              borderRadius: "16px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: loading || success ? "not-allowed" : "pointer",
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
          </button>

          {/* Login Link */}
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <span style={{ color: GREEN.textSecondary, fontSize: "15px" }}>
              Already have an account?{" "}
            </span>
            <button
              type="button"
              onClick={onGoToLogin}
              disabled={loading || success}
              style={{
                background: "none",
                border: "none",
                color: GREEN.accent,
                fontSize: "15px",
                fontWeight: 600,
                cursor: loading || success ? "not-allowed" : "pointer",
              }}
            >
              Sign In
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}