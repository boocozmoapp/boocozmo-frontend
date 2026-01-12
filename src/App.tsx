/* eslint-disable @typescript-eslint/no-explicit-any */
// src/App.tsx - FIXED WITH COMMUNITY ICON IN MOBILE TOP NAV
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { 
  FaSearch, FaUserCircle, FaEnvelope, FaSignOutAlt, 
  FaMapMarkerAlt, FaBook, FaPlus, FaStore, FaLayerGroup, 
  FaUsers, FaUserFriends 
} from "react-icons/fa";
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

const NavItem = ({ icon, label, path, active, navigate }: any) => (
  <button 
    onClick={() => navigate(path)} 
    className={`flex flex-col items-center justify-center w-14 gap-1 ${active ? 'text-[#382110]' : 'text-[#999]'} transition-colors active:scale-95`}
  >
    {icon}
    <span className="text-[10px] font-medium tracking-tight">{label}</span>
  </button>
);

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
  const location = useLocation();

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
      <div className="min-h-screen bg-[#fdfaf5]">
        {user && (
          <header className="bg-[#f4f1ea] border-b border-[#d8d8d8] px-4 h-[50px] md:h-[60px] flex items-center sticky top-0 z-50 shadow-sm">
            <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between">
              <div className="flex items-center gap-6">
                <h1 onClick={() => navigate("/home")} className="text-2xl font-serif font-bold text-[#382110] cursor-pointer">Boocozmo</h1>
                <nav className="hidden md:flex items-center gap-1 text-[#382110] text-[14px]">
                  <button onClick={() => navigate("/home")} className="px-3 py-2 hover:bg-white/50 rounded">Home</button>
                  <button onClick={() => navigate("/communities")} className="px-3 py-2 hover:bg-white/50 rounded flex items-center gap-1">
                    <FaUserFriends size={12} />
                    Communities
                  </button>
                  <button onClick={() => navigate("/my-library")} className="px-3 py-2 hover:bg-white/50 rounded">My Books</button>
                  <button onClick={() => navigate("/stores")} className="px-3 py-2 hover:bg-white/50 rounded">Stores</button>
                </nav>
              </div>

              {/* Desktop Search Bar */}
              <div className="hidden md:flex flex-1 max-w-[300px] mx-4">
                <div className="relative w-full" onClick={() => navigate("/discover")}>
                  <input
                    type="text"
                    readOnly
                    placeholder="Search gems..."
                    className="w-full bg-white border border-[#d8d8d8] rounded-[3px] py-1.5 px-3 text-sm focus:outline-none cursor-pointer shadow-inner"
                  />
                  <button className="absolute right-0 top-0 bottom-0 px-3 text-[#555] hover:bg-[#eee] transition-colors rounded-r-[3px]">
                    <FaSearch size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-4">
                {/* Mobile Top Navigation Icons */}
                <button className="md:hidden text-[#382110] hover:text-[#5a3e2b]" onClick={() => navigate("/discover")}>
                  <FaSearch size={18} />
                </button>
                <button className="md:hidden text-[#382110] hover:text-[#5a3e2b]" onClick={() => navigate("/communities")}>
                  <FaUserFriends size={18} />
                </button>
                <button className="md:hidden text-[#382110] hover:text-[#5a3e2b]" onClick={() => navigate("/my-library")}>
                  <FaLayerGroup size={18} />
                </button>
                
                <div className="flex items-center gap-3 border-r border-[#ccc] pr-4 mr-1">
                  <button onClick={() => navigate("/chat")} className="text-[#382110] hover:bg-white/50 p-1.5 rounded-full transition-colors relative">
                    <FaEnvelope size={18} />
                  </button>
                  <NotificationBell />
                </div>

                <div 
                  className="w-8 h-8 rounded-full bg-[#382110] text-white flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-[#5a3e2b] transition-colors"
                  onClick={() => navigate("/profile")}
                >
                  {user.name.charAt(0)}
                </div>
                <button onClick={handleLogout} className="text-[#382110] opacity-60 hover:opacity-100 hidden md:block transition-opacity">
                  <FaSignOutAlt />
                </button>
              </div>
            </div>
          </header>
        )}

        <div className="max-w-[1100px] mx-auto min-h-[calc(100vh-110px)] md:min-h-[calc(100vh-60px)] bg-white shadow-sm border-x border-[#ebebeb]">
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
              <>
                <Route path="/" element={<HomeScreen {...authProps} />} />
                <Route path="/home" element={<HomeScreen {...authProps} />} />
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
                <Route path="*" element={<HomeScreen {...authProps} />} />
              </>
            )}
          </Routes>
        </div>

        {user && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t h-16 flex items-center justify-around z-50 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <NavItem icon={<FaBook size={18} />} label="Home" path="/home" active={location.pathname === "/home" || location.pathname === "/"} navigate={navigate} />
            <NavItem icon={<FaStore size={18} />} label="Stores" path="/stores" active={location.pathname === "/stores"} navigate={navigate} />
            
            <div className="relative -top-5">
              <button 
                onClick={() => navigate("/offer")} 
                className="w-12 h-12 bg-[#382110] text-white rounded-full flex items-center justify-center shadow-lg border-4 border-[#fdfaf5] active:scale-95 transition-transform hover:bg-[#5a3e2b]"
              >
                <FaPlus size={20} />
              </button>
            </div>

            <NavItem icon={<FaMapMarkerAlt size={18} />} label="Map" path="/map" active={location.pathname === "/map"} navigate={navigate} />
            <NavItem icon={<FaUserCircle size={18} />} label="Profile" path="/profile" active={location.pathname === "/profile"} navigate={navigate} />
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