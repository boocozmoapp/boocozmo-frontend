/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/DiscoverScreen.tsx - COMPLETELY FIXED SEARCH
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaSearch, FaMapMarkerAlt, FaTimes, FaArrowLeft, FaFilter, 
  FaComments, FaHeart, FaBookmark, FaStore, FaFolder, FaLocationArrow,
  FaSync, FaUser, FaBook, FaTag, FaUsers, FaBookOpen, FaHome
} from "react-icons/fa";

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
  ownerName: string;
  ownerEmail: string;
  ownerPhoto?: string;
  ownerBadges: string[];
  publishedAt?: string;
  latitude?: number;
  longitude?: number;
  distance?: string;
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
  bookCount?: number;
  latitude?: number;
  longitude?: number;
};

type User = {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string;
};

type Props = {
  currentUser: { email: string; name: string; id: string; token: string };
  wishlist?: string[];
  toggleWishlist?: (title: string) => void;
};

// Haversine Distance Helper
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function DiscoverScreen({ currentUser, wishlist = [], toggleWishlist }: Props) {
  const navigate = useNavigate();
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [discoveryFeed, setDiscoveryFeed] = useState<Offer[]>([]);
  const [storeResults, setStoreResults] = useState<Store[]>([]);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showStores, setShowStores] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchType, setSearchType] = useState<"all" | "books" | "stores" | "users">("all");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const getImageSource = (offer: any) => {
    const url = offer.imageUrl || offer.imageurl || offer.imageBase64;
    if (url) {
      if (typeof url === "string") {
        if (url.startsWith("http")) return url;
        if (url.startsWith("data:")) return url;
        return `data:image/jpeg;base64,${url}`;
      }
    }
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop&q=80";
  };

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/profile/${currentUser.email}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.latitude && data.longitude) {
          setUserLocation({ lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) });
        }
      }
    } catch (e) {
      console.error("Failed to fetch profile", e);
    }
  }, [currentUser]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch offers
      const offersResponse = await fetch(`${API_BASE}/offers?limit=300`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      const offersData = await offersResponse.json();
      const rawOffers = Array.isArray(offersData) ? offersData : (offersData.offers || []);
      
      // Fetch stores
      const storesResponse = await fetch(`${API_BASE}/public-stores?limit=100`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      
      // Fetch users
      const usersResponse = await fetch(`${API_BASE}/get-usernames?limit=100`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });

      // Process offers
      const uniqueEmails = [...new Set(rawOffers.map((o: any) => o.owneremail || o.ownerEmail).filter(Boolean))];
      const profileCache: Record<string, { name: string; photo?: string; badges?: string[] }> = {};

      // Fetch profiles for offers
      await Promise.all(
        uniqueEmails.map(async (email) => {
          try {
            const pResp = await fetch(`${API_BASE}/profile/${email}`, {
              headers: { Authorization: `Bearer ${currentUser.token}` }
            });
            if (pResp.ok) {
              const pData = await pResp.json();
              let badges: string[] = [];
              if (pData.badges) {
                badges = typeof pData.badges === "string" ? JSON.parse(pData.badges) : pData.badges;
              }
              if (!badges.length && pData.offersPosted) {
                if (pData.offersPosted >= 20) badges.push("Verified");
                else if (pData.offersPosted >= 3) badges.push("Contributor");
              }
              profileCache[email as string] = {
                name: pData.name || "Neighbor",
                photo: pData.profilePhoto || pData.profilePhotoURL || pData.photo || pData.profileImageUrl,
                badges
              };
            }
          } catch (err) { console.error("Profile fetch error", err); }
        })
      );

      // Process offers with profile data
      const processedOffers: Offer[] = rawOffers.map((o: any) => {
        const ownerEmail = o.owneremail || o.ownerEmail;
        return {
          id: o.id,
          bookTitle: o.booktitle || o.bookTitle || "Untitled",
          author: o.author || "Unknown",
          type: o.type || "sell",
          imageUrl: o.imageurl || o.imageUrl,
          description: o.description,
          price: o.price,
          condition: o.condition,
          ownerName: profileCache[ownerEmail]?.name || o.ownername || "Neighbor",
          ownerEmail: ownerEmail,
          ownerPhoto: profileCache[ownerEmail]?.photo || o.ownerphoto,
          ownerBadges: profileCache[ownerEmail]?.badges || [],
          publishedAt: o.publishedat || o.publishedAt,
          latitude: o.latitude,
          longitude: o.longitude
        };
      });

      setAllOffers(processedOffers);
      setDiscoveryFeed([...processedOffers].sort(() => Math.random() - 0.5));

      // Process stores
      if (storesResponse.ok) {
        const storesData = await storesResponse.json();
        const stores = storesData.stores || storesData || [];
        
        const processedStores: Store[] = stores.map((store: any) => {
          let lat = null;
          let lng = null;
          
          if (store.latitude && store.longitude) {
            lat = parseFloat(store.latitude);
            lng = parseFloat(store.longitude);
          } else if (store.location) {
            const match = store.location.match(/Lat:\s*(-?\d+(\.\d+)?),\s*Lng:\s*(-?\d+(\.\d+)?)/);
            if (match) {
              lat = parseFloat(match[1]);
              lng = parseFloat(match[3]);
            }
          }
          
          return {
            id: store.id,
            name: store.name,
            ownerEmail: store.ownerEmail,
            ownerName: store.ownerName || "Community Member",
            ownerPhoto: store.ownerPhoto,
            created_at: store.created_at,
            visibility: store.visibility || "public",
            location: store.location,
            offerIds: store.offerIds || [],
            bookCount: store.bookCount || store.offerIds?.length || 0,
            latitude: lat,
            longitude: lng
          };
        });
        
        setAllStores(processedStores);
      }

      // Process users
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const users = Array.isArray(usersData) ? usersData : [];
        
        const processedUsers: User[] = users.map((user: any) => ({
          id: user.id?.toString() || `user-${user.email}`,
          name: user.name || user.email?.split('@')[0] || "User",
          email: user.email,
          profilePhoto: user.profilePhoto || user.profilephoto
        }));
        
        setAllUsers(processedUsers);
      }
    } catch (e) {
      console.error("Failed to fetch discovery data", e);
    } finally {
      setLoading(false);
    }
  }, [currentUser.token]);

  useEffect(() => {
    fetchProfile();
    fetchAllData();
    
    // Load search history
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, [fetchProfile, fetchAllData]);

  const isWishlisted = (title: string) => wishlist?.includes(title);

  // Search backend offers with better error handling
  const searchBackendOffers = async (query: string): Promise<Offer[]> => {
    try {
      const response = await fetch(`${API_BASE}/search-offers?query=${encodeURIComponent(query)}&limit=100`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      
      if (!response.ok) {
        // If backend search fails, return empty array (we'll fallback to local search)
        console.warn("Backend search failed, falling back to local search");
        return [];
      }
      
      const data = await response.json();
      const raw = data.offers || [];
      
      // Process the search results
      const processed: Offer[] = raw.map((o: any) => ({
        id: o.id,
        bookTitle: o.booktitle || o.bookTitle || "Untitled",
        author: o.author || "Unknown",
        type: o.type || "sell",
        imageUrl: o.imageurl || o.imageUrl,
        description: o.description,
        price: o.price,
        condition: o.condition,
        ownerName: o.ownername || "Neighbor",
        ownerEmail: o.owneremail || o.ownerEmail,
        ownerPhoto: o.ownerphoto || null,
        ownerBadges: [],
        publishedAt: o.publishedat || o.publishedAt,
        latitude: o.latitude,
        longitude: o.longitude
      }));
      
      return processed;
    } catch (error) {
      console.warn("Backend search error, falling back to local search:", error);
      return []; // Return empty array to trigger fallback
    }
  };

  const searchBackendStores = async (query: string): Promise<Store[]> => {
    try {
      // Since we don't have a dedicated store search endpoint, search locally
      const filtered = allStores.filter(store => 
        store.name?.toLowerCase().includes(query.toLowerCase()) ||
        store.ownerName?.toLowerCase().includes(query.toLowerCase()) ||
        store.location?.toLowerCase().includes(query.toLowerCase())
      );
      
      // Sort stores: first by name match, then by owner name match
      const sortedStores = filtered.sort((a, b) => {
        const queryLower = query.toLowerCase();
        const aNameMatch = a.name?.toLowerCase().includes(queryLower);
        const bNameMatch = b.name?.toLowerCase().includes(queryLower);
        
        // Store name matches first
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // Then check owner name matches
        const aOwnerMatch = a.ownerName?.toLowerCase().includes(queryLower);
        const bOwnerMatch = b.ownerName?.toLowerCase().includes(queryLower);
        
        if (aOwnerMatch && !bOwnerMatch) return -1;
        if (!aOwnerMatch && bOwnerMatch) return 1;
        
        // Finally sort alphabetically by store name
        return (a.name || "").localeCompare(b.name || "");
      });
      
      return sortedStores;
    } catch (error) {
      console.error("Store search error:", error);
      return [];
    }
  };

  const searchBackendUsers = async (query: string): Promise<User[]> => {
    try {
      const response = await fetch(`${API_BASE}/get-usernames?query=${encodeURIComponent(query)}&limit=20`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      
      if (!response.ok) {
        // Fallback to local user search
        const filteredUsers = allUsers.filter(user => 
          user.name?.toLowerCase().includes(query.toLowerCase()) ||
          user.email?.toLowerCase().includes(query.toLowerCase())
        );
        
        // Sort users: first by name match, then by email match
        const sortedUsers = filteredUsers.sort((a, b) => {
          const queryLower = query.toLowerCase();
          const aNameMatch = a.name?.toLowerCase().includes(queryLower);
          const bNameMatch = b.name?.toLowerCase().includes(queryLower);
          
          // Name matches first
          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;
          
          // Then check email matches
          const aEmailMatch = a.email?.toLowerCase().includes(queryLower);
          const bEmailMatch = b.email?.toLowerCase().includes(queryLower);
          
          if (aEmailMatch && !bEmailMatch) return -1;
          if (!aEmailMatch && bEmailMatch) return 1;
          
          // Finally sort alphabetically by name
          return (a.name || "").localeCompare(b.name || "");
        });
        
        return sortedUsers;
      }
      
      const usersData = await response.json();
      const users = Array.isArray(usersData) ? usersData : [];
      
      const processedUsers: User[] = users.map((user: any) => ({
        id: user.id?.toString() || `user-${user.email}`,
        name: user.name || user.email?.split('@')[0] || "User",
        email: user.email,
        profilePhoto: user.profilePhoto || user.profilephoto
      }));
      
      // Sort users for consistent results
      const sortedUsers = processedUsers.sort((a, b) => {
        const queryLower = query.toLowerCase();
        const aNameMatch = a.name?.toLowerCase().includes(queryLower);
        const bNameMatch = b.name?.toLowerCase().includes(queryLower);
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        const aEmailMatch = a.email?.toLowerCase().includes(queryLower);
        const bEmailMatch = b.email?.toLowerCase().includes(queryLower);
        
        if (aEmailMatch && !bEmailMatch) return -1;
        if (!aEmailMatch && bEmailMatch) return 1;
        
        return (a.name || "").localeCompare(b.name || "");
      });
      
      return sortedUsers;
    } catch (error) {
      console.error("User search error:", error);
      // Fallback to local search
      const filteredUsers = allUsers.filter(user => 
        user.name?.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase())
      );
      
      const sortedUsers = filteredUsers.sort((a, b) => {
        const queryLower = query.toLowerCase();
        const aNameMatch = a.name?.toLowerCase().includes(queryLower);
        const bNameMatch = b.name?.toLowerCase().includes(queryLower);
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        const aEmailMatch = a.email?.toLowerCase().includes(queryLower);
        const bEmailMatch = b.email?.toLowerCase().includes(queryLower);
        
        if (aEmailMatch && !bEmailMatch) return -1;
        if (!aEmailMatch && bEmailMatch) return 1;
        
        return (a.name || "").localeCompare(b.name || "");
      });
      
      return sortedUsers;
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const q = searchQuery.trim();
    if (!q) {
      setDiscoveryFeed([...allOffers].sort(() => Math.random() - 0.5));
      setStoreResults([]);
      setUserResults([]);
      setShowStores(false);
      setShowUsers(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Add to search history
    const newHistory = [q, ...searchHistory.filter(item => item !== q)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Reset displays
        setShowStores(false);
        setShowUsers(false);
        setStoreResults([]);
        setUserResults([]);
        setDiscoveryFeed([]);

        // Handle search based on type
        switch (searchType) {
          case "all":
            // For "all", search everything and show all results
            let bookResults: Offer[] = [];
            let storeResults: Store[] = [];
            let userResults: User[] = [];

            // Search books
            const backendBookResults = await searchBackendOffers(q);
            if (backendBookResults.length === 0) {
              bookResults = allOffers.filter(o => 
                o.bookTitle?.toLowerCase().includes(q.toLowerCase()) || 
                o.author?.toLowerCase().includes(q.toLowerCase()) ||
                o.description?.toLowerCase().includes(q.toLowerCase())
              );
            } else {
              bookResults = backendBookResults;
            }

            // Sort books by relevance
            const sortedBookResults = bookResults.sort((a, b) => {
              const aTitle = a.bookTitle.toLowerCase();
              const bTitle = b.bookTitle.toLowerCase();
              const query = q.toLowerCase();
              
              // Exact match first
              if (aTitle === query) return -1;
              if (bTitle === query) return 1;
              
              // Starts with query
              if (aTitle.startsWith(query) && !bTitle.startsWith(query)) return -1;
              if (bTitle.startsWith(query) && !aTitle.startsWith(query)) return 1;
              
              // Contains query
              if (aTitle.includes(query) && !bTitle.includes(query)) return -1;
              if (bTitle.includes(query) && !aTitle.includes(query)) return 1;
              
              // Then check author matches
              const aAuthorMatch = a.author?.toLowerCase().includes(query);
              const bAuthorMatch = b.author?.toLowerCase().includes(query);
              
              if (aAuthorMatch && !bAuthorMatch) return -1;
              if (!aAuthorMatch && bAuthorMatch) return 1;
              
              // Finally check owner name matches
              const aOwnerMatch = a.ownerName?.toLowerCase().includes(query);
              const bOwnerMatch = b.ownerName?.toLowerCase().includes(query);
              
              if (aOwnerMatch && !bOwnerMatch) return -1;
              if (!aOwnerMatch && bOwnerMatch) return 1;
              
              // Alphabetical
              return aTitle.localeCompare(bTitle);
            });
            
            setDiscoveryFeed(sortedBookResults);

            // Search stores
            storeResults = await searchBackendStores(q);
            setStoreResults(storeResults);
            if (storeResults.length > 0) {
              setShowStores(true);
            }

            // Search users
            userResults = await searchBackendUsers(q);
            setUserResults(userResults);
            if (userResults.length > 0) {
              setShowUsers(true);
            }
            break;

          case "books":
            // Only search for books
            let booksOnlyResults = await searchBackendOffers(q);
            if (booksOnlyResults.length === 0) {
              booksOnlyResults = allOffers.filter(o => 
                o.bookTitle?.toLowerCase().includes(q.toLowerCase()) || 
                o.author?.toLowerCase().includes(q.toLowerCase()) ||
                o.description?.toLowerCase().includes(q.toLowerCase())
              );
            }

            // Sort books by title match first, then author, then owner
            const sortedBooksOnlyResults = booksOnlyResults.sort((a, b) => {
              const queryLower = q.toLowerCase();
              const aTitle = a.bookTitle.toLowerCase();
              const bTitle = b.bookTitle.toLowerCase();
              
              // Exact title match
              if (aTitle === queryLower) return -1;
              if (bTitle === queryLower) return 1;
              
              // Title starts with query
              if (aTitle.startsWith(queryLower) && !bTitle.startsWith(queryLower)) return -1;
              if (bTitle.startsWith(queryLower) && !aTitle.startsWith(queryLower)) return 1;
              
              // Title contains query
              if (aTitle.includes(queryLower) && !bTitle.includes(queryLower)) return -1;
              if (bTitle.includes(queryLower) && !aTitle.includes(queryLower)) return 1;
              
              // Check author matches
              const aAuthorMatch = a.author?.toLowerCase().includes(queryLower);
              const bAuthorMatch = b.author?.toLowerCase().includes(queryLower);
              
              if (aAuthorMatch && !bAuthorMatch) return -1;
              if (!aAuthorMatch && bAuthorMatch) return 1;
              
              // Check owner name matches
              const aOwnerMatch = a.ownerName?.toLowerCase().includes(queryLower);
              const bOwnerMatch = b.ownerName?.toLowerCase().includes(queryLower);
              
              if (aOwnerMatch && !bOwnerMatch) return -1;
              if (!aOwnerMatch && bOwnerMatch) return 1;
              
              // Alphabetical by title
              return aTitle.localeCompare(bTitle);
            });
            
            setDiscoveryFeed(sortedBooksOnlyResults);
            setStoreResults([]);
            setUserResults([]);
            setShowStores(false);
            setShowUsers(false);
            break;

          case "stores":
            // Only search for stores
            const storesOnlyResults = await searchBackendStores(q);
            setStoreResults(storesOnlyResults);
            setDiscoveryFeed([]); // Clear books display
            setUserResults([]);
            
            if (storesOnlyResults.length > 0) {
              setShowStores(true);
            }
            setShowUsers(false);
            break;

          case "users":
            // Only search for users
            const usersOnlyResults = await searchBackendUsers(q);
            setUserResults(usersOnlyResults);
            setDiscoveryFeed([]); // Clear books display
            setStoreResults([]);
            
            if (usersOnlyResults.length > 0) {
              setShowUsers(true);
            }
            setShowStores(false);
            break;
        }
      } catch (error) {
        console.error("Search error:", error);
        // Ultimate fallback: local search everything
        const localOffers = allOffers.filter(o => 
          o.bookTitle?.toLowerCase().includes(q.toLowerCase()) || 
          o.author?.toLowerCase().includes(q.toLowerCase())
        );
        setDiscoveryFeed(localOffers);
        
        const localStores = allStores.filter(s => 
          s.name?.toLowerCase().includes(q.toLowerCase())
        );
        setStoreResults(localStores);
        if (localStores.length > 0) setShowStores(true);
        
        const localUsers = allUsers.filter(u => 
          u.name?.toLowerCase().includes(q.toLowerCase()) ||
          u.email?.toLowerCase().includes(q.toLowerCase())
        );
        setUserResults(localUsers);
        if (localUsers.length > 0) setShowUsers(true);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce
  };

  // Auto-search when query changes (with debounce)
  useEffect(() => {
    if (searchQuery.trim() && searchQuery.length >= 2) {
      handleSearch();
    } else if (!searchQuery.trim()) {
      // Clear search results when query is empty
      setDiscoveryFeed([...allOffers].sort(() => Math.random() - 0.5));
      setStoreResults([]);
      setUserResults([]);
      setShowStores(false);
      setShowUsers(false);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchType]);

  const clearSearch = () => {
    setSearchQuery("");
    setDiscoveryFeed([...allOffers].sort(() => Math.random() - 0.5));
    setStoreResults([]);
    setUserResults([]);
    setShowStores(false);
    setShowUsers(false);
    setIsSearching(false);
  };

  const handleContact = async (offer: Offer) => {
    try {
      const resp = await fetch(`${API_BASE}/chats?user=${encodeURIComponent(currentUser.email)}`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });
      if (resp.ok) {
        const chats: any[] = await resp.json();
        const existingChat = chats.find((c: any) => 
          (c.user1.toLowerCase() === offer.ownerEmail.toLowerCase() || c.user2.toLowerCase() === offer.ownerEmail.toLowerCase()) && 
          (Number(c.offer_id) === Number(offer.id))
        );
        if (existingChat) {
          navigate(`/chat/${existingChat.id}`, { state: { chat: existingChat } });
          return;
        }
      }
    } catch (e) { console.error("Error checking chats", e); }
    
    navigate(`/chat/new`, {
      state: {
        chat: {
          id: 0,
          user1: currentUser.email,
          user2: offer.ownerEmail,
          other_user_name: offer.ownerName || "Seller",
          offer_title: offer.bookTitle,
          offer_id: offer.id,
          ownerEmail: offer.ownerEmail
        }
      }
    });
  };

  const handleViewUserProfile = (user: User) => {
    // Navigate to user profile or show user's offers
    navigate(`/profile/${user.email}`, { state: { user } });
  };

  const SearchTypeButton = ({ type, icon, label }: { type: "all" | "books" | "stores" | "users", icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setSearchType(type)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
        searchType === type 
          ? 'bg-[#382110] text-white shadow-sm' 
          : 'bg-[#f4f1ea] text-[#382110] hover:bg-[#e8e0d5]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  // Suggested searches
  const suggestedSearches = [
    "fantasy", "mystery", "romance", "sci-fi", "classic", 
    "novel", "poetry", "biography", "history", "children"
  ];

  return (
    <div className="flex flex-col h-full bg-[#faf8f5]">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#eee] px-4 py-3 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
             {/* Back Button Removed - Using Global Nav */}
            
            <form onSubmit={handleSearch} className="flex-1 relative group">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books, authors, stores, or users..."
                className="w-full bg-[#f4f4f4] border-none rounded-xl py-3 pl-12 pr-10 text-[#382110] text-sm focus:bg-white focus:ring-2 focus:ring-[#382110]/10 outline-none transition-all shadow-inner"
                autoFocus
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] group-focus-within:text-[#382110]">
                {isSearching ? <div className="w-4 h-4 border-2 border-[#382110] border-t-transparent rounded-full animate-spin" /> : <FaSearch size={16} />}
              </div>
              {searchQuery && (
                <button 
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#382110] p-1"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </form>

            <button 
              onClick={fetchAllData} 
              className="p-3 text-[#382110] hover:bg-[#f4f1ea] rounded-full transition-colors"
              title="Refresh"
            >
              <FaSync size={16} />
            </button>
          </div>

          {/* Search Type Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <SearchTypeButton type="all" icon={<FaSearch size={12} />} label="All" />
            <SearchTypeButton type="books" icon={<FaBook size={12} />} label="Books" />
            <SearchTypeButton type="stores" icon={<FaStore size={12} />} label="Stores" />
            <SearchTypeButton type="users" icon={<FaUsers size={12} />} label="Users" />
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && !searchQuery && (
            <div className="mt-3">
              <p className="text-xs text-[#777] mb-2">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 5).map((term, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(term)}
                    className="px-3 py-1.5 bg-[#f4f1ea] text-[#382110] text-xs rounded-full hover:bg-[#e8e0d5] transition-colors flex items-center gap-1.5"
                  >
                    <FaSearch size={10} />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Store Results */}
            {showStores && storeResults.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold text-[#382110] uppercase tracking-widest border-b pb-2">Store Matches ({storeResults.length})</h2>
                  <button 
                    onClick={() => navigate("/stores")}
                    className="text-xs text-[#382110] hover:underline flex items-center gap-1"
                  >
                    View All Stores
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storeResults.map((store) => (
                    <motion.div
                      key={store.id}
                      whileHover={{ y: -4 }}
                      onClick={() => navigate(`/store/${store.id}`, { state: { store } })}
                      className="bg-white rounded-xl border border-[#eee] p-4 cursor-pointer hover:shadow-md transition-all flex items-center gap-4 group"
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#382110] to-[#5a3e2b] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <FaStore size={20} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#382110] text-sm truncate">{store.name}</h3>
                        <p className="text-[11px] text-[#777] truncate mt-1">{store.ownerName}</p>
                        <div className="flex items-center gap-3 text-[10px] text-[#777] mt-2">
                          <div className="flex items-center gap-1">
                            <FaFolder size={10} />
                            <span>{store.bookCount || 0} books</span>
                          </div>
                          {userLocation && store.latitude && store.longitude && (
                            <div className="flex items-center gap-1">
                              <FaLocationArrow size={10} />
                              <span>{getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, store.latitude, store.longitude).toFixed(1)} km</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* User Results */}
            {showUsers && userResults.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold text-[#382110] uppercase tracking-widest border-b pb-2">User Matches ({userResults.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userResults.map((user) => (
                    <motion.div
                      key={user.id}
                      whileHover={{ y: -4 }}
                      onClick={() => handleViewUserProfile(user)}
                      className="bg-white rounded-xl border border-[#eee] p-4 cursor-pointer hover:shadow-md transition-all flex items-center gap-4 group"
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00635d] to-[#00857a] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        {user.profilePhoto ? (
                          <img src={user.profilePhoto} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-white text-lg font-bold">{user.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#382110] text-sm truncate">{user.name}</h3>
                        <p className="text-[11px] text-[#777] truncate mt-1">{user.email}</p>
                        <div className="flex items-center gap-3 text-[10px] text-[#777] mt-2">
                          <div className="flex items-center gap-1">
                            <FaBookOpen size={10} />
                            <span>{allOffers.filter(o => o.ownerEmail === user.email).length} books</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Book Results Header - Only show when there are books to display */}
            {discoveryFeed.length > 0 && (
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-bold text-[#382110] uppercase tracking-widest border-b pb-2">
                  {searchQuery 
                    ? `Book Results for "${searchQuery}" (${discoveryFeed.length})` 
                    : `Discover Books (${discoveryFeed.length})`}
                </h2>
                
                {searchQuery && (
                  <button 
                    onClick={clearSearch}
                    className="text-xs text-[#382110] hover:underline flex items-center gap-1"
                  >
                    <FaTimes size={10} />
                    Clear Search
                  </button>
                )}
              </div>
            )}

            {/* No Results & Suggestions */}
            {!searchQuery && discoveryFeed.length === 0 && storeResults.length === 0 && userResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-[#f4f1ea] rounded-full flex items-center justify-center text-[#382110] mb-6">
                  <FaBookOpen size={28} />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#382110] mb-2">Discover Books</h3>
                <p className="text-[#777] text-sm mb-6 max-w-md mx-auto">
                  Start typing in the search bar to find books, stores, or users.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                  <div className="bg-white p-4 rounded-xl border border-[#eee] text-center">
                    <div className="w-10 h-10 bg-[#f4f1ea] rounded-full flex items-center justify-center mx-auto mb-2">
                      <FaBook size={18} className="text-[#382110]" />
                    </div>
                    <p className="text-xs font-medium text-[#382110]">Search Books</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#eee] text-center">
                    <div className="w-10 h-10 bg-[#f4f1ea] rounded-full flex items-center justify-center mx-auto mb-2">
                      <FaStore size={18} className="text-[#382110]" />
                    </div>
                    <p className="text-xs font-medium text-[#382110]">Find Stores</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#eee] text-center">
                    <div className="w-10 h-10 bg-[#f4f1ea] rounded-full flex items-center justify-center mx-auto mb-2">
                      <FaUsers size={18} className="text-[#382110]" />
                    </div>
                    <p className="text-xs font-medium text-[#382110]">Discover Users</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#eee] text-center">
                    <div className="w-10 h-10 bg-[#f4f1ea] rounded-full flex items-center justify-center mx-auto mb-2">
                      <FaMapMarkerAlt size={18} className="text-[#382110]" />
                    </div>
                    <p className="text-xs font-medium text-[#382110]">Nearby Books</p>
                  </div>
                </div>
              </div>
            ) : searchQuery && discoveryFeed.length === 0 && storeResults.length === 0 && userResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-[#f4f1ea] rounded-full flex items-center justify-center text-[#382110] mb-6">
                  <FaSearch size={28} />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#382110] mb-2">No matches found</h3>
                <p className="text-[#777] text-sm mb-8 max-w-md mx-auto">
                  Try different keywords or browse suggestions below.
                </p>
                
                <div className="mb-10">
                  <p className="text-sm text-[#382110] font-medium mb-3">Try searching for:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedSearches.map((term) => (
                      <button 
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        className="px-4 py-2 bg-[#f4f1ea] text-[#382110] text-sm rounded-full hover:bg-[#e8e0d5] transition-colors capitalize"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : discoveryFeed.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {discoveryFeed.map((offer) => (
                  <motion.div 
                    key={offer.id}
                    whileHover={{ y: -4 }}
                    className="flex flex-col gap-2 group bg-white p-2.5 rounded-xl border border-[#ece9e4] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] transition-all duration-300"
                  >
                    <div 
                      onClick={() => setSelectedOffer(offer)}
                      className="w-full h-[200px] md:h-[220px] relative rounded-lg overflow-hidden bg-[#f8f6f3] cursor-pointer"
                    >
                      <img 
                        src={getImageSource(offer)} 
                        alt={offer.bookTitle}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-95" 
                      />
                      
                      <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                        <div className={`text-[9px] font-bold px-2 py-1 text-white shadow-sm rounded-md tracking-wider uppercase
                          ${offer.type === 'sell' ? 'bg-[#d37e2fcc] backdrop-blur-md' : 
                            offer.type === 'exchange' ? 'bg-[#00635dcc] backdrop-blur-md' : 
                            'bg-[#764d91cc] backdrop-blur-md'}`}>
                          {offer.type}
                        </div>
                      </div>

                      {userLocation && offer.latitude && (
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1.5">
                          <FaLocationArrow size={8} /> 
                          {getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, offer.latitude, offer.longitude!).toFixed(1)} km
                        </div>
                      )}
                    </div>

                    <div className="px-1">
                      <h3 
                        onClick={() => setSelectedOffer(offer)}
                        className="font-serif font-bold text-[#2d2520] text-sm leading-tight cursor-pointer line-clamp-2 min-h-[32px] group-hover:text-[#8b4513] transition-colors mt-1"
                      >
                        {offer.bookTitle}
                      </h3>
                      <div className="text-[11px] text-[#777] mb-3 truncate">by {offer.author}</div>
                      
                      <div className="flex items-center gap-2 pt-2 border-t border-[#f4f4f4]">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-[#f4f1ea] border border-[#e5e5e5] flex-shrink-0">
                          {offer.ownerPhoto ? (
                            <img src={offer.ownerPhoto} className="w-full h-full object-cover" alt={offer.ownerName} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-[#382110]">
                              {offer.ownerName?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-[#444] truncate">{offer.ownerName.split(' ')[0]}</span>
                          {offer.ownerBadges.length > 0 && (
                            <span className="text-[8px] text-[#d37e2f] font-semibold truncate leading-none">
                              {offer.ownerBadges[offer.ownerBadges.length - 1]}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleWishlist?.(offer.bookTitle); }}
                          className={`text-sm transition-colors ${isWishlisted(offer.bookTitle) ? 'text-[#d37e2f]' : 'text-gray-300 hover:text-[#d37e2f]'}`}
                        >
                          <FaHeart />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* Offer Detail Modal */}
      <AnimatePresence>
         {selectedOffer && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
               onClick={() => setSelectedOffer(null)}
            >
               <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  className="bg-white rounded-2xl overflow-hidden w-full max-w-4xl max-h-[90vh] md:max-h-[600px] flex flex-col md:flex-row shadow-2xl relative"
                  onClick={e => e.stopPropagation()}
               >
                  <button onClick={() => setSelectedOffer(null)} className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full shadow-sm hover:bg-white transition-colors">
                     <FaTimes size={16} />
                  </button>

                  <div className="w-full md:w-1/2 bg-[#f4f1ea] flex items-center justify-center p-8 relative">
                     <img src={getImageSource(selectedOffer)} className="max-h-full max-w-full shadow-lg object-contain" alt={selectedOffer.bookTitle} />
                     <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded text-[10px] font-bold text-[#382110] shadow-sm uppercase tracking-widest">
                        {selectedOffer.type}
                     </div>
                  </div>

                  <div className="w-full md:w-1/2 p-8 flex flex-col bg-white overflow-y-auto">
                     <div className="mb-6">
                        <h2 className="font-serif font-bold text-3xl text-[#382110] mb-2 leading-tight">{selectedOffer.bookTitle}</h2>
                        <p className="text-lg text-[#555]">by <span className="font-bold underline decoration-[#382110]">{selectedOffer.author}</span></p>
                     </div>

                     <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#eee]">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#f4f1ea] border border-[#ddd] shadow-sm">
                           {selectedOffer.ownerPhoto ? <img src={selectedOffer.ownerPhoto} className="w-full h-full object-cover" alt={selectedOffer.ownerName} /> : <div className="w-full h-full flex items-center justify-center text-lg font-bold">{selectedOffer.ownerName?.charAt(0)}</div>}
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2">
                              <p className="text-base font-bold text-[#382110]">{selectedOffer.ownerName}</p>
                              {selectedOffer.ownerBadges.length > 0 && (
                                 <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#d37e2f]/20 text-[#d37e2f] border border-[#d37e2f]/30">
                                    {selectedOffer.ownerBadges[selectedOffer.ownerBadges.length - 1]}
                                 </span>
                              )}
                           </div>
                           <p className="text-xs text-[#999] mt-0.5">{selectedOffer.publishedAt ? `Listed on ${new Date(selectedOffer.publishedAt).toLocaleDateString()}` : "Active Library Member"}</p>
                        </div>
                     </div>

                     <div className="flex-1 mb-6">
                        <div className="flex gap-2 mb-4">
                           <span className="px-2 py-1 bg-[#f4f1ea] text-[#382110] text-[10px] font-bold rounded-md uppercase tracking-widest">{selectedOffer.condition || "Good Condition"}</span>
                        </div>
                        <p className="text-[#444] leading-relaxed font-serif">{selectedOffer.description || "No description provided. Contact the neighbor for details."}</p>
                     </div>

                     <div className="mt-auto pt-6 border-t border-[#eee]">
                        <div className="flex items-end justify-between mb-6">
                           <span className="text-[10px] uppercase text-[#999] font-bold tracking-widest">Preference</span>
                           <span className="text-3xl font-serif font-bold text-[#d37e2f]">
                              {selectedOffer.price ? `PKR ${selectedOffer.price}` : selectedOffer.type === 'exchange' ? 'Trade' : 'ISO'}
                           </span>
                        </div>
                        
                        {selectedOffer.ownerEmail === currentUser.email ? (
                           <div className="w-full bg-[#f4f1ea] border border-[#d8d8d8] text-[#382110] font-bold py-3 px-4 rounded-xl text-center">
                              📚 This is your listing
                           </div>
                        ) : (
                           <div className="flex gap-2">
                              <button 
                                 onClick={() => handleContact(selectedOffer)}
                                 className="flex-1 bg-[#409d69] hover:bg-[#358759] text-white font-bold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                              >
                                 <FaComments /> Contact Neighbor
                              </button>
                              <button 
                                 onClick={() => toggleWishlist?.(selectedOffer.bookTitle)}
                                 className={`p-3.5 rounded-xl border transition-all active:scale-90
                                    ${isWishlisted(selectedOffer.bookTitle) ? 'bg-[#d37e2f] text-white border-[#d37e2f]' : 'bg-white text-[#382110] border-[#d8d8d8]'}`}
                              >
                                 <FaHeart />
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}