// src/SplashScreen.tsx - PINTEREST LITERARY STYLE (Reliable 5-second delay)
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { FaBookOpen, FaBookmark, FaUsers, FaMapMarkerAlt } from "react-icons/fa";

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
  }, [onFinish]); // Only run once

  // Pinterest color palette
  const PINTEREST = {
    primary: "#E60023",
    dark: "#A3081A",
    light: "#FF4D6D",
    bg: "#FFFFFF",
    textDark: "#000000",
    textLight: "#5F5F5F",
    textMuted: "#8E8E8E",
    border: "#E1E1E1",
    hoverBg: "#F5F5F5",
    grayLight: "#F7F7F7",
    redLight: "#FFE2E6"
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
      background: PINTEREST.bg,
      overflow: "hidden",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: `
          linear-gradient(to right, ${PINTEREST.border} 1px, transparent 1px),
          linear-gradient(to bottom, ${PINTEREST.border} 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        opacity: 0.3,
        zIndex: 1,
      }} />

      {/* Floating books */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              fontSize: "24px",
              color: i % 3 === 0 ? PINTEREST.primary : 
                     i % 3 === 1 ? PINTEREST.textLight : PINTEREST.textMuted,
              opacity: 0.15,
              rotate: `${(i * 15) - 45}deg`,
            }}
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0
            }}
            animate={{ 
              scale: 1,
              rotate: [`${(i * 15) - 45}deg`, `${(i * 15) - 30}deg`],
            }}
            transition={{ 
              delay: i * 0.1,
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            {i % 2 === 0 ? "📚" : "📖"}
          </motion.div>
        ))}
      </div>

      {/* Main card */}
      <motion.div
        style={{
          position: "relative",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "32px",
          padding: "48px 40px",
          borderRadius: "24px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 32px 80px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.04)",
          border: `1px solid ${PINTEREST.border}`,
          maxWidth: "500px",
          margin: "20px",
        }}
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={showContent ? { scale: 1, opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo badge */}
        <motion.div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: PINTEREST.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "32px",
            fontWeight: "700",
            marginBottom: "16px",
            boxShadow: "0 8px 32px rgba(230, 0, 35, 0.3)",
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
            color: PINTEREST.textDark,
            letterSpacing: "-0.02em",
            margin: 0,
            background: `linear-gradient(135deg, ${PINTEREST.textDark} 0%, ${PINTEREST.textLight} 100%)`,
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
            color: PINTEREST.textLight,
            maxWidth: "400px",
            lineHeight: "1.6",
            fontWeight: 400,
            letterSpacing: "0.01em",
          }}
          initial={{ opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          Where book lovers connect
          <br />
          <span style={{ 
            fontSize: "0.95rem", 
            color: PINTEREST.textMuted,
            fontWeight: 300,
            marginTop: "4px",
            display: "block"
          }}>
            Discover, share, and exchange literary treasures
          </span>
        </motion.div>

        {/* Feature icons */}
        <motion.div
          style={{
            display: "flex",
            gap: "24px",
            marginTop: "8px",
          }}
          initial={{ opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          {[
            { Icon: FaBookOpen, label: "Discover", color: PINTEREST.primary },
            { Icon: FaBookmark, label: "Save", color: PINTEREST.textLight },
            { Icon: FaUsers, label: "Connect", color: PINTEREST.primary },
            { Icon: FaMapMarkerAlt, label: "Local", color: PINTEREST.textLight },
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
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: PINTEREST.grayLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: item.color,
                fontSize: "18px",
              }}>
                <item.Icon />
              </div>
              <span style={{
                fontSize: "0.75rem",
                color: PINTEREST.textMuted,
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
            background: PINTEREST.border,
            borderRadius: "2px",
            overflow: "hidden",
          }}>
            <motion.div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${PINTEREST.primary}, ${PINTEREST.light})`,
                borderRadius: "2px",
              }}
            />
          </div>

          {/* Status text */}
          <div style={{
            fontSize: "0.875rem",
            color: PINTEREST.textMuted,
            marginTop: "12px",
            textAlign: "center",
            fontWeight: 500,
          }}>
            {progress < 100 ? "Loading community..." : "Ready to explore!"}
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          fontSize: "0.75rem",
          color: PINTEREST.textMuted,
          marginTop: "24px",
          opacity: 0.6,
        }}>
          © {new Date().getFullYear()} Boocozmo • A literary community
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
            color: PINTEREST.textMuted,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ animation: "bounce 2s infinite" }}>↓</span>
          Entering your book community
          <span style={{ animation: "bounce 2s infinite", animationDelay: "0.5s" }}>↓</span>
        </motion.div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;