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
                className="relative bg-[#fdfaf5] rounded-[40px] p-8 md:p-16 overflow-hidden shadow-xl border border-[#eaddcf]"
             >
                {/* Creative Light Decorative Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f4a261]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#e76f51]/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#382110]/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
                
                {/* Floating Book Icons for Creativity */}
                <div className="absolute top-10 left-10 opacity-[0.03] rotate-12 -z-0"><FaBook size={120} /></div>
                <div className="absolute bottom-10 right-10 opacity-[0.03] -rotate-12 -z-0"><FaGlobe size={150} /></div>

                <div className="relative z-10">
                   <div className="text-center mb-16">
                      <motion.div
                         initial={{ opacity: 0, scale: 0.8 }}
                         whileInView={{ opacity: 1, scale: 1 }}
                         className="inline-block px-4 py-1 bg-[#b85c38]/10 text-[#b85c38] rounded-full text-xs font-bold tracking-widest uppercase mb-4"
                      >
                         Simple Process
                      </motion.div>
                      <motion.h3 
                         initial={{ opacity: 0, y: -20 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.2, duration: 0.6 }}
                         className="text-4xl md:text-7xl font-serif font-bold mb-6 bg-gradient-to-r from-[#382110] via-[#b85c38] to-[#382110] bg-clip-text text-transparent"
                      >
                         How Boocozmo Works
                      </motion.h3>
                      <motion.p 
                         initial={{ opacity: 0 }}
                         whileInView={{ opacity: 1 }}
                         transition={{ delay: 0.4, duration: 0.6 }}
                         className="text-[#5c4033] text-base md:text-xl max-w-2xl mx-auto leading-relaxed font-light"
                      >
                         Circulate knowledge through your community in <span className="text-[#b85c38] font-bold">physical form</span>. 
                         Every book has a story, and every exchange builds connections.
                      </motion.p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
                      {/* Step 1 */}
                      <motion.div 
                         initial={{ opacity: 0, y: 50 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.1, duration: 0.5 }}
                         className="group relative"
                      >
                         <motion.div 
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            className="absolute -top-4 -left-4 w-16 h-16 bg-white border-4 border-[#fdfaf5] rounded-2xl flex items-center justify-center text-[#f4a261] font-bold text-2xl shadow-lg z-20"
                         >
                            01
                         </motion.div>
                         <div className="bg-white rounded-[32px] p-8 h-full shadow-sm border border-[#eaddcf] hover:border-[#f4a261] hover:shadow-2xl hover:shadow-[#f4a261]/10 transition-all duration-500 group-hover:-translate-y-2">
                            <div className="w-16 h-16 bg-[#f4a261]/10 rounded-2xl flex items-center justify-center mb-6 text-[#f4a261] group-hover:scale-110 group-hover:bg-[#f4a261] group-hover:text-white transition-all duration-500">
                               <FaBook className="text-3xl" />
                            </div>
                            <h4 className="text-[#382110] font-bold text-xl mb-4">Create Your Library</h4>
                            <p className="text-[#5c4033]/80 text-sm leading-relaxed">
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
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            className="absolute -top-4 -left-4 w-16 h-16 bg-white border-4 border-[#fdfaf5] rounded-2xl flex items-center justify-center text-[#e76f51] font-bold text-2xl shadow-lg z-20"
                         >
                            02
                         </motion.div>
                         <div className="bg-white rounded-[32px] p-8 h-full shadow-sm border border-[#eaddcf] hover:border-[#e76f51] hover:shadow-2xl hover:shadow-[#e76f51]/10 transition-all duration-500 group-hover:-translate-y-2">
                            <div className="w-16 h-16 bg-[#e76f51]/10 rounded-2xl flex items-center justify-center mb-6 text-[#e76f51] group-hover:scale-110 group-hover:bg-[#e76f51] group-hover:text-white transition-all duration-500">
                               <FaGlobe className="text-3xl" />
                            </div>
                            <h4 className="text-[#382110] font-bold text-xl mb-4">Publish as Offers</h4>
                            <p className="text-[#5c4033]/80 text-sm leading-relaxed">
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
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            className="absolute -top-4 -left-4 w-16 h-16 bg-white border-4 border-[#fdfaf5] rounded-2xl flex items-center justify-center text-[#e9c46a] font-bold text-2xl shadow-lg z-20"
                         >
                            03
                         </motion.div>
                         <div className="bg-white rounded-[32px] p-8 h-full shadow-sm border border-[#eaddcf] hover:border-[#e9c46a] hover:shadow-2xl hover:shadow-[#e9c46a]/10 transition-all duration-500 group-hover:-translate-y-2">
                            <div className="w-16 h-16 bg-[#e9c46a]/10 rounded-2xl flex items-center justify-center mb-6 text-[#e9c46a] group-hover:scale-110 group-hover:bg-[#e9c46a] group-hover:text-white transition-all duration-500">
                               <FaComments className="text-3xl" />
                            </div>
                            <h4 className="text-[#382110] font-bold text-xl mb-4">Community Discovers</h4>
                            <p className="text-[#5c4033]/80 text-sm leading-relaxed">
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
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            className="absolute -top-4 -left-4 w-16 h-16 bg-white border-4 border-[#fdfaf5] rounded-2xl flex items-center justify-center text-[#2a9d8f] font-bold text-2xl shadow-lg z-20"
                         >
                            04
                         </motion.div>
                         <div className="bg-white rounded-[32px] p-8 h-full shadow-sm border border-[#eaddcf] hover:border-[#2a9d8f] hover:shadow-2xl hover:shadow-[#2a9d8f]/10 transition-all duration-500 group-hover:-translate-y-2">
                            <div className="w-16 h-16 bg-[#2a9d8f]/10 rounded-2xl flex items-center justify-center mb-6 text-[#2a9d8f] group-hover:scale-110 group-hover:bg-[#2a9d8f] group-hover:text-white transition-all duration-500">
                               <FaMapMarkedAlt className="text-3xl" />
                            </div>
                            <h4 className="text-[#382110] font-bold text-xl mb-4">Physical Exchange</h4>
                            <p className="text-[#5c4033]/80 text-sm leading-relaxed">
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
                      className="mt-16 text-center"
                   >
                      <div className="inline-block bg-[#382110] rounded-full px-10 py-5 hover:scale-105 transition-all duration-300 shadow-xl group">
                         <p className="text-white text-sm md:text-lg font-bold flex items-center gap-3">
                            <span className="group-hover:rotate-12 transition-transform">💡</span> 
                            <span>No library yet? <span className="text-[#f4a261]">Start browsing neighborhood offers!</span></span>
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
