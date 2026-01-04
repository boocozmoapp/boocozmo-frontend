// src/SplashScreen.tsx - GREEN ENERGY THEME (Reliable 5-second delay)
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { FaBookOpen, FaBookmark, FaUsers, FaMapMarkerAlt, FaLeaf } from "react-icons/fa";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = React.useState(0);
  const [showContent, setShowContent] = React.useState(false);

  useEffect(() => {
    // 1. Show content immediately
    setShowContent(true);

    // 2. Fill progress bar over ~2 seconds
    const startTime = Date.now();
    const duration = 2000; // 2 seconds for loading animation

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);

      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 30);

    // 3. Wait full 5 seconds before calling onFinish()
    const totalTimer = setTimeout(() => {
      onFinish();
    }, 5000); // Exactly 5 seconds

    // Cleanup
    return () => {
      clearInterval(progressInterval);
      clearTimeout(totalTimer);
    };
  }, [onFinish]);

  // GREEN ENERGY THEME - Matching the app
  const GREEN = {
    dark: "#0F2415",
    medium: "#1A3A2A",
    accent: "#4A7C59",
    accentLight: "#6BA87A",
    textPrimary: "#E8F0E8",
    textSecondary: "#A8B8A8",
    textMuted: "#80A080",
    border: "rgba(74, 124, 89, 0.3)",
    grayLight: "#2A4A3A",
    hoverBg: "#255035",
    icon: "#80A080",
    success: "#6BA87A",
    info: "#1D9BF0",
    warning: "#FF9500",
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: GREEN.dark,
      overflow: "hidden",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Background with leaf pattern */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: `
          radial-gradient(circle at 15% 50%, rgba(74, 124, 89, 0.05) 0%, transparent 25%),
          radial-gradient(circle at 85% 30%, rgba(107, 168, 122, 0.05) 0%, transparent 25%)
        `,
        zIndex: 1,
      }} />

      {/* Subtle grid pattern */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: `
          linear-gradient(to right, ${GREEN.border} 1px, transparent 1px),
          linear-gradient(to bottom, ${GREEN.border} 1px, transparent 1px)
        `,
        backgroundSize: "50px 50px",
        opacity: 0.15,
        zIndex: 2,
      }} />

      {/* Floating leaves and books */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}>
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              fontSize: "28px",
              color: i % 4 === 0 ? GREEN.accent : 
                     i % 4 === 1 ? GREEN.accentLight : 
                     i % 4 === 2 ? "#A8B8A8" : GREEN.textMuted,
              opacity: 0.1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              rotate: `${(i * 15) - 45}deg`,
            }}
            initial={{ scale: 0 }}
            animate={{ 
              scale: [0, 1, 0.8, 1],
              rotate: [
                `${(i * 15) - 45}deg`,
                `${(i * 15) - 25}deg`,
                `${(i * 15) - 45}deg`
              ],
            }}
            transition={{ 
              delay: i * 0.07,
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            {["📚", "📖", "🍃", "🌿", "📗", "📘", "🌱", "📙", "🌳", "📒", "🌲", "📕"][i]}
          </motion.div>
        ))}
      </div>

      {/* Main card */}
      <motion.div
        style={{
          position: "relative",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "24px",
          padding: "40px 32px",
          borderRadius: "20px",
          background: "rgba(26, 58, 42, 0.9)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.2)",
          border: `1px solid ${GREEN.border}`,
          maxWidth: "480px",
          margin: "20px",
        }}
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={showContent ? { scale: 1, opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo badge */}
        <motion.div
          style={{
            width: "90px",
            height: "90px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${GREEN.accent}, ${GREEN.accentLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "36px",
            fontWeight: "800",
            marginBottom: "16px",
            boxShadow: "0 8px 32px rgba(74, 124, 89, 0.5)",
          }}
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            delay: 0.5,
            duration: 0.8,
            ease: "easeInOut"
          }}
        >
          B
        </motion.div>

        {/* Logo text */}
        <motion.h1
          style={{
            fontSize: "3rem",
            fontWeight: 800,
            color: GREEN.textPrimary,
            letterSpacing: "-0.02em",
            margin: 0,
            background: `linear-gradient(135deg, ${GREEN.accentLight}, ${GREEN.textPrimary})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          Boocozmo
        </motion.h1>

        {/* Tagline */}
        <motion.div
          style={{
            fontSize: "1.125rem",
            color: GREEN.textSecondary,
            maxWidth: "400px",
            lineHeight: "1.6",
            fontWeight: 400,
            letterSpacing: "0.01em",
          }}
          initial={{ opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          Sustainable book sharing
          <br />
          <span style={{ 
            fontSize: "0.95rem", 
            color: GREEN.textMuted,
            fontWeight: 300,
            marginTop: "4px",
            display: "block"
          }}>
            Connect, read, and grow together
          </span>
        </motion.div>

        {/* Feature icons */}
        <motion.div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "8px",
          }}
          initial={{ opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          {[
            { Icon: FaBookOpen, label: "Discover", color: GREEN.accentLight },
            { Icon: FaBookmark, label: "Save", color: GREEN.textSecondary },
            { Icon: FaUsers, label: "Connect", color: GREEN.accentLight },
            { Icon: FaMapMarkerAlt, label: "Local", color: GREEN.textSecondary },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={showContent ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
            >
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: GREEN.hoverBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: item.color,
                fontSize: "20px",
                border: `1px solid ${GREEN.border}`,
              }}>
                <item.Icon />
              </div>
              <span style={{
                fontSize: "0.75rem",
                color: GREEN.textMuted,
                fontWeight: 500,
              }}>
                {item.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Progress bar */}
        <div style={{ width: "100%", maxWidth: "280px", marginTop: "24px" }}>
          <div style={{
            width: "100%",
            height: "4px",
            background: GREEN.grayLight,
            borderRadius: "2px",
            overflow: "hidden",
          }}>
            <motion.div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${GREEN.accent}, ${GREEN.accentLight})`,
                borderRadius: "2px",
              }}
            />
          </div>

          {/* Status text */}
          <div style={{
            fontSize: "0.875rem",
            color: GREEN.textMuted,
            marginTop: "12px",
            textAlign: "center",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ fontSize: "12px" }}
            >
              <FaLeaf />
            </motion.div>
            {progress < 100 ? "Loading sustainable community..." : "Ready to grow!"}
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          fontSize: "0.75rem",
          color: GREEN.textMuted,
          marginTop: "24px",
          opacity: 0.6,
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}>
          <FaLeaf size={10} />
          © {new Date().getFullYear()} Boocozmo • Green Reading Community
        </div>
      </motion.div>

      {/* Bottom hint */}
      {progress >= 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.7, y: 0 }}
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "0.875rem",
            color: GREEN.textMuted,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <motion.span 
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: "20px" }}
          >
            ↓
          </motion.span>
          Entering your green reading space
          <motion.span 
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            style={{ fontSize: "20px" }}
          >
            ↓
          </motion.span>
        </motion.div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .leaf-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;