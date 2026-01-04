/* eslint-disable @typescript-eslint/no-explicit-any */
// src/App.tsx - PREMIUM THEME
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaHome, FaSearch, FaPlusSquare, FaBookOpen, FaUser } from "react-icons/fa";
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
import CommunityScreen from "./pages/CommunityScreen";
import "leaflet/dist/leaflet.css";

type User = {
  email: string;
  name: string;
  id: string;
  token: string;
} | null;

// Premium loading screen
function PremiumLoadingScreen() {
  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-primary-light/20 rounded-full blur-[120px]" />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-4 border-primary-light border-t-secondary rounded-full"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-text-muted font-serif tracking-widest text-sm"
      >
        LOADING EXPERIENCE...
      </motion.p>
    </div>
  );
}

function MobileNavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: FaHome, route: "/", label: "Home" },
    { icon: FaSearch, route: "/map", label: "Explore" },
    { icon: FaPlusSquare, route: "/offer", label: "Post" },
    { icon: FaBookOpen, route: "/my-library", label: "Library" },
    { icon: FaUser, route: "/profile", label: "You" },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 h-16 bg-primary/95 backdrop-blur-xl border border-white/10 rounded-2xl z-50 flex items-center justify-around px-2 shadow-2xl shadow-black/50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.route;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.route)}
            className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? "text-secondary" : "text-gray-400 hover:text-white"
            }`}
          >
            <item.icon size={isActive ? 24 : 22} />
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -bottom-2 w-1 h-1 rounded-full bg-secondary"
              />
            )}
          </button>
        );
      })}
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
    return <PremiumLoadingScreen />;
  }

  const authorized = !!user;

  // Helper to render protected route or redirect
  const ProtectedRoute = ({ element }: { element: React.ReactElement }) => {
    return authorized ? element : <LoginScreen onLoginSuccess={handleAuthSuccess} onGoToSignup={goTo("/signup")} />;
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-primary text-text-main flex flex-col relative">
      <div className="flex-1 overflow-hidden relative z-0">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={authorized ? <HomeScreen currentUser={user!} onAddPress={goTo("/offer")} onProfilePress={goTo("/profile")} onMapPress={goTo("/map")} /> : <LoginScreen onLoginSuccess={handleAuthSuccess} onGoToSignup={goTo("/signup")} />} />
          <Route path="/signup" element={authorized ? <HomeScreen currentUser={user!} onAddPress={goTo("/offer")} onProfilePress={goTo("/profile")} onMapPress={goTo("/map")} /> : <SignupScreen onSignupSuccess={handleAuthSuccess} onGoToLogin={goTo("/login")} />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute element={<HomeScreen currentUser={user!} onAddPress={goTo("/offer")} onProfilePress={goTo("/profile")} onMapPress={goTo("/map")} />} />} />
          <Route path="/offer" element={<ProtectedRoute element={<OfferScreen onBack={goTo("/")} currentUser={user!} onProfilePress={goTo("/profile")} onMapPress={goTo("/map")} onAddPress={goTo("/offer")} />} />} />
          <Route path="/offer/:id" element={<ProtectedRoute element={<OfferDetailScreen currentUser={user!} />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<ProfileScreen currentUser={user!} />} />} />
          <Route path="/map" element={<ProtectedRoute element={<MapScreen currentUser={user!} />} />} />
          <Route path="/chat" element={<ProtectedRoute element={<ChatScreen currentUser={user!} />} />} />
          <Route path="/chat/:chatId" element={<ProtectedRoute element={<SingleChat currentUser={user!} />} />} />
          <Route path="/my-library" element={<ProtectedRoute element={<MyLibraryScreen currentUser={user!} onBack={goTo("/")} onAddPress={goTo("/offer")} onProfilePress={goTo("/profile")} onMapPress={goTo("/map")} />} />} />
          <Route path="/community" element={<ProtectedRoute element={<CommunityScreen />} />} />
        </Routes>
      </div>

      {authorized && <MobileNavBar />}
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <BrowserRouter>
      {showSplash ? <SplashScreen onFinish={() => setShowSplash(false)} /> : <AppContent />}
    </BrowserRouter>
  );
}