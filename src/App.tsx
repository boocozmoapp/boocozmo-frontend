/* eslint-disable @typescript-eslint/no-explicit-any */
// src/App.tsx - GOODREADS EXACT REPLICA
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { FaSearch, FaUserCircle, FaCaretDown, FaBell, FaEnvelope, FaBookOpen, FaHome, FaSignOutAlt } from "react-icons/fa";
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
import WelcomeScreen from "./pages/WelcomeScreen";
import "leaflet/dist/leaflet.css";

type User = {
  email: string;
  name: string;
  id: string;
  token: string;
} | null;

// Goodreads Header
function GoodreadsHeader({ user, onLogout }: { user: User; onLogout: () => void }) {
  const navigate = useNavigate();
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

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 text-[#382110] text-[14px]">
              <button onClick={() => navigate("/home")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm">Home</button>
              <button onClick={() => navigate("/my-library")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm">My Books</button>
              <button onClick={() => navigate("/offer")} className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm">Offers</button>
              <div className="relative group">
                 <button className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm flex items-center gap-1">
                   Browse <FaCaretDown size={10} className="text-[#999]" />
                 </button>
                 <div className="absolute top-full left-0 w-40 bg-white border border-[#d8d8d8] shadow-lg rounded-[3px] py-1 hidden group-hover:block z-50">
                     <button onClick={() => navigate("/map")} className="w-full text-left px-4 py-2 hover:bg-[#f4f1ea]">Map View</button>
                     <button onClick={() => navigate("/offer")} className="w-full text-left px-4 py-2 hover:bg-[#f4f1ea]">Post Offer</button>
                     <div className="border-t border-[#eee] my-1"></div>
                     <span className="block px-4 py-1 text-[10px] uppercase text-[#999] font-bold">Genres</span>
                     <button onClick={() => navigate("/home")} className="w-full text-left px-4 py-2 hover:bg-[#f4f1ea]">Fiction</button>
                     <button onClick={() => navigate("/home")} className="w-full text-left px-4 py-2 hover:bg-[#f4f1ea]">Non-Fiction</button>
                 </div>
              </div>
              <div className="relative group">
                 <button className="px-3 py-2 font-sans hover:bg-white/50 rounded-sm flex items-center gap-1">
                   Community <FaCaretDown size={10} className="text-[#999]" />
                 </button>
                 <div className="absolute top-full left-0 w-40 bg-white border border-[#d8d8d8] shadow-lg rounded-[3px] py-1 hidden group-hover:block z-50">
                     <button onClick={() => navigate("/community")} className="w-full text-left px-4 py-2 hover:bg-[#f4f1ea]">Discussions</button>
                     <button onClick={() => navigate("/chat")} className="w-full text-left px-4 py-2 hover:bg-[#f4f1ea]">Messages</button>
                 </div>
              </div>
            </nav>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-[350px] mx-4">
             <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="Search books"
                  className="w-full bg-white border border-[#d8d8d8] rounded-[3px] py-1.5 px-3 text-sm focus:outline-none focus:border-[#00635d] focus:ring-1 focus:ring-[#00635d] shadow-inner"
                />
                <button className="absolute right-0 top-0 bottom-0 px-3 text-[#555] hover:bg-[#eee] transition-colors rounded-r-[3px]">
                  <FaSearch />
                </button>
             </div>
          </div>

          {/* Icons / Profile */}
          <div className="flex items-center gap-3 md:gap-4 text-[#382110]">
             <button className="md:hidden"><FaSearch size={18} /></button>
             
             {/* Icons - Visible on Mobile too */}
             <div className="flex items-center gap-3 border-r border-[#ccc] pr-4 mr-1">
               <button onClick={() => navigate("/chat")} className="text-[#382110] hover:text-white hover:bg-[#382110] p-1.5 rounded-full transition-colors relative">
                 <FaEnvelope size={16} />
               </button>
               <button className="text-[#382110] hover:text-white hover:bg-[#382110] p-1.5 rounded-full transition-colors">
                 <FaBell size={16} />
               </button>
             </div>

             <div className="relative" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <div className="w-8 h-8 rounded-full bg-[#e9e9e9] border border-[#ccc] flex items-center justify-center cursor-pointer overflow-hidden">
                   {user?.name ? <span className="font-bold text-xs text-[#555]">{user.name.charAt(0)}</span> : <FaUserCircle className="text-[#999]" />}
                </div>
                
                {/* Profile Dropdown */}
                {isMenuOpen && (
                   <div className="absolute right-0 top-10 w-48 bg-white border border-[#d8d8d8] shadow-lg rounded-[3px] py-1 z-50">
                      <div className="px-4 py-2 border-b border-[#eee] text-sm text-[#382110] font-bold truncate">
                        {user?.name}
                      </div>
                      <button onClick={() => navigate("/profile")} className="w-full text-left px-4 py-2 text-sm text-[#382110] hover:underline hover:bg-[#f4f1ea]">Profile</button>
                      <button onClick={() => navigate("/my-library")} className="w-full text-left px-4 py-2 text-sm text-[#382110] hover:underline hover:bg-[#f4f1ea]">My Books</button>
                      <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-[#382110] hover:underline hover:bg-[#f4f1ea] flex items-center gap-2">
                        Sign out <FaSignOutAlt size={12} />
                      </button>
                   </div>
                )}
             </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Subheader (Like Screenshot) */}
      <div className="md:hidden bg-white border-b border-[#eee] py-2 px-4 shadow-sm flex justify-between text-[13px] font-sans font-medium text-[#382110] overflow-x-auto whitespace-nowrap">
         <span onClick={() => navigate("/my-library")} className="cursor-pointer">My Books</span>
         <span onClick={() => navigate("/offer")} className="cursor-pointer border-l border-[#eee] pl-4">Offers</span>
         <span onClick={() => navigate("/map")} className="cursor-pointer border-l border-[#eee] pl-4">Browse</span>
         <span onClick={() => navigate("/community")} className="cursor-pointer border-l border-[#eee] pl-4">Community</span>
      </div>
    </>
  );
}

function AppContent() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && u.token) setUser(u);
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  }, []);

  const handleAuth = (u: any) => {
    const fullUser = { ...u, id: u.id.toString() };
    localStorage.setItem("user", JSON.stringify(fullUser));
    setUser(fullUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  if (loading) return <div className="h-screen bg-[#f4f1ea] flex items-center justify-center">Loading...</div>;

  const authProps = { currentUser: user! };

  if (!user) {
     return (
        <Routes>
           <Route path="/" element={<WelcomeScreen />} />
           <Route path="/login" element={<LoginScreen onLoginSuccess={handleAuth} onGoToSignup={() => navigate("/signup")} />} />
           <Route path="/signup" element={<SignupScreen onSignupSuccess={handleAuth} onGoToLogin={() => navigate("/login")} />} />
           <Route path="*" element={<WelcomeScreen />} />
        </Routes>
     );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-[#333]">
      <GoodreadsHeader user={user} onLogout={handleLogout} />
      <div className="bg-[#f4f1ea] pb-10"> {/* Global Background */}
         <div className="max-w-[1100px] mx-auto bg-white min-h-[calc(100vh-120px)] shadow-[0_0_10px_rgba(0,0,0,0.02)] border-x border-[#ebebeb]">
            <Routes>
              <Route path="/" element={<HomeScreen {...authProps} />} /> {/* Redirect to home effectively */}
              <Route path="/home" element={<HomeScreen {...authProps} />} />
              <Route path="/offer" element={<OfferScreen {...authProps} onBack={() => navigate("/home")} onProfilePress={() => navigate("/profile")} onMapPress={() => navigate("/map")} onAddPress={() => navigate("/offer")} />} />
              <Route path="/offer/:id" element={<OfferDetailScreen {...authProps} />} />
              <Route path="/profile" element={<ProfileScreen {...authProps} />} />
              <Route path="/map" element={<MapScreen {...authProps} />} />
              <Route path="/chat" element={<ChatScreen {...authProps} />} />
              <Route path="/chat/:chatId" element={<SingleChat {...authProps} />} />
              <Route path="/my-library" element={<MyLibraryScreen {...authProps} onBack={() => navigate("/home")} onAddPress={() => navigate("/offer")} onProfilePress={() => navigate("/profile")} onMapPress={() => navigate("/map")} />} />
              <Route path="/community" element={<CommunityScreen />} />
              <Route path="*" element={<HomeScreen {...authProps} />} />
            </Routes>
         </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}