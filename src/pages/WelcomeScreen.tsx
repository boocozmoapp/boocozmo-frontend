/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/WelcomeScreen.tsx
import { motion } from "framer-motion";
import { FaFeatherAlt, FaUserPlus, FaMapMarkedAlt, FaComments, FaUniversity, FaBook, FaGlobe } from "react-icons/fa";
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

          {/* How Boocozmo Works - Instructional Poster */}
          <section className="w-full mb-32 max-w-6xl">
             <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative bg-gradient-to-br from-[#2a1810] via-[#382110] to-[#4a2d1a] rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl border border-white/10"
             >
                {/* Enhanced Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#b85c38]/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-[#d4a574]/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#b85c38]/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
                
                <div className="relative z-10">
                   <div className="text-center mb-12">
                      <motion.h3 
                         initial={{ opacity: 0, y: -20 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.2, duration: 0.6 }}
                         className="text-4xl md:text-6xl font-serif font-bold mb-4 bg-gradient-to-r from-[#f4a261] via-[#e76f51] to-[#e9c46a] bg-clip-text text-transparent"
                      >
                         How Boocozmo Works
                      </motion.h3>
                      <motion.p 
                         initial={{ opacity: 0 }}
                         whileInView={{ opacity: 1 }}
                         transition={{ delay: 0.4, duration: 0.6 }}
                         className="text-white/90 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed"
                      >
                         Circulate knowledge through your community in <span className="text-[#f4a261] font-bold">physical form</span>. 
                         Every book has a story, and every exchange builds connections.
                      </motion.p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                      {/* Step 1 */}
                      <motion.div 
                         initial={{ opacity: 0, y: 50 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.1, duration: 0.5 }}
                         className="group relative"
                      >
                         <motion.div 
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="absolute -top-3 -left-3 w-14 h-14 bg-gradient-to-br from-[#f4a261] to-[#e76f51] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-2xl"
                         >
                            1
                         </motion.div>
                         <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 h-full hover:bg-white/20 hover:border-[#f4a261]/50 hover:shadow-2xl hover:shadow-[#f4a261]/20 transition-all duration-300 group-hover:scale-105">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#f4a261]/30 to-[#e76f51]/20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:rotate-12 transition-transform duration-300">
                               <FaBook className="text-3xl text-[#f4a261]" />
                            </div>
                            <h4 className="text-white font-bold text-lg mb-3 text-center">Create Your Library</h4>
                            <p className="text-white/80 text-sm text-center leading-relaxed">
                               Transfer your physical collection into the app. Create libraries, add books—they stay <span className="text-[#f4a261] font-semibold">private</span> until you decide otherwise.
                            </p>
                         </div>
                      </motion.div>

                      {/* Step 2 */}
                      <motion.div 
                         initial={{ opacity: 0, y: 50 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.2, duration: 0.5 }}
                         className="group relative"
                      >
                         <motion.div 
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="absolute -top-3 -left-3 w-14 h-14 bg-gradient-to-br from-[#e76f51] to-[#d62828] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-2xl"
                         >
                            2
                         </motion.div>
                         <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 h-full hover:bg-white/20 hover:border-[#e76f51]/50 hover:shadow-2xl hover:shadow-[#e76f51]/20 transition-all duration-300 group-hover:scale-105">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#e76f51]/30 to-[#d62828]/20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:rotate-12 transition-transform duration-300">
                               <FaGlobe className="text-3xl text-[#e76f51]" />
                            </div>
                            <h4 className="text-white font-bold text-lg mb-3 text-center">Publish as Offers</h4>
                            <p className="text-white/80 text-sm text-center leading-relaxed">
                               Ready to sell or exchange? Publish any book as an offer. Set your price or what you'd trade for—visible to your <span className="text-[#e76f51] font-semibold">neighborhood</span>.
                            </p>
                         </div>
                      </motion.div>

                      {/* Step 3 */}
                      <motion.div 
                         initial={{ opacity: 0, y: 50 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.3, duration: 0.5 }}
                         className="group relative"
                      >
                         <motion.div 
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="absolute -top-3 -left-3 w-14 h-14 bg-gradient-to-br from-[#e9c46a] to-[#f4a261] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-2xl"
                         >
                            3
                         </motion.div>
                         <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 h-full hover:bg-white/20 hover:border-[#e9c46a]/50 hover:shadow-2xl hover:shadow-[#e9c46a]/20 transition-all duration-300 group-hover:scale-105">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#e9c46a]/30 to-[#f4a261]/20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:rotate-12 transition-transform duration-300">
                               <FaComments className="text-3xl text-[#e9c46a]" />
                            </div>
                            <h4 className="text-white font-bold text-lg mb-3 text-center">Community Discovers</h4>
                            <p className="text-white/80 text-sm text-center leading-relaxed">
                               Neighbors browse offers, find hidden gems, and <span className="text-[#e9c46a] font-semibold">contact you</span> directly through the app to arrange the exchange.
                            </p>
                         </div>
                      </motion.div>

                      {/* Step 4 */}
                      <motion.div 
                         initial={{ opacity: 0, y: 50 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.4, duration: 0.5 }}
                         className="group relative"
                      >
                         <motion.div 
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="absolute -top-3 -left-3 w-14 h-14 bg-gradient-to-br from-[#2a9d8f] to-[#264653] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-2xl"
                         >
                            4
                         </motion.div>
                         <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 h-full hover:bg-white/20 hover:border-[#2a9d8f]/50 hover:shadow-2xl hover:shadow-[#2a9d8f]/20 transition-all duration-300 group-hover:scale-105">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#2a9d8f]/30 to-[#264653]/20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:rotate-12 transition-transform duration-300">
                               <FaMapMarkedAlt className="text-3xl text-[#2a9d8f]" />
                            </div>
                            <h4 className="text-white font-bold text-lg mb-3 text-center">Physical Exchange</h4>
                            <p className="text-white/80 text-sm text-center leading-relaxed">
                               Meet locally, exchange books in person. Real connections, real books, real <span className="text-[#2a9d8f] font-semibold">community</span>—knowledge circulates physically.
                            </p>
                         </div>
                      </motion.div>
                   </div>

                   {/* Bottom Note */}
                   <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                      className="mt-12 text-center"
                   >
                      <div className="inline-block bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md border border-white/30 rounded-full px-8 py-4 hover:border-[#f4a261]/50 hover:shadow-lg hover:shadow-[#f4a261]/20 transition-all duration-300">
                         <p className="text-white text-sm md:text-base font-medium">
                            💡 <span className="font-bold text-[#f4a261]">No library yet?</span> Simply browse neighborhood offers and start collecting!
                         </p>
                      </div>
                   </motion.div>
                </div>
             </motion.div>
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
