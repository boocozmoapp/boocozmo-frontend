// src/pages/SignupScreen.tsx - MATCHING SPLASH SCREEN STYLE
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaBook, FaMapMarkerAlt, FaUsers, FaArrowRight, FaArrowLeft, FaCheck, FaEye, FaEyeSlash } from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onSignupSuccess: (user: { email: string; name: string; id: string }) => void;
  onGoToLogin: () => void;
};

// Onboarding guide steps
type OnboardingStep = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

export default function SignupScreen({ onSignupSuccess, onGoToLogin }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<{ email: string; name: string; id: string } | null>(null);

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

  // Match splash screen styling
  const USE_WHITE_ON_BRONZE = true;

  // Onboarding steps with bronze theme
  const onboardingSteps: OnboardingStep[] = [
    {
      id: 1,
      title: "Welcome to boocozmo 📚",
      description: "Your literary marketplace where stories find new homes. Connect with book lovers nearby and discover your next great read.",
      icon: <FaBook size={40} />,
      color: BRONZE.primary,
    },
    {
      id: 2,
      title: "Discover Nearby Books 🗺️",
      description: "Find books available in your neighborhood. Filter by genre, distance, or exchange type to find exactly what you're looking for.",
      icon: <FaMapMarkerAlt size={40} />,
      color: BRONZE.primary,
    },
    {
      id: 3,
      title: "Connect with Readers 👥",
      description: "Chat with fellow book lovers, share reviews, and discuss your favorite reads in our community.",
      icon: <FaUsers size={40} />,
      color: BRONZE.primary,
    },
    {
      id: 4,
      title: "Ready to Begin ✨",
      description: "You're all set! Start exploring books, creating offers, and connecting with the literary community.",
      icon: <FaCheck size={40} />,
      color: BRONZE.primary,
    },
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return setError("All fields are required");
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

      const user = {
        email: data.email,
        name: data.name,
        id: data.id.toString(),
      };

      localStorage.setItem("user", JSON.stringify(user));
      
      // Store user data and show onboarding instead of immediate navigation
      setUserData(user);
      setShowOnboarding(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding and navigate to home
      if (userData) {
        onSignupSuccess(userData);
      }
    }
  };

  const handleSkipOnboarding = () => {
    if (userData) {
      onSignupSuccess(userData);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render onboarding guide
  if (showOnboarding) {
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
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          position: "relative",
        }}
      >
        {/* Background pattern */}
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
            maxWidth: "500px",
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

          {/* Progress indicator */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "40px",
          }}>
            {onboardingSteps.map((_, index) => (
              <motion.div
                key={index}
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: index === currentStep 
                    ? USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.9)" : BRONZE.primary
                    : USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.3)" : `${BRONZE.light}80`,
                  transition: "all 0.3s ease",
                }}
                animate={index === currentStep ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={{ textAlign: "center" }}
            >
              {/* Icon container with background accent */}
              <div style={{ position: "relative", marginBottom: "32px" }}>
                <motion.div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "140px",
                    height: "140px",
                    borderRadius: "50%",
                    background: USE_WHITE_ON_BRONZE
                      ? "radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)"
                      : `radial-gradient(circle, ${BRONZE.primary}08 0%, transparent 70%)`,
                    filter: "blur(12px)",
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: USE_WHITE_ON_BRONZE
                    ? "rgba(255, 255, 255, 0.15)"
                    : `${BRONZE.primary}15`,
                  marginBottom: "8px",
                  color: USE_WHITE_ON_BRONZE ? "#FFFFFF" : onboardingSteps[currentStep].color,
                  border: USE_WHITE_ON_BRONZE
                    ? "1px solid rgba(255, 255, 255, 0.2)"
                    : `1px solid ${BRONZE.primary}30`,
                }}>
                  {onboardingSteps[currentStep].icon}
                </div>
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: "2.2rem",
                fontWeight: 700,
                color: USE_WHITE_ON_BRONZE ? "#FFFFFF" : BRONZE.textDark,
                margin: "0 0 16px",
                fontFamily: "'Merriweather', serif",
                textShadow: USE_WHITE_ON_BRONZE
                  ? "0 2px 4px rgba(0, 0, 0, 0.2)"
                  : "none",
              }}>
                {onboardingSteps[currentStep].title}
              </h1>

              {/* Description */}
              <p style={{
                fontSize: "1.1rem",
                color: USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.9)" : BRONZE.textLight,
                lineHeight: 1.6,
                margin: "0 0 32px",
                fontWeight: 400,
                letterSpacing: "0.02em",
              }}>
                {onboardingSteps[currentStep].description}
              </p>

              {/* Step indicator */}
              <div style={{
                fontSize: "0.9rem",
                color: USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.7)" : BRONZE.primary,
                fontWeight: 600,
                marginBottom: "40px",
                letterSpacing: "0.05em",
              }}>
                Step {currentStep + 1} of {onboardingSteps.length}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            marginTop: "20px",
          }}>
            {/* Previous button */}
            {currentStep > 0 && (
              <motion.button
                onClick={handlePrevStep}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  flex: 1,
                  background: USE_WHITE_ON_BRONZE
                    ? "rgba(255, 255, 255, 0.08)"
                    : BRONZE.bgLight,
                  border: USE_WHITE_ON_BRONZE
                    ? "1px solid rgba(255, 255, 255, 0.2)"
                    : `1px solid ${BRONZE.light}`,
                  color: USE_WHITE_ON_BRONZE ? "#FFFFFF" : BRONZE.primary,
                  fontWeight: 600,
                  padding: "16px",
                  borderRadius: "14px",
                  fontSize: "16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <FaArrowLeft />
                Previous
              </motion.button>
            )}

            {/* Skip button */}
            {currentStep < onboardingSteps.length - 1 && (
              <motion.button
                onClick={handleSkipOnboarding}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  flex: 1,
                  background: USE_WHITE_ON_BRONZE
                    ? "rgba(255, 255, 255, 0.08)"
                    : BRONZE.bgLight,
                  border: USE_WHITE_ON_BRONZE
                    ? "1px solid rgba(255, 255, 255, 0.2)"
                    : `1px solid ${BRONZE.light}`,
                  color: USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.7)" : BRONZE.textLight,
                  fontWeight: 600,
                  padding: "16px",
                  borderRadius: "14px",
                  fontSize: "16px",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Skip
              </motion.button>
            )}

            {/* Next/Finish button */}
            <motion.button
              onClick={handleNextStep}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                flex: currentStep === 0 ? 2 : 1,
                background: USE_WHITE_ON_BRONZE
                  ? "rgba(255, 255, 255, 0.2)"
                  : BRONZE.primary,
                color: USE_WHITE_ON_BRONZE ? "#FFFFFF" : "white",
                border: USE_WHITE_ON_BRONZE
                  ? "1px solid rgba(255, 255, 255, 0.3)"
                  : "none",
                padding: "16px",
                borderRadius: "14px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontFamily: "'Inter', sans-serif",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {currentStep === onboardingSteps.length - 1 ? "Start Exploring" : "Continue"}
              <FaArrowRight />
              
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
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main signup form
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
            Begin your literary adventure today
          </motion.p>
        </motion.div>

        {/* Signup Form */}
        <motion.form
          onSubmit={handleSignup}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          {/* Name Input */}
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
              <FaUser />
            </div>
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              placeholder="Create a password (6+ characters)"
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

          {/* Signup Button */}
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
                ✨ Creating Your Account...
              </motion.span>
            ) : (
              <>
                📖 Begin Your Story
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
            margin: "24px 0",
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
              Already have an account?
            </span>
            <div style={{
              flex: 1,
              height: "1px",
              background: USE_WHITE_ON_BRONZE
                ? "rgba(255, 255, 255, 0.15)"
                : BRONZE.pale,
            }} />
          </div>

          {/* Login Button */}
          <motion.button
            type="button"
            onClick={onGoToLogin}
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
            🔑 Return to Login
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
          Every reader adds a new chapter to our collection
        </motion.p>
      </motion.div>
    </div>
  );
}