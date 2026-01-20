/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/WelcomeScreen.tsx - UPDATED: Dashboard with Local Activity & Real Stats
import { useState, useEffect } from "react";
import { 
  FaSearch, FaBook, FaMapMarkedAlt, FaComments, FaStore, 
  FaUser, FaChartLine, FaBoxOpen, FaStar, FaSignInAlt, FaUserPlus, 
  FaMapMarkerAlt
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

// Helper: Haversine Distance
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function WelcomeScreen({ currentUser }: { currentUser?: any }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(currentUser || null);
  const [stats, setStats] = useState<any>({ offers: 0, messages: 0, reputation: 5.0 });
  const [localActivity, setLocalActivity] = useState<number | null>(null);

  // Initialize User
  useEffect(() => {
    if (currentUser) {
        setUser(currentUser);
    } else {
        try {
            const saved = localStorage.getItem("user") || sessionStorage.getItem("user");
            if (saved) {
                const u = JSON.parse(saved);
                if (u && u.token) setUser(u);
            }
        } catch(e) { /* ignore */ }
    }
  }, [currentUser]);

  // Fetch Real Stats & Local Activity
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
        try {
            // 1. Fetch User Profile for Location
            let userLat = 40.7128; // Default NYC
            let userLng = -74.0060;
            const profileRes = await fetch(`${API_BASE}/profile/${user.email}`, {
                 headers: { "Authorization": `Bearer ${user.token}` }
            });
            if (profileRes.ok) {
                const pData = await profileRes.json();
                if (pData.latitude && pData.longitude) {
                    userLat = parseFloat(pData.latitude);
                    userLng = parseFloat(pData.longitude);
                }
            }

            // 2. Fetch All Offers (to count user's offers AND calculate local activity)
            const offersRes = await fetch(`${API_BASE}/offers?limit=500`, {
                headers: { "Authorization": `Bearer ${user.token}` }
            });
            
            if (offersRes.ok) {
                const data = await offersRes.json();
                const allOffers = data.offers || [];

                // A. Count User's Active Offers
                const myOffers = allOffers.filter((o: any) => o.owneremail === user.email);
                setStats((s: any) => ({ ...s, offers: myOffers.length }));

                // Smart Location Inference: If using default NYC coords, try to use user's latest book location
                // 40.7128, -74.0060 are the defaults set above
                if (Math.abs(userLat - 40.7128) < 0.0001 && Math.abs(userLng - (-74.0060)) < 0.0001 && myOffers.length > 0) {
                    const lastOffer = myOffers[0]; // Assuming most recent
                    if (lastOffer.latitude && lastOffer.longitude) {
                        userLat = parseFloat(lastOffer.latitude);
                        userLng = parseFloat(lastOffer.longitude);
                    }
                }

                // B. Calculate Local Activity (Offers within 15km)
                let localCount = 0;
                allOffers.forEach((offer: any) => {
                    if (offer.latitude && offer.longitude) {
                         // Include user's own offers in the local vibrancy count
                        const dist = getDistanceKm(userLat, userLng, parseFloat(offer.latitude), parseFloat(offer.longitude));
                        if (dist <= 15) localCount++;
                    }
                });
                setLocalActivity(localCount);
            }

        } catch (e) {
            console.error("Dashboard fetch error:", e);
        }
    };

    fetchData();
  }, [user]);

  const handleNav = (path: string) => {
    if (!user && path !== '/login' && path !== '/signup') {
        navigate('/login');
    } else {
        navigate(path);
    }
  };

  const NavCard = ({ icon, title, desc, path, primary = false }: any) => (
    <div 
      onClick={() => handleNav(path)}
      className={`p-4 rounded-xl border border-[#d8d8d8] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md h-full flex flex-col justify-between
        ${primary ? 'bg-[#382110] text-white border-[#382110]' : 'bg-[#ebe9e4] text-[#333] hover:bg-[#e1ded8]'}
      `}
    >
      <div className="mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3 ${primary ? 'bg-white/10 text-white' : 'bg-[#dcdad5] text-[#382110]'}`}>
            {icon}
        </div>
        <h3 className="font-bold font-serif text-lg leading-tight">{title}</h3>
      </div>
      <p className={`text-xs ${primary ? 'text-white/70' : 'text-[#666]'}`}>{desc}</p>
    </div>
  );

  // Activity Status Logic
  const getActivityColor = (count: number) => {
      if (count >= 30) return "text-emerald-700 bg-emerald-50 border-emerald-200";
      if (count >= 10) return "text-amber-700 bg-amber-50 border-amber-200";
      return "text-red-700 bg-red-50 border-red-200";
  };
  
  const getActivityLabel = (count: number) => {
      if (count >= 30) return "High Activity";
      if (count >= 10) return "Moderate Activity";
      return "Low Activity";
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3] text-[#333] p-4 md:p-8 font-sans">
      
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-serif font-bold text-[#382110]">
                   {user ? `Welcome back, ${user.name}` : "Dashboard"}
               </h1>
               <p className="text-sm text-[#777] mt-1">
                   {user ? "Here is what's happening in your literary universe." : "Access the literary common network."}
               </p>
            </div>
            
            {!user && (
                <div className="flex gap-3">
                    <button onClick={() => navigate('/login')} className="px-5 py-2 rounded-lg bg-[#382110] text-white text-sm font-bold shadow-sm hover:bg-[#2a1a0c]">Login</button>
                    <button onClick={() => navigate('/signup')} className="px-5 py-2 rounded-lg bg-white border border-[#ccc] text-[#333] text-sm font-bold shadow-sm hover:bg-[#f0f0f0]">Sign Up</button>
                </div>
            )}
        </header>

        {/* LOGGED IN STATS + LOCAL ACTIVITY */}
        {user && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#e0e0e0] shadow-sm">
                    <div className="text-[#382110] text-xs font-bold uppercase tracking-wider mb-1">My Active Offers</div>
                    <div className="text-2xl font-serif font-bold flex items-center gap-2">
                        {stats.offers} <FaBoxOpen className="text-[#382110] opacity-20 text-lg" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#e0e0e0] shadow-sm">
                    <div className="text-[#377458] text-xs font-bold uppercase tracking-wider mb-1">Unread Msg</div>
                    <div className="text-2xl font-serif font-bold flex items-center gap-2">
                        {stats.messages} <FaComments className="text-[#377458] opacity-20 text-lg" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#e0e0e0] shadow-sm">
                    <div className="text-[#d4af37] text-xs font-bold uppercase tracking-wider mb-1">Reputation</div>
                    <div className="text-2xl font-serif font-bold flex items-center gap-2">
                        {stats.reputation} <FaStar className="text-[#d4af37] opacity-20 text-lg" />
                    </div>
                </div>
                
                {/* LOCAL ACTIVITY CARD */}
                {localActivity !== null && (
                    <div className={`p-4 rounded-xl border shadow-sm ${getActivityColor(localActivity)}`}>
                        <div className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FaMapMarkerAlt /> Local Activity
                        </div>
                        <div className="text-2xl font-serif font-bold">
                            {localActivity} <span className="text-sm font-sans font-normal opacity-80">books nearby</span>
                        </div>
                        <p className="text-[10px] mt-1 opacity-80 font-medium">
                            {getActivityLabel(localActivity)} in 15km
                        </p>
                    </div>
                )}
            </div>
        )}
        
        {/* Encourage Activity Message if Low */}
        {user && localActivity !== null && localActivity < 10 && (
             <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
                 <span>Your area (15km) has low literary activity. Be the spark that ignites the wildfire!</span>
                 <button onClick={() => navigate('/offer')} className="bg-white border border-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-100">Add Book</button>
             </div>
        )}

        {/* NAVIGATION GRID */}
        <section>
            <h2 className="text-sm font-bold text-[#555] uppercase tracking-wider mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NavCard 
                    title="Discover" 
                    desc="Find new books & hidden gems." 
                    icon={<FaSearch />} 
                    path="/discover" 
                    primary 
                />
                 <NavCard 
                    title="Maps" 
                    desc="Explore local book map." 
                    icon={<FaMapMarkedAlt />} 
                    path="/map" 
                />
                <NavCard 
                    title="Library" 
                    desc="Manage your book collection." 
                    icon={<FaBook />} 
                    path="/my-library" 
                />
                <NavCard 
                    title="Post Offer" 
                    desc="Sell or trade books." 
                    icon={<FaBoxOpen />} 
                    path="/offer" 
                    primary
                />
                <NavCard 
                    title="Stores" 
                    desc="Browse bookstore profiles." 
                    icon={<FaStore />} 
                    path="/stores" 
                />
                <NavCard 
                    title="Communities" 
                    desc="Join literary circles." 
                    icon={<FaUserPlus />} 
                    path="/communities" 
                />
                 <NavCard 
                    title="Messages" 
                    desc="Chat with traders." 
                    icon={<FaComments />} 
                    path="/chat" 
                />
                {!user ? (
                     <NavCard 
                        title="Join Now" 
                        desc="Create your account." 
                        icon={<FaUser />} 
                        path="/signup" 
                    />
                ) : (
                    <NavCard 
                        title="Profile" 
                        desc="Settings & preferences." 
                        icon={<FaUser />} 
                        path="/profile" 
                    />
                )}
                 <NavCard 
                    title="Stats" 
                    desc="View trends." 
                    icon={<FaChartLine />} 
                    path="/home" 
                />
            </div>
        </section>

      </div>
    </div>
  );
}
