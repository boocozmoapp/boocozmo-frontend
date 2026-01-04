// src/SplashScreen.tsx - FINAL: Calm, Sustainable Green Theme (Simple & Elegant)
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
    setShowContent(true);

    const startTime = Date.now();
    const duration = 2000;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 30);

    const totalTimer = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(totalTimer);
    };
  }, [onFinish]);

  // CALM GREEN THEME – Sustainable, Bookish, Natural
  const GREEN = {
    dark: "#0F2415",           // Deep forest green (calm, premium)
    medium: "#1A3A2A",         // Card background
    accent: "#4A7C59",         // Muted sage green for highlights
    accentLight: "#6BA87A",
    textPrimary: "#FFFFFF",
    textSecondary: "#E8F0E8",  // Soft off-white green
    textMuted: "#A8B8A8",
    progressBg: "#2A4A3A",
    border: "rgba(74, 124, 89, 0.3)",
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
      background: `linear-gradient(to bottom, ${GREEN.dark} 0%, #0A1C10 100%)`,
      overflow: "hidden",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Subtle background texture */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "radial-gradient(circle at 50% 50%, rgba(74, 124, 89, 0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Very subtle floating leaves/books */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: 0.08,
      }}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              fontSize: "28px",
              color: GREEN.accent,
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 15, 0],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {i % 2 === 0 ? "📖" : "📚"}
          </motion.div>
        ))}
      </div>

      {/* Main Card - Clean & Minimal */}
      <motion.div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "40px",
          padding: "60px 48px",
          borderRadius: "32px",
          background: GREEN.medium,
          boxShadow: "0 32px 80px rgba(0, 0, 0, 0.4)",
          border: `1px solid ${GREEN.border}`,
          maxWidth: "480px",
          margin: "20px",
        }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={showContent ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
      >
        {/* Simple Logo Circle */}
        <motion.div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: GREEN.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.3)",
          }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <span style={{
            fontSize: "48px",
            fontWeight: "800",
            color: "white",
          }}>
            B
          </span>
        </motion.div>

        {/* App Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
        >
          <h1 style={{
            fontSize: "3rem",
            fontWeight: 800,
            margin: 0,
            color: GREEN.textPrimary,
            letterSpacing: "-0.02em",
          }}>
            Boocozmo
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          style={{ maxWidth: "380px" }}
        >
          <p style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: GREEN.textPrimary,
            margin: "0 0 12px 0",
          }}>
            Sustainable Book Sharing
          </p>
          <p style={{
            fontSize: "1rem",
            color: GREEN.textSecondary,
            lineHeight: "1.6",
          }}>
            Keep stories alive. Reduce waste. Build your personal library and share with your community.
          </p>
        </motion.div>

        {/* Minimal Feature Icons */}
        <motion.div
          style={{
            display: "flex",
            gap: "32px",
          }}
          initial={{ opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{ delay: 0.7 }}
        >
          {[
            { Icon: FaBookOpen, label: "Discover" },
            { Icon: FaBookmark, label: "Save" },
            { Icon: FaUsers, label: "Connect" },
            { Icon: FaMapMarkerAlt, label: "Local" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(74, 124, 89, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <item.Icon size={22} color={GREEN.accentLight} />
              </div>
              <span style={{
                fontSize: "0.875rem",
                color: GREEN.textSecondary,
                fontWeight: 500,
              }}>
                {item.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Clean Progress Bar */}
        <div style={{ width: "100%", maxWidth: "300px", marginTop: "20px" }}>
          <div style={{
            width: "100%",
            height: "6px",
            background: GREEN.progressBg,
            borderRadius: "3px",
            overflow: "hidden",
          }}>
            <motion.div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: GREEN.accent,
                borderRadius: "3px",
              }}
            />
          </div>

          <p style={{
            marginTop: "16px",
            fontSize: "0.95rem",
            color: GREEN.textSecondary,
            fontWeight: 500,
          }}>
            Preparing your library...
          </p>
        </div>

        {/* Footer */}
        <div style={{
          fontSize: "0.75rem",
          color: GREEN.textMuted,
          marginTop: "24px",
        }}>
          © {new Date().getFullYear()} Boocozmo
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;