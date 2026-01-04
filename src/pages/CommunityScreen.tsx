/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/CommunityScreen.tsx - PREMIUM THEME
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaComments,
  FaClock,
  FaFire,
  FaHeart,
  FaShareAlt,
  FaUsers,
  FaHashtag,
  FaSearch,
  FaCrown,
  FaHome,
  FaMapMarkedAlt,
  FaBookOpen,
  FaBookmark,
  FaCompass,
  FaBell,
  FaBars,
  FaArrowLeft
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

type ViewMode = "feed" | "salons";

export default function CommunityScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const [feedFilter, setFeedFilter] = useState<"latest" | "popular" | "following">("latest");
  const [salonFilter, setSalonFilter] = useState<"active" | "popular" | "new">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [joinedSalons, setJoinedSalons] = useState<number[]>([1]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const mockFeedPosts = [
    {
      id: 1,
      username: "bookworm_annie",
      displayName: "Annie Bookworm",
      timestamp: "Just now",
      content: "Do we need another Aligarh movement for literary enlightenment? What do you think about reviving the spirit of intellectual discourse through books? 📚",
      image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&fit=crop&q=80",
      likes: 42,
      comments: 18,
      shares: 7,
      isYou: true,
      tags: ["Philosophy", "History", "Discussion"],
      userColor: "#d97706",
    },
    {
      id: 2,
      username: "literary_explorer",
      displayName: "Samuel Reader",
      timestamp: "2 hours ago",
      content: "Just finished 'Sapiens' and it blew my mind! Anyone want to exchange thoughts on human evolution and storytelling? 🔥",
      image: null,
      likes: 89,
      comments: 34,
      shares: 12,
      isYou: false,
      tags: ["Non-fiction", "Science", "Book Review"],
      userColor: "#3b82f6",
    },
    {
      id: 3,
      username: "poetry_lover",
      displayName: "Maya Verse",
      timestamp: "5 hours ago",
      content: "Sharing my favorite poetry collection from Rumi. Which poet speaks to your soul the most? Let's create a community poetry anthology! ✨",
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&fit=crop&q=80",
      likes: 156,
      comments: 47,
      shares: 23,
      isYou: false,
      tags: ["Poetry", "Rumi", "Literature"],
      userColor: "#8b5cf6",
    },
  ];

  const mockSalons = [
    {
      id: 1,
      name: "House of Philosophy",
      description: "Deep discussions on philosophical concepts, from ancient thinkers to modern philosophers.",
      members: 156,
      comments: 342,
      created: "Created 2 weeks ago",
      popular: true,
      category: "Philosophy",
      color: "#d97706",
      icon: "🧠",
    },
    {
      id: 2,
      name: "Science Fiction & Fantasy",
      description: "Explore worlds beyond imagination with fellow sci-fi and fantasy enthusiasts.",
      members: 289,
      comments: 892,
      created: "Created 1 month ago",
      popular: true,
      category: "Fiction",
      color: "#3b82f6",
      icon: "🚀",
    },
    {
      id: 3,
      name: "Classic Literature Club",
      description: "Dive into timeless classics and discuss their relevance in modern society.",
      members: 198,
      comments: 456,
      created: "Created 3 days ago",
      popular: false,
      category: "Classics",
      color: "#10b981",
      icon: "📜",
    },
    {
      id: 4,
      name: "Poetry & Prose",
      description: "Share your favorite poems, analyze literary works, and discuss writing techniques.",
      members: 124,
      comments: 287,
      created: "Created 1 week ago",
      popular: false,
      category: "Poetry",
      color: "#8b5cf6",
      icon: "✍️",
    },
  ];

  const handleLikePost = (postId: number) => {
    if (likedPosts.includes(postId)) setLikedPosts(likedPosts.filter(id => id !== postId));
    else setLikedPosts([...likedPosts, postId]);
  };

  const handleJoinSalon = (salonId: number) => {
    if (joinedSalons.includes(salonId)) setJoinedSalons(joinedSalons.filter(id => id !== salonId));
    else setJoinedSalons([...joinedSalons, salonId]);
  };

  const filteredSalons = mockSalons.filter(salon =>
    salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    salon.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    salon.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaMapMarkedAlt, label: "Map", onClick: () => navigate("/map") },
    { icon: FaBookOpen, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaCompass, label: "Discover", onClick: () => navigate("/discover") },
    { icon: FaBookmark, label: "Saved", onClick: () => navigate("/saved") },
    { icon: FaUsers, label: "Community", onClick: () => {}, active: true },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
  ];

  return (
    <div className="h-screen w-full bg-primary text-text-main flex overflow-hidden font-sans">
      <AnimatePresence>
        {sidebarOpen && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden" />}
      </AnimatePresence>

      <motion.aside initial={false} animate={{ width: sidebarOpen ? 260 : 80 }} className="hidden md:flex flex-col bg-primary-light/80 backdrop-blur-xl border-r border-white/5 z-50 overflow-hidden">
        <div className="p-6 flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white text-xl font-bold font-serif">B</div>{sidebarOpen && <span className="font-serif font-bold text-xl text-white">Boocozmo</span>}</div>
        <nav className="flex-1 px-4 space-y-2">{navItems.map(item => (<button key={item.label} onClick={item.onClick} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${item.active ? 'bg-secondary/20 text-secondary' : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'}`}><item.icon size={20} />{sidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}</button>))}</nav>
      </motion.aside>

      <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-primary via-primary-light/20 to-primary relative overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
         
         <header className="h-20 px-6 flex items-center justify-between border-b border-white/5 bg-primary/80 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="md:hidden p-2 text-white"><FaArrowLeft /></button>
               <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-secondary-hover flex items-center justify-center text-sm">C</div> Community</h1>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={() => {}} className="p-2 bg-secondary text-white rounded-lg font-bold text-sm px-4 flex items-center gap-2 shadow-lg hover:bg-secondary-hover transition-colors">
                  <FaPlus /> <span className="hidden sm:inline">{viewMode === 'feed' ? 'New Post' : 'Create Salon'}</span>
               </button>
               <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 text-white"><FaBars /></button>
            </div>
         </header>

         <div className="px-6 py-4 sticky top-20 z-20 bg-primary/95 backdrop-blur-md border-b border-white/5">
            <div className="flex gap-2 mb-4">
               <button onClick={() => setViewMode('feed')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'feed' ? 'bg-secondary text-white' : 'bg-primary-light/50 text-gray-400'}`}><FaComments className="inline mr-2" /> Feed</button>
               <button onClick={() => setViewMode('salons')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'salons' ? 'bg-purple-600 text-white' : 'bg-primary-light/50 text-gray-400'}`}><FaUsers className="inline mr-2" /> Salons</button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
               {viewMode === 'feed' ? (
                  ['latest', 'popular', 'following'].map((t: any) => (
                     <button key={t} onClick={() => setFeedFilter(t)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${feedFilter === t ? 'bg-white text-primary border-white' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                        {t === 'latest' && <FaClock className="inline mr-1" />}
                        {t === 'popular' && <FaFire className="inline mr-1" />}
                        {t === 'following' && <FaUsers className="inline mr-1" />}
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                     </button>
                  ))
               ) : (
                  ['active', 'popular', 'new'].map((t: any) => (
                     <button key={t} onClick={() => setSalonFilter(t)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${salonFilter === t ? 'bg-purple-600 text-white border-purple-600' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                     </button>
                  ))
               )}
            </div>

            {viewMode === 'salons' && (
               <div className="relative mt-4">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search salons..." className="w-full bg-primary-light/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-purple-600 outline-none placeholder-gray-500" />
               </div>
            )}
         </div>

         <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
            <div className="max-w-3xl mx-auto space-y-6">
               <AnimatePresence mode="wait">
                  {viewMode === 'feed' ? (
                     <motion.div key="feed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                        {mockFeedPosts.map((post) => (
                           <div key={post.id} className="bg-primary-light/30 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                              <div className="flex items-center gap-3 mb-4">
                                 <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{background: post.userColor}}>{post.username[0].toUpperCase()}</div>
                                 <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                       <h3 className="font-bold text-white">{post.displayName}</h3>
                                       {post.isYou && <span className="bg-secondary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">YOU</span>}
                                    </div>
                                    <div className="text-xs text-gray-400">@{post.username} • {post.timestamp}</div>
                                 </div>
                              </div>
                              <p className="text-gray-200 mb-4 leading-relaxed">{post.content}</p>
                              {post.image && <img src={post.image} className="w-full h-64 object-cover rounded-2xl mb-4" />}
                              <div className="flex flex-wrap gap-2 mb-4">
                                 {post.tags.map(tag => <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-xs flex items-center gap-1"><FaHashtag size={10} /> {tag}</span>)}
                              </div>
                              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                 <button onClick={() => handleLikePost(post.id)} className={`flex items-center gap-2 text-sm font-bold transition-colors ${likedPosts.includes(post.id) ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
                                    <FaHeart /> {post.likes + (likedPosts.includes(post.id) ? 1 : 0)}
                                 </button>
                                 <button className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"><FaComments /> {post.comments}</button>
                                 <button className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"><FaShareAlt /> {post.shares}</button>
                              </div>
                           </div>
                        ))}
                     </motion.div>
                  ) : (
                     <motion.div key="salons" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                        {filteredSalons.map((salon) => (
                           <div key={salon.id} className="bg-primary-light/30 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:border-purple-500/50 transition-all relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-6xl">{salon.icon}</div>
                              <div className="flex justify-between items-start mb-2 relative z-10">
                                 <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{salon.name}</h3>
                                    <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">{salon.category}</span>
                                 </div>
                                 {salon.popular && <FaCrown className="text-yellow-500" />}
                              </div>
                              <p className="text-gray-300 text-sm mb-4 relative z-10">{salon.description}</p>
                              <div className="flex items-center justify-between relative z-10">
                                 <div className="text-xs text-gray-400 flex items-center gap-3">
                                    <span className="flex items-center gap-1"><FaUsers /> {salon.members}</span>
                                    <span className="flex items-center gap-1"><FaComments /> {salon.comments}</span>
                                 </div>
                                 <button onClick={() => handleJoinSalon(salon.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${joinedSalons.includes(salon.id) ? 'bg-white/10 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                                    {joinedSalons.includes(salon.id) ? 'Joined' : 'Join Salon'}
                                 </button>
                              </div>
                           </div>
                        ))}
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </main>
      </div>
    </div>
  );
}