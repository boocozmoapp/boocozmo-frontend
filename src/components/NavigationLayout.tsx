// src/components/NavigationLayout.tsx - "Coolblue Style" Stack Navigation
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaBars, FaArrowLeft, FaHome, FaMapMarkedAlt, 
  FaStore, FaUserCircle, FaBook, FaSearch, 
  FaTimes, FaChevronRight, FaSignOutAlt, FaCog, FaEnvelope, FaTachometerAlt
} from "react-icons/fa";
import NotificationBell from "./NotificationBell";

// Map routes to human readable titles/parents
const ROUTE_MAP: Record<string, { title: string; parent?: string }> = {
  "/": { title: "Home" },
  "/home": { title: "Home" },
  "/map": { title: "Map Explorer", parent: "/home" },
  "/stores": { title: "Bookstores", parent: "/home" },
  "/chat": { title: "Messages", parent: "/home" },
  "/profile": { title: "My Profile", parent: "/home" },
  "/my-library": { title: "My Library", parent: "/profile" },
  "/discover": { title: "Discover", parent: "/home" },
  "/offer": { title: "Add Book", parent: "/my-library" },
  "/communities": { title: "Communities", parent: "/discover" },
};

const MAIN_MENU = [
  { label: "Home", path: "/home", icon: <FaHome size={18} /> },
  { label: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt size={18} /> },
  { label: "Discover", path: "/discover", icon: <FaSearch size={18} /> },
  { label: "Bookstores", path: "/stores", icon: <FaStore size={18} /> },
  { label: "Map Explorer", path: "/map", icon: <FaMapMarkedAlt size={18} /> },
  { label: "My Library", path: "/my-library", icon: <FaBook size={18} /> },
  { label: "Messages", path: "/chat", icon: <FaEnvelope size={18} /> },
  { label: "Profile", path: "/profile", icon: <FaUserCircle size={18} /> },
];

export default function NavigationLayout({ children, user, onLogout }: any) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current page title and "Stack" status
  const currentPath = location.pathname;
  let pageInfo = ROUTE_MAP[currentPath];
  
  // Handle dynamic routes (simple heuristic)
  if (!pageInfo) {
    if (currentPath.startsWith("/chat/")) pageInfo = { title: "Conversation", parent: "/chat" };
    else if (currentPath.startsWith("/store/")) pageInfo = { title: "Store Details", parent: "/stores" };
    else if (currentPath.startsWith("/offer/")) pageInfo = { title: "Book Details", parent: "/home" };
    else pageInfo = { title: "Boocozmo" };
  }

  const isRoot = currentPath === "/" || currentPath === "/home";
  const parentPath = pageInfo.parent || "/home";

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f8f6f3] text-[#333] flex flex-col">
      
      {/* === SMART STACK HEADER === */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#e0e0e0] h-14 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4 flex-1 overflow-hidden">
          
          {/* Left Action: Drawer Menu OR Back Button */}
          {isRoot ? (
            <button 
              onClick={() => setDrawerOpen(true)}
              className="p-2 -ml-2 text-[#382110] hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaBars size={20} />
            </button>
          ) : (
            <button 
              onClick={() => navigate(parentPath)}
              className="p-2 -ml-2 text-[#382110] hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1 group"
            >
              <FaArrowLeft size={18} />
              {/* Optional: Show label of where we're going back to on Desktop */}
              <span className="text-xs font-medium text-[#777] group-hover:text-[#382110] hidden md:block">
                 Back
              </span>
            </button>
          )}

          {/* Breadcrumb / Title Stack */}
          <div className="flex flex-col flex-1 min-w-0">
             {!isRoot && (
               <div className="flex items-center gap-1 text-[10px] text-[#999] font-medium uppercase tracking-wider truncate">
                  <span className="cursor-pointer hover:text-[#382110]" onClick={() => navigate("/home")}>Home</span>
                  {pageInfo.parent && (
                     <>
                       <FaChevronRight size={8} />
                       <span className="truncate cursor-pointer hover:text-[#382110]" onClick={() => navigate(pageInfo.parent!)}>
                         {ROUTE_MAP[pageInfo.parent]?.title || "Back"}
                       </span>
                     </>
                  )}
               </div>
             )}
             <h1 className={`font-serif font-bold text-[#382110] truncate ${isRoot ? 'text-xl' : 'text-base'}`}>
               {pageInfo.title}
             </h1>
          </div>

        </div>

        {/* Right Actions: Notifications & Profile */}
        <div className="flex items-center gap-2 md:gap-4 pl-2">
           <NotificationBell />
           {user && (
             <div onClick={() => navigate("/profile")} className="w-8 h-8 rounded-full bg-[#382110] text-white flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-[#5a3e2b] border-2 border-white shadow-sm">
                {user.name.charAt(0)}
             </div>
           )}
        </div>
      </header>
      
      {/* Content Area - Now Full Screen (No Bottom Bar) */}
      <main className="flex-1 relative">
         {children}
      </main>

      {/* === SIDE DRAWER MENU (Global Nav) === */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
               onClick={() => setDrawerOpen(false)}
            />
            
            {/* Drawer Panel */}
            <motion.div 
               initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
               className="fixed top-0 bottom-0 left-0 w-[80%] max-w-[300px] bg-white z-[70] shadow-2xl flex flex-col"
            >
               {/* Drawer Header */}
               <div className="p-6 bg-[#382110] text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  
                  <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 text-white/60 hover:text-white">
                     <FaTimes size={20} />
                  </button>

                  <div className="mt-4 flex items-center gap-4 relative z-10">
                     <div className="w-14 h-14 rounded-full bg-white text-[#382110] flex items-center justify-center text-xl font-bold border-2 border-[#d4af37]">
                        {user?.name.charAt(0)}
                     </div>
                     <div>
                        <h2 className="font-bold text-lg leading-tight">{user?.name}</h2>
                        <p className="text-white/60 text-xs truncate max-w-[150px]">{user?.email}</p>
                     </div>
                  </div>
               </div>

               {/* Drawer Links */}
               <div className="flex-1 overflow-y-auto py-4 px-2">
                  <nav className="space-y-1">
                     {MAIN_MENU.map(item => (
                        <button 
                           key={item.path} 
                           onClick={() => navigate(item.path)}
                           className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-[#f4f1ea] text-[#382110] font-bold' : 'text-[#555] hover:bg-gray-50'}`}
                        >
                           <span className={location.pathname === item.path ? "text-[#382110]" : "text-[#999]"}>{item.icon}</span>
                           <span>{item.label}</span>
                           {location.pathname === item.path && <FaChevronRight className="ml-auto text-xs text-[#382110]" />}
                        </button>
                     ))}
                  </nav>
               </div>

               {/* Drawer Footer */}
               <div className="p-4 border-t border-[#eee] bg-[#f9f9f9]">
                  <button onClick={() => navigate("/settings")} className="w-full flex items-center gap-4 px-4 py-3 text-[#555] hover:bg-gray-100 rounded-xl transition-colors mb-1">
                     <FaCog size={18} className="text-[#999]" /> Settings
                  </button>
                  <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3 text-[#d32f2f] hover:bg-red-50 rounded-xl transition-colors font-medium">
                     <FaSignOutAlt size={18} /> Log Out
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
