/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/HomeScreen.tsx - BOOCOZMO FINAL (MODALS & ARTISTIC)
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaExchangeAlt, FaShoppingCart, FaTags, FaInfoCircle, FaTimes, FaComments, FaHeart, FaMapMarkerAlt, FaBook } from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Offer = {
  id: number;
  bookTitle: string;
  author: string;
  type: "sell" | "exchange" | "buy";
  imageUrl: string | null;
  description?: string;
  price: number | null;
  condition?: string;
  ownerName?: string;
  ownerEmail?: string;
  publishedAt?: string;
  distance?: string;
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
};

export default function HomeScreen({ currentUser }: Props) {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const fetchOffers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/offers?limit=50`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });
      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.offers || []);
      
      const processed: Offer[] = raw.map((o: any) => ({
        id: o.id,
        bookTitle: o.bookTitle || "Untitled Book",
        author: o.author || "Unknown Author",
        type: o.type || "sell",
        imageUrl: o.imageUrl,
        description: o.description,
        price: o.price,
        condition: o.condition,
        ownerName: o.ownerName,
        ownerEmail: o.ownerEmail,
        publishedAt: o.publishedAt,
        distance: "Nearby" 
      }));
      setOffers(processed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser.token]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  /* 
    Updated handleContact:
    1. Check if chat exists with this user for this offer (or just user).
    2. If yes, navigate to that chat.
    3. If no, navigate to 'new' chat with params to create one on first message.
  */
  const handleContact = async (offer: Offer) => {
    if (!offer) return;
    
    // Optimistic checking? No, let's fetch real chats to be sure
    try {
       const resp = await fetch(`${API_BASE}/chats?user=${encodeURIComponent(currentUser.email)}`, {
          headers: { "Authorization": `Bearer ${currentUser.token}` }
       });
       if (resp.ok) {
          const chats: any[] = await resp.json();
          // Find existing chat with this owner // AND offer? Optional.
          // For now, let's match by offer_id if possible, or just user.
          // The backend might create separate chats per offer or one per user pair.
          // Let's look for match on offer_id first, then user.
          
          const existingChat = chats.find((c: any) => 
             (c.user1 === offer.ownerEmail || c.user2 === offer.ownerEmail) && 
             (c.offer_id === offer.id)
          );

          if (existingChat) {
             navigate(`/chat/${existingChat.id}`, { state: { chat: existingChat } });
             return;
          }
       }
    } catch (e) { console.error("Error checking chats", e); }

    // If no existing chat found, go to new
    navigate(`/chat/new`, {
      state: {
        chat: {
          id: 0, // 0 signifies new
          user1: currentUser.email,
          user2: offer.ownerEmail || offer.ownerEmail, // Fallback
          other_user_name: offer.ownerName || "Seller",
          offer_title: offer.bookTitle,
          offer_id: offer.id,
          ownerEmail: offer.ownerEmail // redundant but safe
        }
      }
    });
  };

  // Artistic "Poster" Component for Sidebar
  const ArtisticPoster = ({ title, content, color, icon: Icon }: any) => (
    <div className={`p-6 rounded-[2px] mb-6 relative overflow-hidden text-white shadow-md group`} style={{ backgroundColor: color }}>
        <div className="absolute top-0 right-0 p-4 opacity-20 transform scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
           <Icon size={120} />
        </div>
        <div className="relative z-10">
           <h3 className="font-serif font-bold text-xl mb-2 border-b border-white/30 pb-2">{title}</h3>
           <p className="text-sm leading-relaxed font-sans opacity-95">{content}</p>
        </div>
    </div>
  );

  return (
    <div className="py-6 px-4 md:px-0 flex flex-col md:flex-row gap-8 max-w-[1100px] mx-auto min-h-screen">
       
       {/* Modal for Offer Details */}
       <AnimatePresence>
         {selectedOffer && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }}
             onClick={() => setSelectedOffer(null)}
             className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
           >
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               onClick={(e) => e.stopPropagation()}
               className="bg-[#fff] w-full max-w-4xl rounded-[4px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[600px] relative"
             >
                <button onClick={() => setSelectedOffer(null)} className="absolute top-4 right-4 z-10 text-white md:text-[#333] bg-black/20 md:bg-gray-100 p-2 rounded-full hover:bg-black/40 md:hover:bg-gray-200 transition-colors">
                   <FaTimes size={16} />
                </button>

                {/* Left: Image Hero */}
                <div className="w-full md:w-1/2 bg-[#f4f1ea] relative flex items-center justify-center p-8">
                   <img 
                     src={selectedOffer.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"} 
                     className="max-h-full max-w-full shadow-lg object-contain" 
                   />
                   <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded text-xs font-bold text-[#382110] shadow-sm uppercase tracking-wide">
                      {selectedOffer.type}
                   </div>
                </div>

                {/* Right: Details */}
                <div className="w-full md:w-1/2 p-8 flex flex-col bg-white overflow-y-auto">
                   <div className="mb-6">
                      <h2 className="font-serif font-bold text-3xl text-[#382110] mb-2 leading-tight">{selectedOffer.bookTitle}</h2>
                      <p className="text-lg text-[#555]">by <span className="font-bold underline decoration-[#382110]">{selectedOffer.author}</span></p>
                   </div>

                   <div className="flex gap-4 mb-6 text-sm text-[#555] border-y border-[#eee] py-4">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 bg-[#382110] text-white rounded-full flex items-center justify-center font-bold text-xs">
                            {selectedOffer.ownerName?.charAt(0) || "U"}
                         </div>
                         <span className="font-bold">{selectedOffer.ownerName || "User"}</span>
                      </div>
                      <div className="border-l border-[#eee] pl-4 flex items-center gap-2">
                         <FaMapMarkerAlt className="text-[#999]" />
                         {selectedOffer.distance}
                      </div>
                   </div>

                   <div className="prose prose-sm prose-stone flex-1 mb-6">
                      <p className="font-serif leading-relaxed text-[#333]">
                         {selectedOffer.description || "No description provided. Contact the seller for more details about condition and edition."}
                      </p>
                      <div className="mt-4 flex gap-2">
                         {selectedOffer.condition && <span className="px-2 py-1 bg-[#f4f1ea] text-[#382110] text-xs font-bold rounded">{selectedOffer.condition}</span>}
                      </div>
                   </div>

                   <div className="mt-auto pt-6 border-t border-[#eee]">
                      <div className="flex items-end justify-between mb-4">
                         <span className="text-xs uppercase text-[#777] font-bold">Price</span>
                         <span className="text-3xl font-serif font-bold text-[#d37e2f]">
                            {selectedOffer.price ? `$${selectedOffer.price}` : selectedOffer.type === 'exchange' ? 'Trade' : 'ISO'}
                         </span>
                      </div>
                      <button 
                         onClick={() => handleContact(selectedOffer)}
                         className="w-full bg-[#409d69] hover:bg-[#358759] text-white font-bold py-3 rounded-[3px] shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                      >
                         <FaComments /> Contact Seller
                      </button>
                   </div>
                </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* Main Feed */}
       <div className="flex-1 md:pr-6">
          
          {/* Mobile Artistic Grid (Stickers) */}
          <div className="md:hidden grid grid-cols-2 gap-2 mb-8">
             <div className="bg-[#382110] p-4 rounded-[2px] text-white flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
                <FaExchangeAlt className="absolute -right-2 -top-2 opacity-10 text-[80px]" />
                <h3 className="font-serif font-bold text-lg leading-tight relative z-10">Circulate Stories</h3>
                <p className="text-[10px] opacity-90 relative z-10 leading-snug">Pass your beloved books to a new neighbor.</p>
             </div>
             <div className="flex flex-col gap-2">
                <div className="bg-[#00635d] p-3 rounded-[2px] text-white flex-1 relative overflow-hidden">
                   <FaBook className="absolute -right-2 -bottom-2 opacity-10 text-[50px]" />
                   <h3 className="font-serif font-bold text-sm mb-1 relative z-10">Hidden Gems</h3>
                   <p className="text-[9px] opacity-90 relative z-10">Find rare editions nearby.</p>
                </div>
                <div className="bg-[#d37e2f] p-3 rounded-[2px] text-white flex-1 relative overflow-hidden">
                   <FaHeart className="absolute -right-2 -bottom-2 opacity-10 text-[50px]" />
                   <h3 className="font-serif font-bold text-sm mb-1 relative z-10">Join Movement</h3>
                   <p className="text-[9px] opacity-90 relative z-10">Save trees & money.</p>
                </div>
             </div>
          </div>

          {/* Info Banner */}
          <div className="mb-8 bg-[#fff] border-l-4 border-[#382110] p-4 shadow-sm flex items-start gap-4">
             <div className="text-[#382110] mt-1"><FaInfoCircle size={20} /></div>
             <div>
                <h2 className="font-serif font-bold text-[#382110] text-lg mb-1">Make Reading Sustainable</h2>
                <p className="text-sm text-[#555]">Boocozmo connects you with local book lovers. Exchange stories, rescue books, and build a community.</p>
             </div>
          </div>

          <div className="mb-6 border-b border-[#d8d8d8] pb-2 flex justify-between items-end">
             <h2 className="text-[#382110] font-bold text-[16px] font-sans uppercase tracking-widest">Recent Community Listings</h2>
          </div>

          {loading ? (
             <div className="flex justify-center p-12 text-[#999]">Loading community...</div>
          ) : (
             <div className="flex flex-wrap gap-x-4 md:gap-x-6 gap-y-8 md:gap-y-10 justify-between md:justify-start">
                {offers.length > 0 ? offers.map(offer => (
                   <div key={offer.id} className="w-[48%] md:w-[155px] flex flex-col gap-2 group">
                      <div 
                        onClick={() => setSelectedOffer(offer)}
                        className="w-full h-[200px] md:h-[230px] relative shadow-md cursor-pointer overflow-hidden border border-[#eee]"
                      >
                         <img src={offer.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                         <div className="absolute top-2 right-2">
                             <span className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 text-white shadow-sm
                               ${offer.type === 'sell' ? 'bg-[#d37e2f]' : offer.type === 'exchange' ? 'bg-[#00635d]' : 'bg-[#764d91]'}`}>
                               {offer.type.toUpperCase()}
                             </span>
                         </div>
                      </div>
                      <div>
                         <h3 onClick={() => setSelectedOffer(offer)} className="font-serif font-bold text-[#382110] text-[13px] md:text-[14px] leading-tight cursor-pointer hover:underline line-clamp-2 min-h-[36px]">
                            {offer.bookTitle}
                         </h3>
                         <div className="text-xs text-[#555] mb-2 truncate">by {offer.author}</div>
                         <button 
                           onClick={() => setSelectedOffer(offer)}
                           className="w-full bg-[#f4f1ea] hover:bg-[#e9e6dd] text-[#382110] text-xs font-bold py-1.5 border border-[#d8d8d8] rounded-[2px]"
                         >
                            View Details
                         </button>
                      </div>
                   </div>
                )) : <div className="text-[#777] italic">No offers found.</div>}
                
                {/* Spacers for flex justification on mobile 2-col */}
                <div className="w-[48%] md:hidden h-0" />
             </div>
          )}
       </div>

       {/* Artistic Sidebar (Desktop) */}
       <aside className="hidden md:block w-[300px] shrink-0">
          <ArtisticPoster 
             title="Circulate Stories" 
             content="Pass your beloved books to a new neighbor. Every exchange builds a stronger, more connected society." 
             color="#382110"
             icon={FaExchangeAlt}
          />
          <ArtisticPoster 
             title="Discover Hidden Gems" 
             content="Find rare editions and local favorites right in your neighborhood at prices you'll love." 
             color="#00635d"
             icon={FaBook}
          />
          <ArtisticPoster 
             title="Join the Movement" 
             content="Be part of the sustainable reading revolution. Save trees, save money, and make friends." 
             color="#d37e2f"
             icon={FaHeart}
          />

          <div className="mt-8 border-t border-[#d8d8d8] pt-6">
             <h4 className="font-bold text-[#382110] mb-4 uppercase text-xs tracking-widest">Marketplace Utils</h4>
             <ul className="space-y-2 text-sm text-[#00635d] font-bold">
                <li><a href="/offer" className="hover:underline flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#00635d] rounded-full"></div> Post a Book for Sale</a></li>
                <li><a href="/offer" className="hover:underline flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#00635d] rounded-full"></div> Request a Book (ISO)</a></li>
             </ul>
          </div>
       </aside>
    </div>
  );
}