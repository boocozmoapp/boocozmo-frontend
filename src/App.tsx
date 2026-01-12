/* eslint-disable @typescript-eslint/no-explicit-any */
// src/App.tsx - VITE-PROOF & HMR-RESILIENT VERSION (FIXED DEADLOCK)
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { FaUserCircle, FaEnvelope, FaSignOutAlt, FaMapMarkerAlt, FaBook, FaPlus, FaStore } from "react-icons/fa";
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
import DiscoverScreen from "./pages/DiscoverScreen";
import WelcomeScreen from "./pages/WelcomeScreen";
import StoreDetailScreen from "./pages/StoreDetailScreen";
import StoresScreen from "./pages/StoresScreen";
import AuthCallback from "./pages/AuthCallback";
import CommunityScreen from "./pages/CommunityScreen";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationBell from "./components/NotificationBell";
import "leaflet/dist/leaflet.css";

type User = {
  email: string;
  name: string;
  id: string;
  token: string;
} | null;

const AppContent = () => {
  // 1. SYNCHRONOUS INITIALIZATION
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (saved) {
        const u = JSON.parse(saved);
        return (u && u.token) ? u : null;
      }
    } catch (e) { return null; }
    return null;
  });

  const navigate = useNavigate();
  const location = useLocation();

  const handleAuth = useCallback((u: any) => {
    console.log("💎 App: Auth Received", u.email);
    const fullUser = { ...u, id: u.id.toString() };
    try {
      localStorage.setItem("user", JSON.stringify(fullUser));
      sessionStorage.setItem("user", JSON.stringify(fullUser));
    } catch (e) { console.warn("Storage restricted"); }
    setUser(fullUser);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setUser(null);
    window.location.replace("/");
  }, []);

  const authProps = useMemo(() => ({ currentUser: user!, wishlist: [], toggleWishlist: () => {} }), [user]);

  return (
    <NotificationProvider currentUser={user}>
      <div className="min-h-screen bg-[#fdfaf5]">
        {user && (
          <header className="bg-[#f4f1ea] border-b px-4 h-14 flex items-center sticky top-0 z-50 justify-between">
            <h1 onClick={() => navigate("/home")} className="text-xl font-serif font-bold text-[#382110] cursor-pointer">Boocozmo</h1>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <button 
                onClick={() => navigate("/profile")} 
                className="w-8 h-8 rounded-full bg-[#382110] text-white text-xs font-bold"
              >
                {user.name.charAt(0)}
              </button>
              <button onClick={handleLogout} className="text-[#382110]"><FaSignOutAlt /></button>
            </div>
          </header>
        )}

        <Routes>
          {/* Always allow AuthCallback to render so it can process the login */}
          <Route path="/auth/callback" element={<AuthCallback onLoginSuccess={handleAuth} />} />
          <Route path="/login" element={<LoginScreen onLoginSuccess={handleAuth} onGoToSignup={() => navigate("/signup")} />} />
          <Route path="/signup" element={<SignupScreen onSignupSuccess={handleAuth} onGoToLogin={() => navigate("/login")} />} />

          <Route path="/" element={!user ? <WelcomeScreen /> : <Navigate to="/home" replace />} />
          
          <Route path="/home" element={user ? <HomeScreen {...authProps} /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={user ? <ProfileScreen {...authProps} /> : <Navigate to="/login" replace />} />
          <Route path="/map" element={user ? <MapScreen {...authProps} /> : <Navigate to="/login" replace />} />
          <Route path="/chat" element={user ? <ChatScreen {...authProps} /> : <Navigate to="/login" replace />} />
          <Route path="/chat/:chatId" element={user ? <SingleChat {...authProps} /> : <Navigate to="/login" replace />} />
          <Route path="/my-library" element={user ? <MyLibraryScreen {...authProps} onBack={() => navigate("/home")} onAddPress={() => navigate("/offer")} onProfilePress={() => navigate("/profile")} onMapPress={() => navigate("/map")} /> : <Navigate to="/login" replace />} />
          <Route path="/stores" element={user ? <StoresScreen {...authProps} /> : <Navigate to="/login" replace />} />
          <Route path="/offer" element={user ? <OfferScreen {...authProps} onBack={() => navigate("/home")} onProfilePress={() => navigate("/profile")} onMapPress={() => navigate("/map")} onAddPress={() => navigate("/offer")} /> : <Navigate to="/login" replace />} />
          <Route path="/offer/:id" element={user ? <OfferDetailScreen {...authProps} /> : <Navigate to="/login" replace />} />
          <Route path="/discover" element={user ? <DiscoverScreen {...authProps} /> : <Navigate to="/login" replace />} />
          <Route path="/communities" element={user ? <CommunityScreen {...authProps} /> : <Navigate to="/login" replace />} />
          <Route path="/store/:id" element={user ? <StoreDetailScreen {...authProps} /> : <Navigate to="/login" replace />} />
          
          <Route path="*" element={user ? <Navigate to="/home" replace /> : <Navigate to="/" replace />} />
        </Routes>

        {user && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t h-14 flex items-center justify-around z-50">
            <button onClick={() => navigate("/home")}><FaBook /></button>
            <button onClick={() => navigate("/stores")}><FaStore /></button>
            <button onClick={() => navigate("/offer")} className="w-10 h-10 bg-[#382110] text-white rounded-full"><FaPlus /></button>
            <button onClick={() => navigate("/map")}><FaMapMarkerAlt /></button>
            <button onClick={() => navigate("/profile")}><FaUserCircle /></button>
          </div>
        )}
      </div>
    </NotificationProvider>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}