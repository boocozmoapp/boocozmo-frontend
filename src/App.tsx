/* eslint-disable @typescript-eslint/no-explicit-any */
// src/App.tsx - FINAL WORKING VERSION WITH COMMUNITIES + FIXED REDIRECT + CLEANED NAV
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaUserCircle, FaEnvelope, FaSignOutAlt, FaTimes, FaMapMarkerAlt, FaBook, FaPlus, FaStore, FaLayerGroup, FaUsers } from "react-icons/fa";
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

// Helper for Nav Items
const NavItem = ({ icon, label, path, active, navigate }: any) => (
  <button 
    onClick={() => navigate(path)} 
    className={`flex flex-col items-center justify-center w-14 gap-1 ${active ? 'text-[#382110]' : 'text-[#999]'} transition-colors active:scale-95`}
  >
    {icon}
    <span className="text-[10px] font-medium tracking-tight">{label}</span>
  </button>
);

const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const AppContent = () => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuth = (u: any) => {
    console.log("🔄 App.tsx: handleAuth called with:", u.email);
    const fullUser = { ...u, id: u.id.toString() };
    localStorage.setItem("user", JSON.stringify(fullUser));
    setUser(fullUser);
  };

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [activeNotification, setActiveNotification] = useState<{ id: string, title: string, owner: string, distance?: string, type: 'wishlist' | 'nearby' } | null>(null);
  const [seenOffers, setSeenOffers] = useState<Set<number>>(new Set());

  // Goodreads Header - Communities text only (no icon)
  const GoodreadsHeader = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
      <header className="bg-[#f4f1ea] border-b border-[#d8d8d8] px-4 h-[50px] md:h-[60px] flex items-center sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1
              onClick={() => navigate("/home")}
              className="text-2xl font-serif font-bold text-[#382110] tracking-tighter cursor-pointer hover:no-underline"
            >
              Boocozmo
            </h1>

            <nav className="hidden md:flex items-center gap-1 text-[#382110] text-[14px]">
              <button onClick={() => navigate("/home")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm">Home</button>
              <button onClick={() => navigate("/communities")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm">Communities</button>
              <button onClick={() => navigate("/my-library")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm">My Books</button>
              <button onClick={() => navigate("/stores")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm">Stores</button>
              <button onClick={() => navigate("/offer")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm">Offers</button>
              <button onClick={() => navigate("/map")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm">Map</button>
            </nav>
          </div>

          <div className="hidden md:flex flex-1 max-w-[350px] mx-4">
            <div className="relative w-full" onClick={() => navigate("/discover")}>
              <input
                type="text"
                readOnly
                placeholder="Search books, authors, regions..."
                className="w-full bg-white border border-[#d8d8d8] rounded-[3px] py-1.5 px-3 text-sm focus:outline-none focus:border-[#00635d] cursor-pointer shadow-inner"
              />
              <button className="absolute right-0 top-0 bottom-0 px-3 text-[#555] hover:bg-[#eee] transition-colors rounded-r-[3px]">
                <FaSearch />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4 text-[#382110]">
            <button className="md:hidden" onClick={() => navigate("/my-library")}><FaLayerGroup size={18} /></button>
            <button className="md:hidden" onClick={() => navigate("/communities")}><FaUsers size={18} /></button>

            <div className="flex items-center gap-3 border-r border-[#ccc] pr-4 mr-1">
              <button onClick={() => navigate("/chat")} className="text-[#382110] hover:text-white hover:bg-[#382110] p-1.5 rounded-full transition-colors relative">
                <FaEnvelope size={16} />
              </button>
              <NotificationBell />
            </div>

            <div className="relative">
              <div 
                className="w-8 h-8 rounded-full bg-[#e9e9e9] border border-[#ccc] flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {user?.name ? <span className="font-bold text-xs text-[#555]">{user.name.charAt(0)}</span> : <FaUserCircle className="text-[#999]" />}
              </div>

              {isMenuOpen && (
                <div className="absolute right-0 top-10 w-48 bg-white border border-[#d8d8d8] shadow-lg rounded-[3px] py-1 z-50">
                  <div className="px-4 py-2 border-b border-[#eee] text-sm text-[#382110] font-bold truncate">
                    {user?.name}
                  </div>
                  <button onClick={() => {navigate("/profile"); setIsMenuOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-[#382110] hover:bg-[#f4f1ea]">Profile</button>
                  <button onClick={() => {navigate("/my-library"); setIsMenuOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-[#382110] hover:bg-[#f4f1ea]">My Books</button>
                  <button onClick={() => {navigate("/communities"); setIsMenuOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-[#382110] hover:bg-[#f4f1ea]">Communities</button>
                  <button onClick={() => {onLogout(); setIsMenuOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-[#382110] hover:bg-[#f4f1ea] flex items-center gap-2">
                    Sign out <FaSignOutAlt size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  };

  const MobileBottomNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e5e5] h-[60px] flex items-center justify-around z-50 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] pb-safe">
      <NavItem icon={<FaBook size={18} />} label="Home" path="/home" active={location.pathname === "/home" || location.pathname === "/"} navigate={navigate} />
      <NavItem icon={<FaStore size={18} />} label="Stores" path="/stores" active={location.pathname === "/stores"} navigate={navigate} />
      <div className="relative -top-5">
        <button 
          onClick={() => navigate("/offer")}
          className="w-12 h-12 rounded-full bg-[#382110] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform border-4 border-[#f4f1ea]"
        >
          <FaPlus size={20} />
        </button>
      </div>
      <NavItem icon={<FaMapMarkerAlt size={18} />} label="Map" path="/map" active={location.pathname === "/map"} navigate={navigate} />
      <NavItem icon={<FaUserCircle size={18} />} label="Profile" path="/profile" active={location.pathname === "/profile"} navigate={navigate} />
    </div>
  );

  useEffect(() => {
    console.log("🔍 App.tsx: Checking localStorage for user...");
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && u.token) {
          console.log("✅ App.tsx: User found in localStorage:", u.email);
          setUser(u);
        }
      } catch (e) {
        console.error("App.tsx: Error parsing user:", e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && u.token && !user) {
          console.log("🔄 Found user on route change, updating state");
          setUser(u);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [location.pathname, user]);

  useEffect(() => {
    if (user && (location.pathname === "/login" || location.pathname === "/signup")) {
      navigate("/home", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (!user) return;

    const checkNewOffers = async () => {
      try {
        const resp = await fetch(`https://boocozmo-api.onrender.com/offers?limit=100`, {
          headers: { "Authorization": `Bearer ${user.token}` }
        });
        const data = await resp.json();
        const offers = Array.isArray(data) ? data : (data.offers || []);

        const pResp = await fetch(`https://boocozmo-api.onrender.com/profile/${user.email}`, {
          headers: { "Authorization": `Bearer ${user.token}` }
        });
        const pData = await pResp.json();
        const userLat = pData.latitude;
        const userLon = pData.longitude;

        for (const offer of offers) {
          if (offer.ownerEmail === user.email) continue;
          if (seenOffers.has(offer.id)) continue;

          const isWishMatch = wishlist.some(w => offer.bookTitle.toLowerCase().includes(w.toLowerCase()));
          let isSuperNear = false;
          let distText = "";

          if (userLat && userLon && offer.latitude && offer.longitude) {
            const dist = getDist(userLat, userLon, offer.latitude, offer.longitude);
            if (dist < 2) {
              isSuperNear = true;
              distText = dist < 0.5 ? "Just around the corner!" : `${dist.toFixed(1)}km away`;
            }
          }

          if (isWishMatch || isSuperNear) {
            setActiveNotification({
              id: offer.id,
              title: offer.bookTitle,
              owner: offer.ownerName || "A neighbor",
              distance: distText,
              type: isWishMatch ? 'wishlist' : 'nearby'
            });
            setSeenOffers(prev => new Set(prev).add(offer.id));
            break;
          }
        }
      } catch (err) { console.error("Viral Engine Error", err); }
    };

    const interval = setInterval(checkNewOffers, 45000);
    checkNewOffers();
    return () => clearInterval(interval);
  }, [user, wishlist, seenOffers]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const toggleWishlist = (title: string) => {
    setWishlist(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
  };

  if (loading) return <div className="h-screen bg-[#f4f1ea] flex items-center justify-center">Loading...</div>;

  const authProps = {
    currentUser: user!,
    wishlist,
    toggleWishlist
  };

  return (
    <NotificationProvider currentUser={user}>
      <div className="min-h-screen bg-white font-sans text-[#333]">
        {user && <GoodreadsHeader user={user} onLogout={handleLogout} />}
        {user && <MobileBottomNav />}

        <AnimatePresence>
          {activeNotification && user && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="fixed bottom-6 right-6 z-[9999] w-80 bg-[#382110] text-white p-4 rounded-xl shadow-2xl border-l-4 border-[#d37e2f] cursor-pointer"
              onClick={() => {
                navigate(`/offer/${activeNotification.id}`);
                setActiveNotification(null);
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="bg-[#d37e2f] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                  {activeNotification.type === 'wishlist' ? '✨ Wishlist Match' : '📍 Super Nearby'}
                </span>
                <button onClick={(e) => { e.stopPropagation(); setActiveNotification(null); }} className="text-white/50 hover:text-white">
                  <FaTimes size={14}/>
                </button>
              </div>
              <h4 className="font-serif font-bold text-sm leading-tight">{activeNotification.title}</h4>
              <p className="text-[11px] text-white/70 mt-1">
                {activeNotification.type === 'wishlist'
                  ? `Someone just posted a book from your wishlist!`
                  : `Someone just posted a gem only ${activeNotification.distance}!`}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                  {activeNotification.owner.charAt(0)}
                </div>
                <span className="text-[10px] font-medium italic opacity-80">Posted by {activeNotification.owner}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-[#f4f1ea]">
          <div className="max-w-[1100px] mx-auto bg-white shadow-[0_0_10px_rgba(0,0,0,0.02)] border-x border-[#ebebeb] min-h-[calc(100vh-110px)] md:min-h-[calc(100vh-60px)]">
            <Routes>
              <Route path="/auth/callback" element={<AuthCallback onLoginSuccess={handleAuth} />} />
              <Route path="/login" element={<LoginScreen onLoginSuccess={handleAuth} onGoToSignup={() => navigate("/signup")} />} />
              <Route path="/signup" element={<SignupScreen onSignupSuccess={handleAuth} onGoToLogin={() => navigate("/login")} />} />

              {!user ? (
                <>
                  <Route path="/" element={<WelcomeScreen />} />
                  <Route path="*" element={<WelcomeScreen />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<HomeScreen {...authProps} />} />
                  <Route path="/home" element={<HomeScreen {...authProps} />} />
                  <Route path="/communities" element={<CommunityScreen {...authProps} />} />
                  <Route path="/offer" element={<OfferScreen {...authProps} onBack={() => navigate("/home")} onProfilePress={() => navigate("/profile")} onMapPress={() => navigate("/map")} onAddPress={() => navigate("/offer")} />} />
                  <Route path="/offer/:id" element={<OfferDetailScreen {...authProps} />} />
                  <Route path="/profile" element={<ProfileScreen {...authProps} />} />
                  <Route path="/map" element={<MapScreen {...authProps} />} />
                  <Route path="/chat" element={<ChatScreen {...authProps} />} />
                  <Route path="/chat/:chatId" element={<SingleChat {...authProps} />} />
                  <Route path="/discover" element={<DiscoverScreen {...authProps} />} />
                  <Route path="/my-library" element={<MyLibraryScreen {...authProps} onBack={() => navigate("/home")} onAddPress={() => navigate("/offer")} onProfilePress={() => navigate("/profile")} onMapPress={() => navigate("/map")} />} />
                  <Route path="/store/:id" element={<StoreDetailScreen {...authProps} />} />
                  <Route path="/stores" element={<StoresScreen {...authProps} />} />
                  <Route path="*" element={<HomeScreen {...authProps} />} />
                </>
              )}
            </Routes>
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;