/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/OfferDetailScreen.tsx - MEDIUM STYLE REFINEMENT
import { useEffect, useState } from "react";
import { 
  FaArrowLeft, FaMapMarkerAlt, FaUser, FaComments, FaHeart, FaShare,
  FaBook, FaLeaf, FaClock, FaShieldAlt
} from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

const API_BASE = "https://boocozmo-api.onrender.com";

type Offer = {
  id: number;
  type: "buy" | "sell" | "exchange";
  bookTitle: string;
  exchangeBook: string | null;
  price: number | null;
  condition: string | null;
  ownerEmail: string;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  ownerName?: string;
  distance?: string | null;
  description?: string;
  genre?: string;
  author?: string;
  publishedAt?: string;
};

type Props = {
  currentUser: { email: string; name: string; id: string };
};

export default function OfferDetailScreen({ currentUser }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 1.1]);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const response = await fetch(`${API_BASE}/offers/${id}`);
        if (response.ok) {
          const data = await response.json();
          setOffer(data);
        } else {
           throw new Error("Not found"); 
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchOffer();
  }, [id]);

  const handleChat = () => {
    if (!offer) return;
    const mockChatId = Date.now();
    navigate(`/chat/${mockChatId}`, {
      state: {
        chat: {
          id: mockChatId,
          user1: currentUser.email,
          user2: offer.ownerEmail,
          other_user_name: offer.ownerName || "Book Seller",
          offer_title: offer.bookTitle,
          offer_id: offer.id
        }
      }
    });
  };

  if (loading) return (
    <div className="h-screen bg-primary flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-16 bg-white/10 rounded mb-4" />
        <div className="w-32 h-2 bg-white/10 rounded" />
      </div>
    </div>
  );
  
  if (!offer) return <div className="h-screen bg-primary flex items-center justify-center text-white">Offer not found <button onClick={() => navigate(-1)} className="ml-4 underline">Go Back</button></div>;

  return (
    <div className="min-h-screen bg-primary text-text-main font-sans pb-24">
      {/* Sticky Header */}
      <motion.div 
        initial={{ y: -100 }} animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 bg-primary/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between md:hidden"
      >
        <button onClick={() => navigate(-1)} className="p-2 text-white/70 hover:text-white">
          <FaArrowLeft />
        </button>
        <span className="font-serif font-bold text-white truncate max-w-[200px]">{offer.bookTitle}</span>
        <div className="w-8" /> {/* Spacer */}
      </motion.div>

      <button onClick={() => navigate(-1)} className="fixed top-6 left-6 z-50 p-4 bg-black/20 backdrop-blur-xl rounded-full text-white hover:bg-black/40 transition-all hidden md:flex items-center justify-center group pointer-events-auto">
         <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* Hero Section */}
      <div className="relative h-[60vh] w-full overflow-hidden">
         <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="absolute inset-0">
            <img src={offer.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80"} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/60 to-primary" />
         </motion.div>
         
         <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 pb-16 max-w-4xl mx-auto">
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="flex gap-2 mb-4">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white border border-white/20
                    ${offer.type === 'sell' ? 'bg-secondary/20' : offer.type === 'exchange' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                    {offer.type}
                 </span>
                 {offer.genre && (
                   <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-text-muted border border-white/10 bg-black/20">
                     {offer.genre}
                   </span>
                 )}
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 leading-tight tracking-tight">
                {offer.bookTitle}
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 font-light flex items-center gap-2">
                by <span className="text-white font-medium border-b border-secondary/50 pb-0.5">{offer.author}</span>
              </p>
            </motion.div>
         </div>
      </div>

      {/* Content Layout */}
      <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-12 relative -mt-10 z-10">
         
         {/* Main Column (Medium Style) */}
         <div className="space-y-8">
            <div className="flex items-center gap-4 text-sm text-text-muted border-b border-white/5 pb-8">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                   {offer.ownerName?.charAt(0) || "U"}
                 </div>
                 <span className="text-white">{offer.ownerName || "Seller"}</span>
               </div>
               <span>•</span>
               <span>{new Date(offer.publishedAt || Date.now()).toLocaleDateString()}</span>
               <span>•</span>
               <span className="flex items-center gap-1"><FaMapMarkerAlt size={10} /> {offer.distance || "Nearby"}</span>
            </div>

            <article className="prose prose-invert prose-lg max-w-none">
               <p className="font-serif text-xl leading-8 md:text-2xl md:leading-9 text-gray-200 first-letter:text-5xl first-letter:font-bold first-letter:text-secondary first-letter:mr-3 first-letter:float-left">
                 {offer.description || "The owner has not provided a detailed description for this book yet. Please contact them for more information regarding the specific condition, edition, or any other details you might need before making a purchase or exchange."}
               </p>
            </article>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-t border-b border-white/5">
               <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white/5">
                 <FaShieldAlt className="text-secondary mb-2" />
                 <span className="text-xs text-text-muted uppercase tracking-wider">Condition</span>
                 <span className="text-white font-semibold">{offer.condition || "Good"}</span>
               </div>
               <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white/5">
                 <FaBook className="text-blue-400 mb-2" />
                 <span className="text-xs text-text-muted uppercase tracking-wider">Format</span>
                 <span className="text-white font-semibold">Hardcover</span>
               </div>
               <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white/5">
                 <FaLeaf className="text-green-400 mb-2" />
                 <span className="text-xs text-text-muted uppercase tracking-wider">Eco-Impact</span>
                 <span className="text-white font-semibold">Saved</span>
               </div>
               <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white/5">
                 <FaClock className="text-purple-400 mb-2" />
                 <span className="text-xs text-text-muted uppercase tracking-wider">Posted</span>
                 <span className="text-white font-semibold">2d ago</span>
               </div>
            </div>
         </div>

         {/* Sidebar / Floating Actions */}
         <div className="relative">
             <div className="sticky top-24 space-y-6">
                <div className="p-6 rounded-3xl bg-primary-light/30 backdrop-blur-xl border border-white/10 shadow-xl">
                   <div className="flex justify-between items-end mb-6">
                     <div>
                       <span className="text-xs text-text-muted uppercase block mb-1">Asking Price</span>
                       <span className="text-4xl font-serif font-bold text-white">
                         {offer.type === 'sell' ? `$${offer.price}` : 'Trade'}
                       </span>
                     </div>
                     {offer.type === 'sell' && <span className="text-sm text-green-400 font-medium">Available</span>}
                   </div>

                   <button 
                     onClick={handleChat}
                     className="w-full py-4 bg-secondary hover:bg-secondary-hover text-white rounded-xl font-bold text-lg shadow-lg shadow-secondary/20 transition-all flex items-center justify-center gap-3 mb-3 group"
                   >
                      <FaComments className="group-hover:scale-110 transition-transform" /> 
                      Message {offer.type === 'sell' ? 'Seller' : 'Owner'}
                   </button>
                   
                   <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                      <FaHeart /> Save for Later
                   </button>
                </div>

                <div className="p-6 rounded-3xl bg-primary-light/10 border border-white/5">
                   <h3 className="text-white font-medium mb-4">Safety Tips</h3>
                   <ul className="space-y-3 text-sm text-text-muted">
                     <li className="flex items-start gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5" />
                       Meet in a public place.
                     </li>
                     <li className="flex items-start gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5" />
                       Check the book condition.
                     </li>
                     <li className="flex items-start gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5" />
                       Pay after you verify.
                     </li>
                   </ul>
                </div>
             </div>
         </div>
      </div>

       {/* Floating Mobile Action Bar */}
       <div className="md:hidden fixed bottom-6 left-4 right-4 bg-primary-light/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex items-center gap-2 z-50 shadow-2xl">
          <div className="pl-4 flex-1">
             <span className="text-xs text-text-muted uppercase block">Price</span>
             <span className="text-xl font-serif font-bold text-white">
                {offer.type === 'sell' ? `$${offer.price}` : 'Trade'}
             </span>
          </div>
          <button onClick={handleChat} className="px-6 py-3 bg-secondary text-white rounded-xl font-bold shadow-lg shadow-secondary/20">
             Contact
          </button>
       </div>
    </div>
  );
}