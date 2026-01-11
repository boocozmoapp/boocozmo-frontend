/* eslint-disable @typescript-eslint/no-explicit-any */
// src/App.tsx - FINAL WORKING VERSION WITH COMMUNITIES
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaUserCircle, FaEnvelope, FaSignOutAlt, FaTimes, FaUsers } from "react-icons/fa";
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
import CommunityScreen from "./pages/CommunityScreen"; // NEW IMPORT
import { NotificationProvider } from "./context/NotificationContext";
import NotificationBell from "./components/NotificationBell";
import "leaflet/dist/leaflet.css";

type User = {
  email: string;
  name: string;
  id: string;
  token: string;
} | null;

function App() {
  // ✅ Define AppContent INSIDE App function
  const AppContent = () => {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // ✅ NOW THIS WORKS!
    const location = useLocation();

    const [wishlist, setWishlist] = useState<string[]>([]);
    const [activeNotification, setActiveNotification] = useState<{ id: string, title: string, owner: string, distance?: string, type: 'wishlist' | 'nearby' } | null>(null);
    const [seenOffers, setSeenOffers] = useState<Set<number>>(new Set());       

    // Goodreads Header Component - UPDATED WITH COMMUNITIES
    const GoodreadsHeader = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
      const [isMenuOpen, setIsMenuOpen] = useState(false);

      return (
        <>
          <header className="bg-[#f4f1ea] border-b border-[#d8d8d8] px-4 h-[50px] md:h-[60px] flex items-center sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between">

              <div className="flex items-center gap-6">
                <h1
                  onClick={() => navigate("/home")}
                  className="text-2xl font-serif font-bold text-[#382110] tracking-tighter cursor-pointer hover:no-underline"
                >
                  Boocozmo
                </h1>

                {/* Desktop Nav - ADDED COMMUNITIES */}
                <nav className="hidden md:flex items-center gap-1 text-[#382110] text-[14px]">
                  <button onClick={() => navigate("/home")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm">Home</button>
                  <button onClick={() => navigate("/communities")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm flex items-center gap-1">
                    <FaUsers size={12} /> Communities
                  </button>
                  <button onClick={() => navigate("/my-library")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm">My Books</button>
                  <button onClick={() => navigate("/stores")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm">Stores</button>
                  <button onClick={() => navigate("/offer")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm">Offers</button>
                  <button onClick={() => navigate("/map")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm">Map</button>
                </nav>
              </div>

              {/* Search Bar - Desktop */}
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

              {/* Icons / Profile */}
              <div className="flex items-center gap-3 md:gap-4 text-[#382110]">   
                 <button className="md:hidden" onClick={() => navigate("/discover")}><FaSearch size={18} /></button>

                 {/* Icons - Visible on Mobile too */}
                 <div className="flex items-center gap-3 border-r border-[#ccc] pr-4 mr-1">
                   <button onClick={() => navigate("/chat")} className="text-[#382110] hover:text-white hover:bg-[#382110] p-1.5 rounded-full transition-colors relative">
                     <FaEnvelope size={16} />
                   </button>
                   <NotificationBell />
                 </div>

                 <div className="relative" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <div className="w-8 h-8 rounded-full bg-[#e9e9e9] border border-[#ccc] flex items-center justify-center cursor-pointer overflow-hidden">    
                       {user?.name ? <span className="font-bold text-xs text-[#555]">{user.name.charAt(0)}</span> : <FaUserCircle className="text-[#999]" />}   
                    </div>

                    {/* Profile Dropdown - ADDED COMMUNITIES LINK */}
                    {isMenuOpen && (
                       <div className="absolute right-0 top-10 w-48 bg-white border border-[#d8d8d8] shadow-lg rounded-[3px] py-1 z-50">
                          <div className="px-4 py-2 border-b border-[#eee] text-sm text-[#382110] font-bold truncate">
                            {user?.name}
                          </div>
                          <button onClick={() => navigate("/profile")} className="w-full text-left px-4 py-2 text-sm text-[#382110] hover:underline hover:bg-[#f4f1ea]">Profile</button>
                          <button onClick={() => navigate("/my-library")} className="w-full text-left px-4 py-2 text-sm text-[#382110] hover:underline hover:bg-[#f4f1ea]">My Books</button>
                          <button onClick={() => navigate("/communities")} className="w-full text-left px-4 py-2 text-sm text-[#382110] hover:underline hover:bg-[#f4f1ea] flex items-center gap-2">
                            <FaUsers size={12} /> Communities
                          </button>
                          <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-[#382110] hover:underline hover:bg-[#f4f1ea] flex items-center gap-2">
                            Sign out <FaSignOutAlt size={12} />
                          </button>
                       </div>
                    )}
                 </div>
              </div>
            </div>
          </header>

          {/* Mobile Subheader - ADDED COMMUNITIES */}
          <div className="md:hidden bg-white border-b border-[#eee] py-2 px-4 shadow-sm flex justify-between text-[13px] font-sans font-medium text-[#382110] overflow-x-auto whitespace-nowrap">
             <span onClick={() => navigate("/home")} className="cursor-pointer">Home</span>
             <span onClick={() => navigate("/communities")} className="cursor-pointer border-l border-[#eee] pl-4 flex items-center gap-1">
               <FaUsers size={10} /> Communities
             </span>
             <span onClick={() => navigate("/my-library")} className="cursor-pointer border-l border-[#eee] pl-4">My Books</span>
             <span onClick={() => navigate("/stores")} className="cursor-pointer border-l border-[#eee] pl-4">Stores</span>
             <span onClick={() => navigate("/offer")} className="cursor-pointer border-l border-[#eee] pl-4">Offers</span>
             <span onClick={() => navigate("/map")} className="cursor-pointer border-l border-[#eee] pl-4">Map</span>
          </div>
        </>
      );
    };

    // Proximity Helper
    const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Check for user in localStorage
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

    // Check on route changes
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
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }, [wishlist]);

    // Viral Notification Engine (FOMO)
    useEffect(() => {
      if (!user) return;

      const checkNewOffers = async () => {
         try {
            const resp = await fetch(`https://boocozmo-api.onrender.com/offers?limit=100`, {
               headers: { "Authorization": `Bearer ${user.token}` }
            });
            const data = await resp.json();
            const offers = Array.isArray(data) ? data : (data.offers || []);    

            // Get user location for proximity check
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
                  if (dist < 2) { // Within 2km
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
                  break; // Show one at a time
               }
            }
         } catch (err) { console.error("Viral Engine Error", err); }
      };

      const interval = setInterval(checkNewOffers, 45000);
      checkNewOffers();
      return () => clearInterval(interval);
    }, [user, wishlist, seenOffers]);

    const handleAuth = (u: any) => {
      console.log("🔄 App.tsx: handleAuth called with:", u.email);
      const fullUser = { ...u, id: u.id.toString() };
      localStorage.setItem("user", JSON.stringify(fullUser));
      setUser(fullUser);
    };

    const handleLogout = () => {
      console.log("🚪 App.tsx: Logging out...");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      navigate("/login");
    };

    const toggleWishlist = (title: string) => {
       setWishlist(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
    };

    console.log("🎨 App.tsx rendering, user:", user ? user.email : "null", "path:", location.pathname);

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

          {/* FOMO Notification Toast */}
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
                  <button onClick={(e) => { e.stopPropagation(); setActiveNotification(null); }} className="text-white/50 hover:text-white"><FaTimes size={14}/></button>
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

          <div className="bg-[#f4f1ea] pb-10">
            <div className="max-w-[1100px] mx-auto bg-white min-h-[calc(100vh-120px)] shadow-[0_0_10px_rgba(0,0,0,0.02)] border-x border-[#ebebeb]">
              <Routes>
                {/* AUTH CALLBACK - ALWAYS FIRST */}
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* LOGIN/LOGOUT ROUTES - Always available */}
                <Route path="/login" element={<LoginScreen onLoginSuccess={handleAuth} onGoToSignup={() => navigate("/signup")} />} />
                <Route path="/signup" element={<SignupScreen onSignupSuccess={handleAuth} onGoToLogin={() => navigate("/login")} />} />
                
                {/* UNAUTHENTICATED ROUTES */}
                {!user ? (
                  <>
                    <Route path="/" element={<WelcomeScreen />} />
                    <Route path="*" element={<WelcomeScreen />} />
                  </>
                ) : (
                  <>
                    {/* AUTHENTICATED ROUTES */}
                    <Route path="/" element={<HomeScreen {...authProps} />} />
                    <Route path="/home" element={<HomeScreen {...authProps} />} />
                    <Route path="/communities" element={<CommunityScreen {...authProps} />} /> {/* NEW ROUTE */}
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

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;