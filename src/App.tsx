/* eslint-disable @typescript-eslint/no-explicit-any */
// src/App.tsx - UPDATED with Navigation Stack Layout
import React, { useState, useCallback, useMemo } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
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
import NotFoundScreen from "./pages/NotFoundScreen";
import NavigationLayout from "./components/NavigationLayout";
import { NotificationProvider } from "./context/NotificationContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";
import "leaflet/dist/leaflet.css";

type User = {
  email: string;
  name: string;
  id: string;
  token: string;
} | null;

const AppContent = () => {
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

  const handleAuth = useCallback((u: any) => {
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
      <div className="min-h-screen bg-[#f8f6f3]">
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback onLoginSuccess={handleAuth} />} />
          <Route path="/login" element={<LoginScreen onLoginSuccess={handleAuth} onGoToSignup={() => navigate("/signup")} />} />
          <Route path="/signup" element={<SignupScreen onSignupSuccess={handleAuth} onGoToLogin={() => navigate("/login")} />} />

          {!user ? (
            <>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <Route path="*" element={
              <NavigationLayout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<HomeScreen {...authProps} />} />
                  <Route path="/home" element={<HomeScreen {...authProps} />} />
                  <Route path="/dashboard" element={<WelcomeScreen />} />
                  <Route path="/profile" element={<ProfileScreen {...authProps} onLogout={handleLogout} />} />
                  <Route path="/map" element={<MapScreen {...authProps} />} />
                  <Route path="/chat" element={<ChatScreen {...authProps} />} />
                  <Route path="/chat/:chatId" element={<SingleChat {...authProps} />} />
                  <Route path="/my-library" element={<MyLibraryScreen {...authProps} onBack={() => navigate("/home")} onAddPress={() => navigate("/offer")} onProfilePress={() => navigate("/profile")} onMapPress={() => navigate("/map")} />} />
                  <Route path="/stores" element={<StoresScreen {...authProps} />} />
                  <Route path="/offer" element={<OfferScreen {...authProps} onBack={() => navigate("/home")} onProfilePress={() => navigate("/profile")} onMapPress={() => navigate("/map")} onAddPress={() => navigate("/offer")} />} />
                  <Route path="/offer/:id" element={<OfferDetailScreen {...authProps} />} />
                  <Route path="/discover" element={<DiscoverScreen {...authProps} />} />
                  <Route path="/communities" element={<CommunityScreen {...authProps} />} />
                  <Route path="/store/:id" element={<StoreDetailScreen {...authProps} />} />
                  <Route path="*" element={<NotFoundScreen />} />
                </Routes>
              </NavigationLayout>
            } />
          )}
        </Routes>
      </div>
    </NotificationProvider>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}