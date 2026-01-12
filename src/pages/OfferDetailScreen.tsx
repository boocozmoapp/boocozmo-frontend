/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/OfferDetailScreen.tsx - GOODREADS THEME + MEDIUM STYLE
import { useEffect, useState } from "react";
import { 
  FaArrowLeft, FaMapMarkerAlt, FaComments, FaHeart, 
  FaBook, FaLeaf, FaClock, FaShieldAlt, FaBookmark
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
  wishlist: string[];
  toggleWishlist: (title: string) => void;
};

export default function OfferDetailScreen({ currentUser, wishlist, toggleWishlist }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 1.05]);

  const isInWishlist = offer ? wishlist.includes(offer.bookTitle) : false;

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
    navigate(`/chat/new`, {
      state: {
        chat: {
          id: 0,
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
    <div className="h-screen bg-[#f4f1ea] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-16 bg-[#ddd] rounded mb-4" />
        <div className="w-32 h-2 bg-[#ddd] rounded" />
      </div>
    </div>
  );
  
  if (!offer) return (
    <div className="h-screen bg-[#f4f1ea] flex items-center justify-center text-[#382110]">
      Offer not found 
      <button onClick={() => navigate(-1)} className="ml-4 underline text-[#00635d]">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#181818] font-sans pb-24">
      {/* Sticky Header (Mobile) */}
      <motion.div 
        initial={{ y: -100 }} animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 bg-[#f4f1ea]/95 backdrop-blur-sm border-b border-[#d8d8d8] px-4 py-3 flex items-center justify-between md:hidden"
      >
        <button onClick={() => navigate(-1)} className="p-2 text-[#382110] hover:bg-black/5 rounded-full">
          <FaArrowLeft />
        </button>
        <span className="font-serif font-bold text-[#382110] truncate max-w-[200px]">{offer.bookTitle}</span>
        <div className="w-8" /> 
      </motion.div>

      {/* Hero Section */}
      <div className="relative h-[50vh] w-full overflow-hidden bg-[#f4f1ea]">
         <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="absolute inset-0">
            <img src={offer.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80"} className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#f9f9f9] via-transparent to-transparent " />
         </motion.div>
         
         {/* Desktop Back Button */}
         <button onClick={() => navigate(-1)} className="absolute top-6 left-6 z-50 p-3 bg-white/80 backdrop-blur-sm rounded-full text-[#382110] shadow-md hover:bg-white transition-all hidden md:flex items-center justify-center group">
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
         </button>
      </div>

      {/* Content Layout */}
      <div className="max-w-[1000px] mx-auto px-6 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-12 relative -mt-32 z-10">
         
         {/* Main Column */}
         <div className="space-y-8 bg-white p-6 md:p-8 rounded shadow-sm border border-[#e8e8e8]">
            <div>
               <div className="flex gap-2 mb-3">
                  <span className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white rounded-[2px]
                     ${offer.type === 'sell' ? 'bg-[#d37e2f]' : offer.type === 'exchange' ? 'bg-[#00635d]' : 'bg-[#764d91]'}`}>
                     {offer.type}
                  </span>
                  {offer.genre && (
                    <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#555] bg-[#f4f1ea] rounded-[2px]">
                      {offer.genre}
                    </span>
                  )}
               </div>
               
               <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#382110] mb-2 leading-tight">
                 {offer.bookTitle}
               </h1>
               <p className="text-lg text-[#555] font-serif">
                 by <span className="text-[#382110] font-bold border-b border-[#382110] pb-0.5 cursor-pointer hover:text-[#00635d] hover:border-[#00635d] transition-colors">{offer.author}</span>
               </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-[#777] border-y border-[#eee] py-4">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-[#f4f1ea] flex items-center justify-center text-[#382110] font-bold text-xs border border-[#ddd]">
                   {offer.ownerName?.charAt(0) || "U"}
                 </div>
                 <span className="text-[#333] font-bold hover:underline cursor-pointer">{offer.ownerName || "Seller"}</span>
               </div>
               <span>•</span>
               <span>{new Date(offer.publishedAt || Date.now()).toLocaleDateString()}</span>
               <span>•</span>
               <span className="flex items-center gap-1"><FaMapMarkerAlt /> {offer.distance || "Nearby"}</span>
            </div>

            <article className="prose prose-stone prose-lg max-w-none text-[#181818]">
               <p className="font-serif leading-8 text-[#333]">
                 {offer.description || "The owner has not provided a detailed description for this book yet. Please contact them for more information regarding the specific condition, edition, or any other details you might need."}
               </p>
            </article>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
               <div className="flex flex-col gap-1 p-3 rounded bg-[#f9f9f9] border border-[#eee]">
                 <FaShieldAlt className="text-[#d37e2f] mb-1" />
                 <span className="text-[10px] text-[#777] uppercase tracking-wider">Condition</span>
                 <span className="text-[#333] font-bold">{offer.condition || "Good"}</span>
               </div>
               <div className="flex flex-col gap-1 p-3 rounded bg-[#f9f9f9] border border-[#eee]">
                 <FaBook className="text-[#00635d] mb-1" />
                 <span className="text-[10px] text-[#777] uppercase tracking-wider">Format</span>
                 <span className="text-[#333] font-bold">Hardcover</span>
               </div>
               <div className="flex flex-col gap-1 p-3 rounded bg-[#f9f9f9] border border-[#eee]">
                 <div className="flex items-center gap-1 mb-1">
                    <FaLeaf className="text-[#409d69]" />
                    <span className="text-[10px] text-[#409d69] font-bold uppercase tracking-widest">+1.5 XP</span>
                 </div>
                 <span className="text-[10px] text-[#777] uppercase tracking-wider">Eco-Impact</span>
                 <span className="text-[#333] font-bold">Rescued</span>
               </div>
               <div className="flex flex-col gap-1 p-3 rounded bg-[#f9f9f9] border border-[#eee]">
                 <FaClock className="text-[#764d91] mb-1" />
                 <span className="text-[10px] text-[#777] uppercase tracking-wider">Posted</span>
                 <span className="text-[#333] font-bold">Just Now</span>
               </div>
            </div>
         </div>

         {/* Sidebar Actions */}
         <div className="relative">
             <div className="sticky top-24 space-y-4">
                <div className="p-6 rounded bg-white border border-[#d8d8d8] shadow-sm">
                   <div className="flex justify-between items-end mb-6 border-b border-[#eee] pb-4">
                     <div>
                       <span className="text-[11px] text-[#777] uppercase block mb-1">Asking Price</span>
                       <span className="text-3xl font-serif font-bold text-[#d37e2f]">
                         {offer.type === 'sell' ? `$${offer.price}` : 'Trade'}
                       </span>
                     </div>
                   </div>

                   {offer.ownerEmail === currentUser.email ? (
                      <div className="w-full py-3 bg-[#f4f1ea] border border-[#d8d8d8] text-[#382110] rounded-[3px] font-bold text-center mb-3">
                        📚 This is your offer
                      </div>
                   ) : (
                     <button 
                       onClick={handleChat}
                       className="w-full py-3 bg-[#409d69] hover:bg-[#358759] text-white rounded-[3px] font-bold text-md shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 mb-3"
                     >
                        <FaComments /> 
                        Message {offer.type === 'sell' ? 'Seller' : 'Owner'}
                     </button>
                   )}
                   
                   <button 
                      onClick={() => toggleWishlist(offer.bookTitle)}
                      className={`w-full py-3 rounded-[3px] font-bold border transition-all flex items-center justify-center gap-2
                         ${isInWishlist 
                            ? 'bg-[#382110] text-white border-[#382110]' 
                            : 'bg-white text-[#382110] border-[#d8d8d8] hover:bg-[#f4f1ea]'}`}
                   >
                      {isInWishlist ? <FaBookmark /> : <FaHeart />}
                      {isInWishlist ? 'Tracking in Wishlist' : 'Add to Wishlist'}
                   </button>
                   <p className="text-[9px] text-center text-[#999] mt-3 uppercase tracking-widest">Ignite the wildfire. Swap, don't buy.</p>
                </div>

                <div className="p-4 rounded bg-[#f4f1ea] border border-[#d8d8d8]">
                   <h3 className="text-[#382110] font-bold text-sm mb-2">Safety Tips</h3>
                   <ul className="space-y-2 text-xs text-[#555]">
                     <li className="flex items-start gap-2">• Meet in a public place.</li>
                     <li className="flex items-start gap-2">• Check the book condition.</li>
                     <li className="flex items-start gap-2">• Pay after you verify.</li>
                   </ul>
                </div>
             </div>
         </div>
      </div>

       {/* Floating Mobile Action Bar */}
       <div className="md:hidden fixed bottom-16 left-0 right-0 bg-[#f4f1ea] border-t border-[#d8d8d8] p-3 flex items-center justify-between z-40 px-4 shadow-2xl">
          <div>
             <span className="text-xs text-[#777] block">Price</span>
             <span className="text-xl font-serif font-bold text-[#d37e2f]">
                {offer.type === 'sell' ? `$${offer.price}` : 'Trade'}
             </span>
          </div>
          <div className="flex gap-2">
             <button onClick={() => toggleWishlist(offer.bookTitle)} className={`p-2.5 rounded ${isInWishlist ? 'bg-[#382110] text-white' : 'bg-white border border-[#d8d8d8]'}`}><FaBookmark /></button>
             {offer.ownerEmail === currentUser.email ? (
                <div className="bg-[#f4f1ea] px-4 py-2.5 rounded-[3px] font-bold text-[#382110] text-sm">
                   Your Listing
                </div>
             ) : (
                <button onClick={handleChat} className="px-8 py-2.5 bg-[#409d69] text-white rounded-[3px] font-bold shadow-sm">
                   Contact
                </button>
             )}
          </div>
       </div>
    </div>
  );
}
