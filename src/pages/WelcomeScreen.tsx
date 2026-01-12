/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/WelcomeScreen.tsx
import { motion } from "framer-motion";
import { FaFeatherAlt, FaMapMarkedAlt, FaComments, FaUniversity, FaBook } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const handleNav = () => navigate("/login");

  const benefits = [
    {
      icon: <FaBook className="text-4xl text-[#382110]" />,
      title: "Curate Your Personal Library",
      desc: "Catalog your physical books — keep them private or share select titles with fellow readers nearby. Track your collection the way a true bibliophile would.",
    },
    {
      icon: <FaMapMarkedAlt className="text-4xl text-[#382110]" />,
      title: "Discover Local Treasures",
      desc: "Browse books available just steps away — in your neighborhood, on campus, or around the corner. Real books from real people.",
    },
    {
      icon: <FaComments className="text-4xl text-[#382110]" />,
      title: "Forge Real Connections",
      desc: "Message, negotiate, meet. Discuss plots over coffee, trade recommendations, build a community one handed-over novel at a time.",
    },
    {
      icon: <FaUniversity className="text-4xl text-[#382110]" />,
      title: "A Haven for Students",
      desc: "Affordable textbooks, shared notes, study companions — all circulating within your academic circle.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#fdfaf5] overflow-hidden font-serif text-[#382110] leading-relaxed">
      {/* Background Layers */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-32 pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: "url('https://media.istockphoto.com/id/1203011577/vector/newspaper-with-old-grunge-vintage-unreadable-paper-texture-background.jpg?s=612x612&w=0&k=20&c=b16KyYgiKLgpjf1Z18HDLjD4z3QfDB31e3tVgk-GoYk=')",
        }}
      />
      <div
        className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-paper.png')] opacity-18 pointer-events-none"
      />

      {/* Gentle warm vignette glow (soft sepia light bleed) */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(139,69,19,0.08) 100%)'
        }}
      />

      {/* Stitched Side Pages – enhanced with more visible text & page curl */}
      <div
        className="fixed top-0 bottom-0 left-0 w-[15vw] max-w-[190px] opacity-24 pointer-events-none z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "right center",
          transform: "skew(-5deg) translateX(-10px)",
          boxShadow: "inset -20px 0 40px rgba(0,0,0,0.28)",
          filter: "brightness(0.92) sepia(0.15)"
        }}
      />
      <div
        className="fixed top-0 bottom-0 right-0 w-[15vw] max-w-[190px] opacity-24 pointer-events-none z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1589995632479-ab97cbddc28c?ixlib=rb-4.0.3&auto=format&fit=crop&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "left center",
          transform: "skew(5deg) translateX(10px)",
          boxShadow: "inset 20px 0 40px rgba(0,0,0,0.28)",
          filter: "brightness(0.92) sepia(0.15)"
        }}
      />

      {/* Faint marginalia scribbles (tiny handwritten notes in corners) */}
      <div className="absolute top-8 left-6 w-32 h-32 opacity-12 pointer-events-none z-0">
        <img src="https://images.unsplash.com/photo-1544966966-6d5a0a0e489e?ixlib=rb-4.0.3&auto=format&fit=crop&q=80&w=400" alt="faint marginalia" className="w-full h-full object-contain" />
      </div>
      <div className="absolute bottom-12 right-8 w-40 h-40 opacity-10 pointer-events-none z-0 transform rotate-6">
        <img src="https://images.unsplash.com/photo-1544966966-6d5a0a0e489e?ixlib=rb-4.0.3&auto=format&fit=crop&q=80&w=400" alt="faint marginalia" className="w-full h-full object-contain" />
      </div>

      {/* Classic Bookmark Ribbon */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-64 opacity-40 pointer-events-none z-10">
        <div className="w-full h-full bg-gradient-to-b from-[#8B0000] via-[#A52A2A] to-transparent rounded-t-full" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#8B0000] rounded-full shadow-md" />
      </div>

      {/* Tiny coffee ring stain */}
      <div className="absolute bottom-8 right-12 w-48 h-48 opacity-9 pointer-events-none z-0">
        <div className="w-full h-full rounded-full border-8 border-[#4a2c0f]/40 blur-sm" />
        <div className="absolute inset-4 rounded-full border-4 border-[#6b3e14]/30" />
      </div>

      {/* Header */}
      <header className="sticky top-0 left-0 right-0 h-20 px-6 md:px-12 flex items-center justify-between z-50 bg-[#fdfaf5]/92 backdrop-blur-sm border-b border-[#d9c9b8]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#382110] rounded-sm flex items-center justify-center text-white text-xl"><FaFeatherAlt /></div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Boocozmo</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/login")} className="px-6 py-2 text-sm font-medium border-2 border-[#382110] rounded hover:bg-[#382110] hover:text-white transition-colors">
            Log In
          </button>
          <button onClick={() => navigate("/signup")} className="px-6 py-2 text-sm font-medium bg-[#382110] text-white rounded hover:bg-[#2a1a0c] transition-colors hidden md:block">
            Join the Society
          </button>
        </div>
      </header>

      <div className="relative z-10 pt-20 pb-20 px-6 md:px-12 max-w-5xl mx-auto flex flex-col items-center space-y-24">
        {/* Hero */}
        <section className="text-center max-w-3xl relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="mb-6 inline-block"
          >
            <span className="text-xs uppercase tracking-[0.3em] text-[#8b6f47] font-semibold">ESTABLISHED 2026</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-4xl md:text-6xl font-bold mb-6 leading-[1.1]"
          >
            Where Stories <br/>
            Find New <span className="italic text-[#8b4513]">Homes</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-[#5c4033] mb-10 leading-relaxed font-light max-w-2xl mx-auto"
          >
            A local haven for digital-weary readers. Catalog your shelves, 
            discover treasures just steps away, and forge real connections 
            one handed-over novel at a time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={handleNav}
              className="w-full sm:w-auto px-10 py-4 bg-[#382110] text-white text-lg rounded-full hover:bg-[#2a1a0c] transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              Step Inside
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="w-full sm:w-auto px-10 py-4 bg-transparent text-[#382110] text-lg rounded-full border-2 border-[#382110] hover:bg-[#382110] hover:text-white transition-all active:scale-95"
            >
              Join the Society
            </button>
          </motion.div>
        </section>

        {/* Benefits */}
        <section className="w-full">
          <motion.h3
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-4xl font-bold mb-12 text-center"
          >
            Chapters of Connection
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.25, duration: 1 }}
                className="bg-white/70 backdrop-blur-sm border border-[#d9c9b8] rounded-lg p-8 shadow-md hover:shadow-lg transition-all duration-500"
              >
                <div className="mb-6 flex justify-center">{benefit.icon}</div>
                <h4 className="text-2xl font-bold mb-4 text-center">{benefit.title}</h4>
                <p className="text-[#5c4033] text-center leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final Call */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="text-center max-w-2xl"
        >
          <p className="text-xl md:text-2xl text-[#5c4033] mb-8 italic">
            "Between the pages of a book is a lovely place to be."  
            Come — let us make that place shared, local, and forever alive.
          </p>
          <button
            onClick={handleNav}
            className="px-12 py-5 bg-[#382110] text-white text-lg rounded hover:bg-[#2a1a0c] transition-all shadow-lg"
          >
            Open the Cover — Join Boocozmo
          </button>
        </motion.section>
      </div>

      <footer className="bg-[#382110] text-white/90 py-10 text-center text-sm border-t-4 border-[#5c4033]">
        <p>Boocozmo — Where Books Still Breathe • © 2026</p>
      </footer>
    </div>
  );
}