 
// src/App.tsx - GREEN ENERGY THEME + Fixed Profile Route
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


// GREEN ENERGY THEME
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
  success: "#6BA87A",
};

type User = {
  email: string;
  name: string;
  id: string;
  token: string;
} | null;

// Green energy loading screen (replaces Pinterest red)
function GreenLoadingScreen() {
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
      background: GREEN.dark,
      zIndex: 9999,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Subtle animated grid background */}
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
        backgroundSize: "60px 60px",
        opacity: 0.3,
      }} />

      {/* Bouncing green dots */}
      <div style={{
        display: "flex",
        gap: "16px",
        marginBottom: "40px",
      }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: GREEN.accent,
              boxShadow: `0 6px 20px rgba(74, 124, 89, 0.4)`,
            }}
            animate={{
              y: [0, -30, 0],
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Logo with rotation */}
      <motion.div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${GREEN.accent}, ${GREEN.accentLight})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "32px",
          fontWeight: "800",
          marginBottom: "24px",
          boxShadow: `0 12px 40px rgba(74, 124, 89, 0.5)`,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        B
      </motion.div>

      {/* Text */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: "24px",
          fontWeight: "700",
          color: GREEN.textPrimary,
          margin: "0 0 12px",
          letterSpacing: "-0.5px",
        }}
      >
        Boocozmo
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          fontSize: "16px",
          color: GREEN.textSecondary,
          margin: "0 0 32px",
          textAlign: "center",
          maxWidth: "280px",
          lineHeight: 1.5,
        }}
      >
        Connecting readers, one book at a time
      </motion.p>

      {/* Progress bar */}
      <div style={{
        width: "240px",
        height: "6px",
        background: GREEN.grayLight,
        borderRadius: "3px",
        overflow: "hidden",
        marginTop: "20px",
      }}>
        <motion.div
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${GREEN.accent}, ${GREEN.accentLight})`,
            borderRadius: "3px",
          }}
          animate={{
            width: ["20%", "80%", "20%"],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Floating book icons */}
      <div style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: 0.15,
      }}>
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              fontSize: "32px",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            📚
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
            // Optional: validate session with backend
            // const response = await fetch(`${API_BASE}/validate-session`, { ... });
            // For now, trust localStorage
            setUser(parsedUser);
          } else {
            localStorage.removeItem("user");
          }
        } catch (error) {
          console.error("Error loading user:", error);
          localStorage.removeItem("user");
        }
      }
      setIsLoadingUser(false);
    };

    initializeUser();
  }, []);

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


  const goTo = (path: string) => () => navigate(path);

  if (isLoadingUser) {
    return <GreenLoadingScreen />;
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
            <LoginScreen onLoginSuccess={handleAuthSuccess} onGoToSignup={goTo("/signup")} />
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
            <LoginScreen onLoginSuccess={handleAuthSuccess} onGoToSignup={goTo("/signup")} />
          )
        }
      />

      <Route
        path="/offer/:id"
        element={user ? <OfferDetailScreen currentUser={user} /> : <LoginScreen onLoginSuccess={handleAuthSuccess} onGoToSignup={function (): void {
          throw new Error("Function not implemented.");
        } } />}
      />

      {/* FIXED: Removed invalid onLogout prop */}
      <Route
        path="/profile"
        element={user ? <ProfileScreen currentUser={user} /> : <LoginScreen onLoginSuccess={handleAuthSuccess} onGoToSignup={function (): void {
          throw new Error("Function not implemented.");
        } } />}
      />

      <Route
        path="/map"
        element={user ? <MapScreen currentUser={user} /> : <LoginScreen onLoginSuccess={handleAuthSuccess} onGoToSignup={function (): void {
          throw new Error("Function not implemented.");
        } } />}
      />

      <Route
        path="/chat"
        element={user ? <ChatScreen currentUser={user} /> : <LoginScreen onLoginSuccess={handleAuthSuccess} onGoToSignup={function (): void {
          throw new Error("Function not implemented.");
        } } />}
      />

      <Route
        path="/chat/:chatId"
        element={user ? <SingleChat currentUser={user} /> : <LoginScreen onLoginSuccess={handleAuthSuccess} onGoToSignup={function (): void {
          throw new Error("Function not implemented.");
        } } />}
      />

      <Route
        path="/my-library"
        element={
          user ? (
            <MyLibraryScreen
              currentUser={user}
              onBack={goTo("/")}
              onAddPress={goTo("/offer")}
              onProfilePress={goTo("/profile")}
              onMapPress={goTo("/map")}
            />
          ) : (
            <LoginScreen onLoginSuccess={handleAuthSuccess} onGoToSignup={function (): void {
                throw new Error("Function not implemented.");
              } } />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      {showSplash ? <SplashScreen onFinish={() => setShowSplash(false)} /> : <AppContent />}
    </BrowserRouter>
  );
}