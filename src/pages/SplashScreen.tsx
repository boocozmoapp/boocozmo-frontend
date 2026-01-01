// src/SplashScreen.tsx
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaBook, FaBookOpen, FaBookReader } from "react-icons/fa";

interface SplashScreenProps {
  onFinish: () => void;
}

interface FloatingBook {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  delay: number;
  icon: React.ReactNode;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const animationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => onFinish(), 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  // Bronze color palette
  const BRONZE = {
    primary: "#CD7F32", // Classic bronze
    light: "#E6B17E",
    dark: "#B87333",
    pale: "#F5E7D3",
    shimmer: "#FFD700", // Gold accent
  };

  // Generate floating books
  const floatingBooks: FloatingBook[] = [
    { id: 1, x: 10, y: 20, size: 28, rotation: -15, delay: 0, icon: <FaBook color={BRONZE.light} /> },
    { id: 2, x: 85, y: 15, size: 32, rotation: 10, delay: 0.3, icon: <FaBookOpen color={BRONZE.primary} /> },
    { id: 3, x: 20, y: 75, size: 24, rotation: 5, delay: 0.6, icon: <FaBookReader color={BRONZE.light} /> },
    { id: 4, x: 75, y: 70, size: 30, rotation: -10, delay: 0.9, icon: <FaBook color={BRONZE.primary} /> },
    { id: 5, x: 45, y: 10, size: 26, rotation: 20, delay: 1.2, icon: <FaBookOpen color={BRONZE.light} /> },
    { id: 6, x: 15, y: 50, size: 22, rotation: -5, delay: 1.5, icon: <FaBookReader color={BRONZE.primary} /> },
    { id: 7, x: 80, y: 45, size: 34, rotation: 15, delay: 1.8, icon: <FaBook color={BRONZE.light} /> },
    { id: 8, x: 40, y: 85, size: 28, rotation: -20, delay: 2.1, icon: <FaBookOpen color={BRONZE.primary} /> },
  ];

  // Inline styles
  const container: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #FFFFFF 0%, #F9F5F0 30%, #F5F0E6 100%)",
    color: BRONZE.dark,
    overflow: "hidden",
    fontFamily: "'Georgia', 'Times New Roman', serif",
  };

  const content: React.CSSProperties = {
    position: "relative",
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: "16px",
    padding: "40px",
    borderRadius: "24px",
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 20px 60px rgba(205, 127, 50, 0.15)",
    border: `1px solid ${BRONZE.pale}`,
  };

  const titleStyle: React.CSSProperties = {
    marginTop: "8px",
    fontSize: "3.5rem",
    fontWeight: 800,
    color: BRONZE.dark,
    letterSpacing: "0.05em",
    textShadow: `2px 2px 4px rgba(184, 115, 51, 0.2)`,
    fontFamily: "'Playfair Display', serif",
    position: "relative",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "1.1rem",
    color: "#666",
    maxWidth: "400px",
    lineHeight: "1.6",
    marginTop: "4px",
  };

  const bronzeAccent: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "280px",
    height: "280px",
    borderRadius: "50%",
    background: `radial-gradient(circle, ${BRONZE.primary}20 0%, transparent 70%)`,
    filter: "blur(20px)",
    zIndex: 1,
  };

  const floatingBookStyle = (book: FloatingBook): React.CSSProperties => ({
    position: "absolute",
    left: `${book.x}%`,
    top: `${book.y}%`,
    fontSize: `${book.size}px`,
    transform: `rotate(${book.rotation}deg)`,
    opacity: 0.7,
    filter: "drop-shadow(0 4px 6px rgba(205, 127, 50, 0.3))",
    zIndex: 2,
  });

  return (
    <div style={container} ref={animationRef}>
      {/* Floating books in background */}
      {floatingBooks.map((book) => (
        <motion.div
          key={book.id}
          style={floatingBookStyle(book)}
          initial={{ y: 100, opacity: 0, scale: 0.5 }}
          animate={{ 
            y: [null, -20, 0, -20],
            opacity: 0.7,
            scale: 1,
            rotate: [book.rotation, book.rotation + 5, book.rotation]
          }}
          transition={{
            delay: book.delay,
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          {book.icon}
        </motion.div>
      ))}

      {/* Bronze glow effect */}
      <motion.div
        style={bronzeAccent}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Main content card */}
      <div style={content}>
        {/* Decorative elements */}
        <motion.div
          style={{
            position: "absolute",
            top: "-10px",
            width: "60px",
            height: "4px",
            background: BRONZE.primary,
            borderRadius: "2px",
          }}
          initial={{ width: 0 }}
          animate={{ width: "60px" }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />

        {/* Main icon with animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 150, 
            damping: 15,
            delay: 0.2 
          }}
          style={{ position: "relative" }}
        >
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${BRONZE.light}30 0%, transparent 70%)`,
            filter: "blur(15px)",
          }} />
          
          <FaBookOpen 
            size={100} 
            color={BRONZE.primary}
            style={{
              filter: `drop-shadow(0 8px 16px ${BRONZE.primary}40)`,
            }}
          />
          
          {/* Shimmer effect on icon */}
          <motion.div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `linear-gradient(45deg, transparent 30%, ${BRONZE.shimmer}40 50%, transparent 70%)`,
              borderRadius: "50%",
            }}
            animate={{ x: [-100, 100] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
              delay: 1,
            }}
          />
        </motion.div>

        {/* Title and subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div style={titleStyle}>
            BookSphere
            <motion.span
              style={{
                position: "absolute",
                bottom: "-8px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "120px",
                height: "3px",
                background: `linear-gradient(90deg, transparent, ${BRONZE.primary}, transparent)`,
                borderRadius: "2px",
              }}
              initial={{ width: 0 }}
              animate={{ width: "120px" }}
              transition={{ delay: 1.2, duration: 1 }}
            />
          </div>
          
          <motion.div
            style={subtitleStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            Connect • Exchange • Discover
            <br />
            <span style={{ 
              fontSize: "0.9rem", 
              color: BRONZE.dark,
              fontWeight: 500 
            }}>
              Your literary marketplace awaits
            </span>
          </motion.div>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "24px",
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: BRONZE.primary,
              }}
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Subtle pattern overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: `radial-gradient(${BRONZE.light}10 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        opacity: 0.3,
        zIndex: 1,
      }} />
    </div>
  );
};

export default SplashScreen;