// src/SplashScreen.tsx - ELEGANT & SIMPLE BOOCOZMO
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const animationRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = React.useState(0);
  const [showContent, setShowContent] = React.useState(false);

  useEffect(() => {
    // Show content immediately (fast)
    setShowContent(true);
    
    // Progress bar fills in 2 seconds (fast)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1.67; // 100% in 2 seconds (100 / (2000/33))
      });
    }, 33);

    // Wait 7 seconds total before navigating (5 seconds after loading completes)
    const timer = setTimeout(() => onFinish(), 7000);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [onFinish]);

  // Elegant bronze palette
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

  // Option 1: White text on bronze background (COMMENT OUT ONE OPTION)
  const USE_WHITE_ON_BRONZE = true; // Set to false for bronze on white

  const container: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: USE_WHITE_ON_BRONZE 
      ? `linear-gradient(135deg, ${BRONZE.dark} 0%, ${BRONZE.primary} 100%)`
      : BRONZE.bgLight,
    overflow: "hidden",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const content: React.CSSProperties = {
    position: "relative",
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: "28px",
    padding: "48px 40px",
    borderRadius: "28px",
    background: USE_WHITE_ON_BRONZE 
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(12px)",
    boxShadow: USE_WHITE_ON_BRONZE
      ? "0 20px 60px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
      : "0 20px 60px rgba(205, 127, 50, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
    border: USE_WHITE_ON_BRONZE
      ? "1px solid rgba(255, 255, 255, 0.15)"
      : `1px solid ${BRONZE.pale}`,
    maxWidth: "480px",
    margin: "20px",
  };

  const logoStyle: React.CSSProperties = {
    fontSize: "3.5rem",
    fontWeight: 700,
    color: USE_WHITE_ON_BRONZE ? "#FFFFFF" : BRONZE.primary,
    letterSpacing: "0.02em",
    fontFamily: "'Merriweather', serif",
    position: "relative",
    textShadow: USE_WHITE_ON_BRONZE
      ? "0 2px 8px rgba(0, 0, 0, 0.2)"
      : "0 2px 4px rgba(205, 127, 50, 0.1)",
  };

  const taglineStyle: React.CSSProperties = {
    fontSize: "1.1rem",
    color: USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.9)" : BRONZE.textLight,
    maxWidth: "400px",
    lineHeight: "1.6",
    fontWeight: 400,
    letterSpacing: "0.02em",
  };

  return (
    <div style={container} ref={animationRef}>
      {/* Subtle background pattern */}
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
        zIndex: 1,
      }} />

      {/* Main content card - FAST appearance but stays visible */}
      <motion.div
        style={content}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={showContent ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.4, ease: "easeOut" }} // Fast appearance
      >
        {/* Decorative top line - FAST */}
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
          animate={showContent ? { width: "100px" } : {}}
          transition={{ delay: 0.2, duration: 0.4 }} // Fast
        />

        {/* Logo container - FAST */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={showContent ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.1, duration: 0.3 }} // Fast
          style={{ position: "relative" }}
        >
          {/* Logo background accent - Slow pulse to show it's "alive" */}
          <motion.div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: USE_WHITE_ON_BRONZE
                ? "radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)"
                : `radial-gradient(circle, ${BRONZE.primary}08 0%, transparent 70%)`,
              filter: "blur(15px)",
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} // Gentle pulse while waiting
          />

          {/* Main logo */}
          <div style={logoStyle}>
            boocozmo
          </div>

          {/* Logo underline - FAST */}
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
            animate={showContent ? { width: "140px" } : {}}
            transition={{ delay: 0.4, duration: 0.5 }} // Fast
          />
        </motion.div>

        {/* Tagline - FAST */}
        <motion.div
          style={taglineStyle}
          initial={{ opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.4 }} // Fast
        >
          Your literary marketplace
          <br />
          <span style={{ 
            fontSize: "0.95rem", 
            opacity: 0.8,
            fontWeight: 300,
            marginTop: "4px",
            display: "block"
          }}>
            Connect with book lovers nearby
          </span>
        </motion.div>

        {/* Progress indicator */}
        <div style={{ width: "100%", maxWidth: "280px" }}>
          {/* Progress bar container - FAST appear */}
          <motion.div
            style={{
              width: "100%",
              height: "3px",
              background: USE_WHITE_ON_BRONZE
                ? "rgba(255, 255, 255, 0.15)"
                : `${BRONZE.pale}`,
              borderRadius: "2px",
              overflow: "hidden",
              position: "relative",
            }}
            initial={{ opacity: 0 }}
            animate={showContent ? { opacity: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.3 }} // Fast
          >
            {/* Progress fill - Fills in 2 seconds then stays full */}
            <motion.div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: `${progress}%`,
                background: USE_WHITE_ON_BRONZE
                  ? "rgba(255, 255, 255, 0.8)"
                  : BRONZE.primary,
                borderRadius: "2px",
              }}
              transition={{ duration: 0.1 }}
            />
            
            {/* Shimmer effect - Moves while progress fills, then stops */}
            <motion.div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: "40px",
                background: USE_WHITE_ON_BRONZE
                  ? "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)"
                  : `linear-gradient(90deg, transparent, ${BRONZE.light}80, transparent)`,
                borderRadius: "2px",
                filter: "blur(1px)",
                opacity: progress < 100 ? 1 : 0, // Hide when progress is complete
              }}
              animate={{ x: [0, 280, 0] }}
              transition={{ 
                duration: 1.5, // Fast shimmer while loading
                repeat: progress < 100 ? Infinity : 0, // Stop when done
                ease: "easeInOut" 
              }}
            />
          </motion.div>

          {/* Loading text - Shows "Loading..." then "Ready" */}
          <motion.div
            style={{
              fontSize: "0.85rem",
              color: USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.7)" : BRONZE.textLight,
              marginTop: "12px",
              fontWeight: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              height: "24px", // Fixed height to prevent layout shift
            }}
            initial={{ opacity: 0 }}
            animate={showContent ? { opacity: 1 } : {}}
            transition={{ delay: 0.7, duration: 0.3 }} // Fast
          >
            {progress < 100 ? (
              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <motion.circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke={USE_WHITE_ON_BRONZE ? "rgba(255, 255, 255, 0.5)" : BRONZE.primary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }} // Fast spinner
                  />
                </svg>
                Loading your experience...
              </motion.span>
            ) : (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill={USE_WHITE_ON_BRONZE ? "#FFFFFF" : BRONZE.primary} />
                </svg>
                Ready to explore!
              </motion.span>
            )}
          </motion.div>
        </div>

        {/* Subtle decorative dots - Only animate while loading */}
        <div style={{
          display: "flex",
          gap: "8px",
          marginTop: "8px",
          height: "12px", // Fixed height
        }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: USE_WHITE_ON_BRONZE 
                  ? "rgba(255, 255, 255, 0.3)" 
                  : `${BRONZE.primary}30`,
                opacity: progress < 100 ? 1 : 0.3, // Fade when done
              }}
              animate={progress < 100 ? { 
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              } : {}}
              transition={{
                duration: 1,
                repeat: progress < 100 ? Infinity : 0,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;