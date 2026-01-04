/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/WelcomeScreen.tsx
import { motion } from "framer-motion";
import { FaFeatherAlt, FaUserPlus, FaMapMarkedAlt, FaComments, FaUniversity } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const handleNav = () => navigate("/login");

  const showcase = [
    { 
       title: "The Picture of Dorian Gray", author: "Oscar Wilde", theme: "Aestheticism", 
       desc: "Art is the only serious thing in the world. And the artist is the only person who is never serious.",
       cover: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400&q=80",
       color: "bg-purple-100", height: "h-64 md:h-80", rotate: "rotate-2"
    },
    { 
       title: "The Stranger", author: "Albert Camus", theme: "Absurdism", 
       desc: "I opened myself to the gentle indifference of the world.",
       cover: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&q=80", 
       color: "bg-orange-100", height: "h-56 md:h-64", rotate: "-rotate-1"
    },
    { 
       title: "Crime and Punishment", author: "Fyodor Dostoevsky", theme: "Nihilism", 
       desc: "Pain and suffering are always inevitable for a large intelligence and a deep heart.",
       cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&q=80",
       color: "bg-red-100", height: "h-72 md:h-96", rotate: "rotate-1"
    },
    { 
       title: "Pride and Prejudice", author: "Jane Austen", theme: "Wit & Society", 
       desc: "I could easily forgive his pride, if he had not mortified mine.",
       cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
       color: "bg-pink-100", height: "h-60 md:h-72", rotate: "-rotate-2"
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#f4f1ea] overflow-x-hidden font-sans text-[#382110]">
       {/* Public Header */}
       <header className="absolute top-0 left-0 right-0 h-20 px-6 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 bg-[#382110] rounded-xl flex items-center justify-center text-white text-lg"><FaFeatherAlt /></div>
             <h1 className="text-2xl font-serif font-bold tracking-tighter">Boocozmo</h1>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => navigate("/login")} className="px-5 py-2.5 text-sm font-bold border-2 border-[#382110] rounded-full hover:bg-[#382110] hover:text-white transition-all">
                Log In
             </button>
             <button onClick={() => navigate("/signup")} className="px-5 py-2.5 text-sm font-bold bg-[#b85c38] text-white rounded-full hover:bg-[#a04b28] transition-all shadow-lg hidden md:block">
                Sign Up
             </button>
          </div>
       </header>

       {/* Artistic Background Swirls */}
       <div className="absolute top-[-10%] left-[-10%] w-[700px] h-[700px] bg-[#e6d5c3] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />
       <div className="absolute top-[20%] right-[-20%] w-[600px] h-[600px] bg-[#d4e6c3] rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
       <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-[#e2c2c6] rounded-full mix-blend-multiply filter blur-3xl opacity-40" />

       <div className="relative z-10 pt-28 pb-16 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center">
          
          {/* Hero Section */}
          <section className="text-center mb-24 max-w-4xl relative">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}>
                <h2 className="text-5xl md:text-8xl font-serif font-bold mb-6 leading-[0.9] text-[#382110]">
                   The Society <br/> of <span className="italic text-[#b85c38]">Seekers</span>
                </h2>
             </motion.div>
             
             <motion.p 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="text-lg md:text-xl text-[#666] mb-10 leading-relaxed max-w-2xl mx-auto font-light"
             >
                More than just a bookshelf. A living canvas for students, dreamers, and neighbors. 
                Roam your neighborhood, uncover hidden gems, and exchange ideas in a community built for the curious.
             </motion.p>
             
             <button onClick={handleNav} className="group relative px-8 py-4 bg-[#382110] text-white text-lg rounded-full shadow-2xl hover:scale-105 transition-transform overflow-hidden">
                <span className="relative z-10 flex items-center gap-2 font-bold"><FaUserPlus /> Join the Society</span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
             </button>
          </section>

          {/* Asymmetric Imagery - "Messy Canvas" Look */}
          <section className="w-full mb-32 relative">
             <div className="columns-2 md:columns-4 gap-4 space-y-4 mx-auto max-w-6xl">
                {showcase.map((item, i) => (
                   <motion.div 
                      key={item.title}
                      initial={{ opacity: 0, y: 50, rotate: 0 }}
                      whileInView={{ opacity: 1, y: 0, rotate: parseFloat(item.rotate.replace('rotate-', '-').replace('rotate', '')) }}
                      transition={{ delay: i * 0.1, type: "spring", stiffness: 50 }}
                      onClick={handleNav}
                      className={`break-inside-avoid relative group cursor-pointer rounded-sm shadow-xl hover:z-20 hover:scale-105 transition-all duration-500 overflow-hidden ${item.color} ${item.height} ${item.rotate}`}
                   >
                      <img src={item.cover} className="w-full h-full object-cover sepia-[0.2] group-hover:sepia-0 transition-all duration-700" />
                      
                      {/* Stylized Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#382110] via-transparent to-transparent opacity-80" />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
                         <div className="w-8 h-1 bg-[#b85c38] mb-2" />
                         <h4 className="font-serif text-xl font-bold leading-none mb-1 shadow-black drop-shadow-md">{item.title}</h4>
                         <p className="text-xs uppercase tracking-widest opacity-80 mb-2">{item.author}</p>
                         <p className="text-xs italic font-serif opacity-0 group-hover:opacity-100 transition-opacity delay-100 line-clamp-3">
                            "{item.desc}"
                         </p>
                      </div>
                   </motion.div>
                ))}
             </div>
          </section>

          {/* Community Pillars */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
             <div onClick={handleNav} className="group p-8 bg-white rounded-3xl border border-[#eee] hover:border-[#b85c38] transition-colors cursor-pointer text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150" />
                <FaUniversity className="text-4xl text-[#382110] mb-4 relative z-10 mx-auto" />
                <h3 className="text-xl font-bold text-[#382110] mb-2 relative z-10">Student Hub</h3>
                <p className="text-gray-500 text-sm relative z-10">Find textbooks, notes, and study partners within your campus or city.</p>
             </div>
             
             <div onClick={handleNav} className="group p-8 bg-white rounded-3xl border border-[#eee] hover:border-[#b85c38] transition-colors cursor-pointer text-center relative overflow-hidden transform md:-translate-y-8">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150" />
                <FaMapMarkedAlt className="text-4xl text-[#382110] mb-4 relative z-10 mx-auto" />
                <h3 className="text-xl font-bold text-[#382110] mb-2 relative z-10">Neighborhood Exchange</h3>
                <p className="text-gray-500 text-sm relative z-10">Discover libraries hidden in plain sight. Walk to pick up your next read.</p>
             </div>

             <div onClick={handleNav} className="group p-8 bg-white rounded-3xl border border-[#eee] hover:border-[#b85c38] transition-colors cursor-pointer text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150" />
                <FaComments className="text-4xl text-[#382110] mb-4 relative z-10 mx-auto" />
                <h3 className="text-xl font-bold text-[#382110] mb-2 relative z-10">Intellectual Society</h3>
                <p className="text-gray-500 text-sm relative z-10">Debate philosophy, discuss plots, and build meaningful connections.</p>
             </div>
          </section>

       </div>
    </div>
  );
}
