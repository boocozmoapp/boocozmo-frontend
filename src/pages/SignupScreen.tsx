// src/pages/SignupScreen.tsx - FIXED VERSION
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaBook, FaMapMarkerAlt, FaUsers, FaArrowRight, FaArrowLeft, FaCheck } from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onSignupSuccess: (user: { email: string; name: string; id: string }) => void; // Changed userId to id
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
  const [userData, setUserData] = useState<{ email: string; name: string; id: string } | null>(null); // Changed userId to id

  // Bronze color palette
  const BRONZE = {
    primary: "#CD7F32",
    light: "#E6B17E",
    dark: "#B87333",
    pale: "#F5E7D3",
    shimmer: "#FFD700",
  };

  // Onboarding steps
  const onboardingSteps: OnboardingStep[] = [
    {
      id: 1,
      title: "Welcome to BookSphere 📚",
      description: "Your literary marketplace where stories find new homes. Buy, sell, or exchange books with fellow readers in your community.",
      icon: <FaBook size={40} />,
      color: BRONZE.primary,
    },
    {
      id: 2,
      title: "Discover Nearby Books 🗺️",
      description: "Use our interactive map to find books available in your neighborhood. Filter by genre, distance, or exchange type.",
      icon: <FaMapMarkerAlt size={40} />,
      color: "#4CAF50",
    },
    {
      id: 3,
      title: "Join Literary Communities 👥",
      description: "Connect with book clubs, join group chats, or create your own gatherings. Share reviews and discuss your favorite reads.",
      icon: <FaUsers size={40} />,
      color: "#2196F3",
    },
    {
      id: 4,
      title: "Create & Manage Offers ✨",
      description: "Post books you want to sell, exchange, or give away. Set your preferences and manage all your listings in one place.",
      icon: <FaCheck size={40} />,
      color: "#9C27B0",
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

      // Use 'id' from backend response (not 'userId')
      const user = {
        email: data.email,
        name: data.name,
        id: data.id.toString(), // Changed from userId to id
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
          background: "linear-gradient(135deg, #F9F5F0 0%, #F5F0E6 50%, #F0EAD6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily: "'Georgia', 'Times New Roman', serif",
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "24px",
            padding: "40px 32px",
            width: "100%",
            maxWidth: "500px",
            boxShadow: `
              0 20px 60px rgba(205, 127, 50, 0.2),
              0 0 0 1px ${BRONZE.pale}
            `,
            backdropFilter: "blur(10px)",
            position: "relative",
          }}
        >
          {/* Progress indicator */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "30px",
          }}>
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                style={{
                  width: index === currentStep ? "30px" : "10px",
                  height: "10px",
                  borderRadius: "5px",
                  background: index === currentStep ? BRONZE.primary : BRONZE.light,
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              style={{ textAlign: "center" }}
            >
              {/* Icon */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${onboardingSteps[currentStep].color}20, ${onboardingSteps[currentStep].color}40)`,
                marginBottom: "24px",
                color: onboardingSteps[currentStep].color,
              }}>
                {onboardingSteps[currentStep].icon}
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: BRONZE.dark,
                margin: "0 0 16px",
                fontFamily: "'Playfair Display', serif",
              }}>
                {onboardingSteps[currentStep].title}
              </h1>

              {/* Description */}
              <p style={{
                fontSize: "1.1rem",
                color: "#666",
                lineHeight: 1.6,
                margin: "0 0 32px",
              }}>
                {onboardingSteps[currentStep].description}
              </p>

              {/* Step indicator */}
              <div style={{
                fontSize: "0.9rem",
                color: BRONZE.primary,
                fontWeight: 600,
                marginBottom: "40px",
              }}>
                Step {currentStep + 1} of {onboardingSteps.length}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            marginTop: "20px",
          }}>
            {/* Previous button (only show if not first step) */}
            {currentStep > 0 && (
              <button
                onClick={handlePrevStep}
                style={{
                  flex: 1,
                  background: "none",
                  border: `2px solid ${BRONZE.light}`,
                  color: BRONZE.dark,
                  fontWeight: 600,
                  padding: "14px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.3s ease",
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
                <FaArrowLeft />
                Previous
              </button>
            )}

            {/* Skip button (only show if not last step) */}
            {currentStep < onboardingSteps.length - 1 && (
              <button
                onClick={handleSkipOnboarding}
                style={{
                  flex: 1,
                  background: "none",
                  border: `2px solid ${BRONZE.light}`,
                  color: "#666",
                  fontWeight: 600,
                  padding: "14px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f5f5f5";
                  e.currentTarget.style.borderColor = "#999";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.borderColor = BRONZE.light;
                }}
              >
                Skip Tour
              </button>
            )}

            {/* Next/Finish button */}
            <button
              onClick={handleNextStep}
              style={{
                flex: currentStep === 0 ? 2 : 1,
                background: `linear-gradient(135deg, ${onboardingSteps[currentStep].color}, ${onboardingSteps[currentStep].color}DD)`,
                color: "white",
                border: "none",
                padding: "14px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: `0 6px 20px ${onboardingSteps[currentStep].color}40`,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {currentStep === onboardingSteps.length - 1 ? (
                <>
                  Start Exploring
                  <FaArrowRight />
                </>
              ) : (
                <>
                  Next
                  <FaArrowRight />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Original signup form
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
          top: "15%",
          right: "10%",
          fontSize: "40px",
          color: BRONZE.light,
          opacity: 0.6,
          transform: "rotate(-15deg)",
        }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <FaBook />
      </motion.div>
      
      <motion.div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "5%",
          fontSize: "36px",
          color: BRONZE.primary,
          opacity: 0.5,
          transform: "rotate(20deg)",
        }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      >
        <FaUsers />
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
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
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
            <FaUser size={32} color={BRONZE.dark} />
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
            Join BookSphere
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
            Begin your literary adventure today
          </motion.p>
        </div>

        {/* Signup Form */}
        <motion.form
          onSubmit={handleSignup}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {/* Name Input */}
          <div style={{ marginBottom: "16px", position: "relative" }}>
            <div style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: BRONZE.primary,
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

          {/* Email Input */}
          <div style={{ marginBottom: "16px", position: "relative" }}>
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
              placeholder="Create a password (6+ characters)"
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
              {showPassword ? "🙈" : "👁️"}
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

          {/* Signup Button */}
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
                <span style={{ marginRight: "8px" }}>✨</span>
                Creating Your Library...
              </>
            ) : (
              <>
                <span style={{ marginRight: "8px" }}>📖</span>
                Begin Your Story
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

          {/* Login Link */}
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
              Already part of our story?
            </p>
            
            <button
              type="button"
              onClick={onGoToLogin}
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
              <span style={{ marginRight: "8px" }}>🔑</span>
              Return to Login
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
          Every reader adds a new chapter to our collection 📚
        </motion.p>
      </motion.div>
    </div>
  );
}