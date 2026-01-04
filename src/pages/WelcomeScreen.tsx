/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/WelcomeScreen.tsx
import { motion } from "framer-motion";
import { FaFeatherAlt, FaSignInAlt, FaUserPlus, FaBook, FaMapMarkedAlt, FaComments } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function WelcomeScreen() {
  const navigate = useNavigate();

  const handleNav = () => navigate("/login");

  const showcase = [
    { 
       title: "The Stranger", author: "Albert Camus", theme: "Absurdism", 
       desc: "The nakedness of man faced with the absurd.",
       cover: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=300&q=80",
       color: "bg-orange-100"
    },
    { 
       title: "Crime and Punishment", author: "Fyodor Dostoevsky", theme: "Nihilism & Redemption", 
       desc: "The psychological anguish of a dilemma.",
       cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&q=80",
       color: "bg-red-100"
    },
    { 
       title: "The Picture of Dorian Gray", author: "Oscar Wilde", theme: "Aestheticism", 
       desc: "Art for art's sake, and the price of vanity.",
       cover: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=300&q=80",
       color: "bg-purple-100"
    },
    { 
       title: "Pride and Prejudice", author: "Jane Austen", theme: "Sentiments & Wit", 
       desc: "A critique of societal expectations.",
       cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80",
       color: "bg-pink-100"
    },
  ];

  const appFeatures = [
    { title: "Local Exchange", icon: FaMapMarkedAlt, text: "Find books in your neighborhood." },
    { title: "Community Chat", icon: FaComments, text: "Discuss classics with peers." },
    { title: "Digital Library", icon: FaBook, text: "Catalog your collection." }
  ];

  return (
    <div className="relative min-h-screen bg-[#f4f1ea] overflow-x-hidden font-sans text-[#382110]">
       {/* Public Header */}
       <header className="absolute top-0 left-0 right-0 h-16 px-6 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-[#382110] rounded-lg flex items-center justify-center text-white"><FaFeatherAlt /></div>
             <h1 className="text-2xl font-serif font-bold tracking-tighter">Boocozmo</h1>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => navigate("/login")} className="px-4 py-2 text-sm font-bold border border-[#382110] rounded-full hover:bg-[#382110] hover:text-white transition-colors">
                Log In
             </button>
             <button onClick={() => navigate("/signup")} className="px-4 py-2 text-sm font-bold bg-[#b85c38] text-white rounded-full hover:bg-[#a04b28] transition-colors hidden md:block">
                Sign Up
             </button>
          </div>
       </header>

       {/* Artistic Baground Bloom */}
       <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-[#e6d5c3] rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
       <div className="absolute top-[10%] right-[-10%] w-[400px] h-[400px] bg-[#d4e6c3] rounded-full mix-blend-multiply filter blur-3xl opacity-50" />

       <div className="relative z-10 pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center">
          
          {/* Hero Section */}
          <section className="text-center mb-16 max-w-3xl">
             <motion.h2 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight"
             >
                Where Stories <br/><span className="italic text-[#b85c38]">Come Alive</span>
             </motion.h2>
             <p className="text-lg text-[#666] mb-8 leading-relaxed">
                Connect with a community that cherishes the smell of old paper and the weight of a good story. 
                From the absurd to the romantic, find your next chapter locally.
             </p> 
             <button onClick={handleNav} className="px-8 py-3 bg-[#382110] text-white text-lg rounded-full shadow-xl hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
                <FaUserPlus /> Join the Community
             </button>
          </section>

          {/* Literary Masters Grid - Mobile Optimized (2 cols) */}
          <section className="w-full mb-20">
             <div className="flex items-center justify-center gap-4 mb-8">
                <div className="h-px bg-[#ccc] w-12" />
                <h3 className="font-serif italic text-xl text-[#888]">Curated Classics</h3>
                <div className="h-px bg-[#ccc] w-12" />
             </div>

             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {showcase.map((item, i) => (
                   <motion.div 
                      key={item.title}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={handleNav}
                      className={`relative group cursor-pointer overflow-hidden rounded-xl border border-white/40 shadow-sm hover:shadow-xl transition-all ${item.color}`}
                   >
                      <div className="aspect-[2/3] w-full relative overflow-hidden">
                         <img src={item.cover} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 sepia-[0.3] group-hover:sepia-0" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                         <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white">
                            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/70 mb-1">{item.theme}</div>
                            <h4 className="font-serif text-sm md:text-lg font-bold leading-tight mb-1">{item.title}</h4>
                            <p className="text-xs text-white/80 italic">{item.author}</p>
                         </div>
                      </div>
                      <div className="absolute inset-0 bg-[#382110]/90 flex flex-col items-center justify-center p-4 text-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                         <p className="font-serif text-sm md:text-base italic mb-4">"{item.desc}"</p>
                         <span className="text-xs border border-white/30 px-3 py-1 rounded-full">Read More</span>
                      </div>
                   </motion.div>
                ))}
             </div>
          </section>

          {/* App Info Posters */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
             {appFeatures.map((feat, i) => (
                <motion.div 
                   key={feat.title}
                   initial={{ opacity: 0, x: -20 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.2 }}
                   onClick={handleNav}
                   className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5e5e5] flex flex-col items-center text-center cursor-pointer hover:border-[#b85c38] transition-colors"
                >
                   <div className="w-12 h-12 bg-[#f4f1ea] rounded-full flex items-center justify-center text-[#382110] text-xl mb-4">
                      <feat.icon />
                   </div>
                   <h4 className="font-bold text-[#382110] mb-2">{feat.title}</h4>
                   <p className="text-sm text-[#666]">{feat.text}</p>
                </motion.div>
             ))}
          </section>

       </div>
    </div>
  );
}
