/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/StoreDetailScreen.tsx - PREMIUM THEME (FULLY FIXED)
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft, FaComments, FaBook, FaFolder, FaUser,
  FaMapMarkerAlt, FaCalendarAlt, FaTimes
} from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Offer = {
  id: number;
  bookTitle: string;
  author: string;
  type: "sell" | "exchange" | "buy";
  imageUrl: string | null;
  imageBase64: string | null;
  price: number | null;
  condition?: string;
  description?: string;
  visibility: "public" | "private";
};

type Store = {
  id: number;
  name: string;
  ownerEmail: string;
  ownerName?: string;
  ownerPhoto?: string;
  created_at: string;
  visibility: "public" | "private";
  location?: string;
  offerIds?: number[];
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
};

export default function StoreDetailScreen({ currentUser }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const storeFromState = location.state?.store as Store | undefined;

  const [store, setStore] = useState<Store | null>(storeFromState || null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const fetchStoreAndOffers = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("Invalid store ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch store details
      const storeResponse = await fetch(`${API_BASE}/stores/${id}`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });

      if (!storeResponse.ok) {
        const errData = await storeResponse.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to load store (${storeResponse.status})`);
      }

      const storeData = await storeResponse.json();

      // 2. Fetch owner profile (for name/photo)
      let ownerName = storeData.ownerName;
      let ownerPhoto = storeData.ownerPhoto;

      if (storeData.ownerEmail && !ownerName) {
        try {
          const profileResp = await fetch(`${API_BASE}/profile/${storeData.ownerEmail}`, {
            headers: { "Authorization": `Bearer ${currentUser.token}` }
          });
          if (profileResp.ok) {
            const profileData = await profileResp.json();
            ownerName = profileData.name || "Store Owner";
            ownerPhoto = profileData.profilePhotoURL || profileData.photo || profileData.profileImageUrl;
          }
        } catch (profileErr) {
          console.warn("Owner profile fetch failed:", profileErr);
        }
      }

      // 3. Fetch offers for this store (using query param)
      // IMPORTANT: Adjust "?store_id=" to match your backend's actual query param
      // Common alternatives: ?storeId=, ?store=, ?store_id=
      const offersResponse = await fetch(`${API_BASE}/offers-by-store?store_id=${id}`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });

      let offersData = [];
      if (offersResponse.ok) {
        const data = await offersResponse.json();
        offersData = data.offers || data || [];
      } else {
        console.warn(`Offers fetch for store ${id} returned ${offersResponse.status}`);
      }

      // 4. Process store
      setStore({
        id: storeData.id,
        name: storeData.name || "Unnamed Store",
        ownerEmail: storeData.ownerEmail,
        ownerName: ownerName || "Store Owner",
        ownerPhoto,
        created_at: storeData.created_at || new Date().toISOString(),
        visibility: storeData.visibility || "public",
        location: storeData.location,
        offerIds: storeData.offerIds || offersData.map((o: any) => o.id)
      });

      // 5. Process offers (filter public only)
      const processedOffers = offersData
        .filter((o: any) => o.visibility === "public" || !o.visibility)
        .map((o: any) => ({
          id: o.id,
          bookTitle: o.bookTitle || "Untitled Book",
          author: o.author || "Unknown Author",
          type: o.type || "sell",
          imageUrl: o.imageUrl,
          imageBase64: o.imageBase64,
          price: o.price ? parseFloat(o.price) : null,
          condition: o.condition,
          description: o.description,
          visibility: o.visibility || "public",
        }));

      setOffers(processedOffers);

    } catch (err: any) {
      console.error("Store & offers fetch error:", err);
      setError(err.message || "Failed to load store details");
      setStore(null);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [id, currentUser.token]);

  useEffect(() => {
    fetchStoreAndOffers();
  }, [fetchStoreAndOffers]);

  const handleContact = async () => {
    if (!store) return;

    try {
      // Check for existing chat
      const resp = await fetch(`${API_BASE}/chats?user=${encodeURIComponent(currentUser.email)}`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });

      if (resp.ok) {
        const chats = await resp.json();
        const existing = chats.find((c: any) =>
          c.user1 === store.ownerEmail || c.user2 === store.ownerEmail
        );

        if (existing) {
          navigate(`/chat/${existing.id}`, { state: { chat: existing } });
          return;
        }
      }
    } catch (e) {
      console.warn("Chat check failed:", e);
    }

    // Create new chat
    navigate(`/chat/new`, {
      state: {
        chat: {
          id: 0,
          user1: currentUser.email,
          user2: store.ownerEmail,
          other_user_name: store.ownerName || "Store Owner",
          offer_title: `Inquiry about ${store.name}`,
          ownerEmail: store.ownerEmail
        }
      }
    });
  };

  const getImageSource = (offer: Offer) => {
    if (offer.imageUrl) return offer.imageUrl;
    if (offer.imageBase64) {
      return offer.imageBase64.startsWith("data:")
        ? offer.imageBase64
        : `data:image/jpeg;base64,${offer.imageBase64}`;
    }
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80";
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#f4f1ea] flex items-center justify-center">
        <div className="text-[#382110] text-lg">Loading store...</div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="h-screen bg-[#f4f1ea] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h2 className="text-2xl font-bold text-[#382110] mb-4">Store Not Found</h2>
          <p className="text-[#555] mb-6">{error || "This store doesn't exist or is private."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-[#382110] text-white rounded-lg hover:bg-[#2a180c] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea]">
      {/* Header */}
      <header className="bg-white border-b border-[#d8d8d8] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1100px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-[#382110] hover:bg-[#f4f1ea] rounded-full transition-colors"
            >
              <FaArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#382110]">{store.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-[#777]">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-[#382110]/10 border border-[#eee] flex-shrink-0">
                    {store.ownerPhoto ? (
                      <img src={store.ownerPhoto} className="w-full h-full object-cover" alt={store.ownerName} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#382110]">
                        {store.ownerName?.charAt(0) || "O"}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-[#382110]">{store.ownerName || "Store Owner"}</span>
                </div>
                {store.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt size={12} />
                      {store.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleContact}
            className="px-6 py-2.5 bg-[#409d69] hover:bg-[#358759] text-white rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            <FaComments />
            Contact Store
          </button>
        </div>
      </header>

      {/* Store Info Banner */}
      <div className="bg-white border-b border-[#d8d8d8]">
        <div className="max-w-[1100px] mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center gap-6 text-sm text-[#555]">
            <div className="flex items-center gap-2">
              <FaFolder className="text-[#00635d]" />
              <span className="font-medium">{offers.length} {offers.length === 1 ? 'book' : 'books'} available</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-[#777]" />
              <span>Created {new Date(store.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                store.visibility === "public"
                  ? "bg-[#e0f2fe] text-[#00635d]"
                  : "bg-[#f3f4f6] text-[#777]"
              }`}>
                {store.visibility === "public" ? "Public Collection" : "Private Collection"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <main className="max-w-[1100px] mx-auto px-4 py-8">
        {offers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-[#d8d8d8]">
            <FaBook className="mx-auto text-4xl text-[#999] mb-4" />
            <p className="text-[#777] text-lg font-medium">No public books available yet</p>
            <p className="text-[#999] text-sm mt-2">This store doesn't have any public books at the moment.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#382110] mb-1">Available Books</h2>
              <p className="text-sm text-[#777]">{offers.length} {offers.length === 1 ? 'book' : 'books'} in this collection</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {offers.map((offer) => (
                <motion.div
                  key={offer.id}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedOffer(offer)}
                  className="bg-white rounded-xl overflow-hidden border border-[#eee] hover:border-[#382110]/30 transition-all shadow-sm cursor-pointer group"
                >
                  <div className="aspect-[2/3] relative overflow-hidden">
                    <img
                      src={getImageSource(offer)}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      alt={offer.bookTitle}
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm text-white ${
                        offer.type === 'sell' ? 'bg-[#d37e2f]' :
                        offer.type === 'exchange' ? 'bg-[#00635d]' :
                        'bg-[#764d91]'
                      }`}>
                        {offer.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-[#382110] text-sm leading-tight line-clamp-2 mb-1">
                      {offer.bookTitle}
                    </h3>
                    <p className="text-xs text-[#777] truncate mb-2">by {offer.author}</p>
                    {offer.price && (
                      <p className="text-sm font-semibold text-[#d37e2f]">PKR {offer.price}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Offer Detail Modal */}
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
              className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[600px] relative"
            >
              <button
                onClick={() => setSelectedOffer(null)}
                className="absolute top-4 right-4 z-10 text-[#333] bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <FaTimes size={16} />
              </button>

              {/* Left: Image */}
              <div className="w-full md:w-1/2 bg-[#f4f1ea] relative flex items-center justify-center p-8">
                <img
                  src={getImageSource(selectedOffer)}
                  className="max-h-full max-w-full shadow-lg object-contain"
                  alt={selectedOffer.bookTitle}
                />
              </div>

              {/* Right: Details */}
              <div className="w-full md:w-1/2 p-8 flex flex-col bg-white overflow-y-auto">
                <div className="mb-6">
                  <h2 className="font-bold text-3xl text-[#382110] mb-2 leading-tight">
                    {selectedOffer.bookTitle}
                  </h2>
                  <p className="text-lg text-[#555]">
                    by <span className="font-semibold">{selectedOffer.author}</span>
                  </p>
                </div>

                <div className="prose prose-sm prose-stone flex-1 mb-6">
                  <p className="leading-relaxed text-[#333]">
                    {selectedOffer.description || "No description provided. Contact the store owner for more details."}
                  </p>
                  {selectedOffer.condition && (
                    <div className="mt-4">
                      <span className="px-2 py-1 bg-[#f4f1ea] text-[#382110] text-xs font-bold rounded">
                        {selectedOffer.condition}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-6 border-t border-[#eee]">
                  <div className="flex items-end justify-between mb-4">
                    <span className="text-xs uppercase text-[#777] font-semibold">Price</span>
                    <span className="text-3xl font-bold text-[#d37e2f]">
                      {selectedOffer.price ? `PKR ${selectedOffer.price}` : selectedOffer.type === 'exchange' ? 'Trade' : 'Contact for Price'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedOffer(null);
                      handleContact();
                    }}
                    className="w-full bg-[#409d69] hover:bg-[#358759] text-white font-semibold py-3 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                  >
                    <FaComments /> Contact Store Owner
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}