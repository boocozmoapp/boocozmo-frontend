// src/App.tsx - COMPLETE FIXED VERSION with Pinterest-style loading
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SplashScreen from "./pages/SplashScreen";
import HomeScreen from "./pages/HomeScreen";
import OfferScreen from "./pages/OfferScreen";
import ProfileScreen from "./pages/ProfileScreen";
import LoginScreen from "./pages/LoginScreen";
import SignupScreen from "./pages/SignupScreen";
import MapScreen from "./pages/MapScreen";
import ChatScreen from "./pages/ChatScreen";
import SingleChat from "./pages/SingleChat";
import OfferDetailScreen from "./pages/OfferDetailScreen";
import MyLibraryScreen from "./pages/MyLibraryScreen";
import "leaflet/dist/leaflet.css";

const API_BASE = "https://boocozmo-api.onrender.com";

// Pinterest colors
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
  redLight: "#FFE2E6",
  grayLight: "#F7F7F7",
};

// Full user type with token
type User = {
  email: string;
  name: string;
  id: string;
  token: string;
} | null;

// Pinterest-style loading component
function PinterestLoadingScreen() {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: PINTEREST.bg,
      zIndex: 9999,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Animated background grid */}
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
        opacity: 0.2,
      }} />

      {/* Red dots animation */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginBottom: "32px",
      }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: PINTEREST.primary,
              boxShadow: `0 4px 12px ${PINTEREST.redLight}`,
            }}
            animate={{
              y: [0, -20, 0],
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <motion.div
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${PINTEREST.primary}, ${PINTEREST.dark})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "24px",
          fontWeight: "700",
          marginBottom: "16px",
          boxShadow: `0 8px 24px rgba(230, 0, 35, 0.3)`,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        B
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          fontSize: "16px",
          fontWeight: "600",
          color: PINTEREST.textDark,
          letterSpacing: "-0.01em",
          marginBottom: "8px",
        }}
      >
        Loading your library
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          fontSize: "14px",
          color: PINTEREST.textLight,
          maxWidth: "200px",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        Preparing your reading experience
      </motion.div>

      {/* Progress bar */}
      <div style={{
        width: "200px",
        height: "4px",
        background: PINTEREST.border,
        borderRadius: "2px",
        overflow: "hidden",
        marginTop: "24px",
      }}>
        <motion.div
          style={{
            height: "100%",
            width: "30%",
            background: `linear-gradient(90deg, ${PINTEREST.primary}, ${PINTEREST.light})`,
            borderRadius: "2px",
          }}
          animate={{
            width: ["30%", "70%", "30%"],
            x: ["0%", "30%", "0%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Floating books in background */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: 0.1,
      }}>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              fontSize: "24px",
              color: PINTEREST.primary,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              rotate: [0, 360],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.2,
            }}
          >
            {i % 2 === 0 ? "📚" : "📖"}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AppContent() {
  const [user, setUser] = useState<User>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeUser = async () => {
      const saved = localStorage.getItem("user");
      if (saved) {
        try {
          const parsedUser = JSON.parse(saved) as User;

          if (parsedUser && parsedUser.token && parsedUser.email) {
            // Validate session with backend
            const response = await fetch(`${API_BASE}/validate-session`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: parsedUser.email }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.valid) {
                setUser(parsedUser);
              } else {
                localStorage.removeItem("user");
                setUser(null);
              }
            } else {
              localStorage.removeItem("user");
              setUser(null);
            }
          } else {
            localStorage.removeItem("user");
            setUser(null);
          }
        } catch (error) {
          console.error("Error loading user:", error);
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      setIsLoadingUser(false);
    };

    initializeUser();
  }, []);

  // Now correctly receives full user with token
  const handleAuthSuccess = (userData: { email: string; name: string; id: string; token: string }) => {
    const fullUser: User = {
      email: userData.email,
      name: userData.name,
      id: userData.id.toString(),
      token: userData.token,
    };

    localStorage.setItem("user", JSON.stringify(fullUser));
    setUser(fullUser);
  };


  const goTo = (path: string) => {
    return () => {
      navigate(path);
    };
  };

  if (isLoadingUser) {
    return <PinterestLoadingScreen />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          user ? (
            <HomeScreen
              currentUser={user}
              onAddPress={goTo("/offer")}
              onProfilePress={goTo("/profile")}
              onMapPress={goTo("/map")}
            />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      <Route
        path="/signup"
        element={
          user ? (
            <HomeScreen
              currentUser={user}
              onAddPress={goTo("/offer")}
              onProfilePress={goTo("/profile")}
              onMapPress={goTo("/map")}
            />
          ) : (
            <SignupScreen
              onSignupSuccess={handleAuthSuccess}
              onGoToLogin={goTo("/login")}
            />
          )
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          user ? (
            <HomeScreen
              currentUser={user}
              onAddPress={goTo("/offer")}
              onProfilePress={goTo("/profile")}
              onMapPress={goTo("/map")}
            />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      <Route
        path="/offer"
        element={
          user ? (
            <OfferScreen
              onBack={goTo("/")}
              currentUser={user}
              onProfilePress={goTo("/profile")}
              onMapPress={goTo("/map")}
              onAddPress={goTo("/offer")}
            />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      <Route
        path="/offer/:id"
        element={
          user ? (
            <OfferDetailScreen currentUser={user} />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      <Route
        path="/profile"
        element={
          user ? (
            <ProfileScreen currentUser={user} />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      <Route
        path="/map"
        element={
          user ? (
            <MapScreen currentUser={user} />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      <Route
        path="/chat"
        element={
          user ? (
            <ChatScreen currentUser={user} />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      <Route
        path="/chat/:chatId"
        element={
          user ? (
            <SingleChat currentUser={user} />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      {/* ADD THIS NEW ROUTE - My Library Screen */}
      <Route
        path="/my-library"
        element={
          user ? (
            <MyLibraryScreen
              currentUser={user}
              onBack={goTo("/")}
            />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      {showSplash ? <SplashScreen onFinish={() => setShowSplash(false)} /> : <AppContent />}
    </BrowserRouter>
  );
}