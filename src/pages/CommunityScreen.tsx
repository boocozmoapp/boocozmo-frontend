/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/CommunityScreen.tsx - FIXED VERSION
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaUsers, FaPlus, FaArrowLeft, FaPaperPlane, FaCamera, 
  FaHeart, FaComment, FaShare, FaCheck, FaTimes,
  FaSearch, FaFilter, FaUserPlus, FaSignOutAlt,
  FaTrash, FaBook, FaGlobe, FaLock, FaChevronLeft,
  FaChevronRight, FaImage, FaExclamationTriangle
} from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

// Simple date formatting helper
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

type User = {
  email: string;
  name: string;
  id: string;
  token: string;
  profilePhoto?: string;
};

type Community = {
  id: number;
  title: string;
  description: string;
  owner_email: string;
  owner_name?: string;
  owner_photo?: string;
  category: string;
  is_public: boolean;
  is_active: boolean;
  member_count: number;
  members: string[];
  created_at: string;
  is_member?: boolean;
  is_owner?: boolean;
  can_post?: boolean;
};

type CommunityPost = {
  id: number;
  community_id: number;
  author_email: string;
  author_name?: string;
  author_photo?: string;
  content: string;
  image_url?: string;
  sticker_url?: string;
  like_count: number;
  comment_count: number;
  likes: string[];
  has_liked?: boolean;
  created_at: string;
  updated_at: string;
};

type Props = {
  currentUser: User;
};

export default function CommunityScreen({ currentUser }: Props) {
  const navigate = useNavigate();
  
  // Main states
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<CommunityPost | null>(null);
  
  // Form states
  const [newCommunity, setNewCommunity] = useState({
    title: "",
    description: "",
    category: "general",
    is_public: true
  });
  const [newPost, setNewPost] = useState({
    content: "",
    image_url: "",
    sticker_url: ""
  });
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<{category: string, count: number}[]>([
    {category: "general", count: 0},
    {category: "fantasy", count: 0},
    {category: "sci-fi", count: 0},
    {category: "mystery", count: 0},
    {category: "romance", count: 0},
    {category: "non-fiction", count: 0},
    {category: "academic", count: 0}
  ]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCommunities, setTotalCommunities] = useState(0);
  const communitiesPerPage = 12;
  
  // Create community refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ==================== HELPER FUNCTIONS ====================
  const getAuthHeaders = () => {
    return {
      "Authorization": `Bearer ${currentUser.token}`,
      "Content-Type": "application/json"
    };
  };

  // ==================== FETCH FUNCTIONS ====================

  const fetchCommunities = useCallback(async (page = 1, category = selectedCategory, search = searchQuery) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/communities?limit=${communitiesPerPage}&offset=${(page - 1) * communitiesPerPage}`;
      
      if (category !== "all") {
        url += `&category=${category}`;
      }
      
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      console.log("📡 Fetching communities from:", url);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Communities response:", data);
        
        // Handle both response formats
        let communitiesList: Community[] = [];
        let totalCount = 0;
        
        if (Array.isArray(data)) {
          communitiesList = data;
          totalCount = data.length;
        } else if (data.communities && Array.isArray(data.communities)) {
          communitiesList = data.communities;
          totalCount = data.total || data.communities.length;
        }
        
        console.log("✅ Communities fetched:", communitiesList.length);
        setCommunities(communitiesList);
        setTotalCommunities(totalCount);
        setError(null);
      } else {
        console.error("❌ Communities fetch failed with status:", response.status);
        setError("Failed to fetch communities. Please try again.");
        setCommunities([]);
        setTotalCommunities(0);
      }
    } catch (error) {
      console.error("❌ Error fetching communities:", error);
      setError("Network error. Please check your connection.");
      setCommunities([]);
      setTotalCommunities(0);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, communitiesPerPage]);

  const fetchCategories = useCallback(async () => {
    try {
      console.log("📡 Fetching categories...");
      const response = await fetch(`${API_BASE}/communities/categories`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Categories fetched:", data);
        
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } else {
        console.error("Categories fetch failed with status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  const fetchCommunityDetails = useCallback(async (communityId: number) => {
    if (!currentUser.token) {
      setError("Please login to view community details");
      return;
    }

    setLoadingPosts(true);
    setError(null);
    try {
      console.log(`📡 Fetching community ${communityId} details...`);
      
      const response = await fetch(`${API_BASE}/communities/${communityId}/auth`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Community details fetched:", data);
        
        setSelectedCommunity({
          ...data.community,
          is_member: data.user_status?.is_member || false,
          is_owner: data.user_status?.is_owner || false,
          can_post: data.user_status?.can_post || false
        });
        setCommunityPosts(data.posts || []);
      } else if (response.status === 401 || response.status === 403) {
        // Token invalid or expired
        console.log("🔄 Token invalid, trying public endpoint...");
        const publicResponse = await fetch(`${API_BASE}/communities/${communityId}`);
        
        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          console.log("✅ Community details fetched (public):", publicData);
          setSelectedCommunity({
            ...publicData.community,
            is_member: false,
            is_owner: false,
            can_post: false
          });
          setCommunityPosts(publicData.posts || []);
        } else {
          const errorData = await publicResponse.json().catch(() => ({}));
          console.error("❌ Community fetch failed:", errorData);
          setError(errorData.error || "Failed to load community");
          setSelectedCommunity(null);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Community fetch failed:", errorData);
        setError(errorData.error || "Failed to load community");
        setSelectedCommunity(null);
      }
    } catch (error) {
      console.error("Error fetching community details:", error);
      setError("Network error. Please check your connection.");
      setSelectedCommunity(null);
    } finally {
      setLoadingPosts(false);
    }
  }, [currentUser.token]);

  // ==================== ACTION FUNCTIONS ====================

  const handleCreateCommunity = async () => {
    if (!newCommunity.title.trim()) {
      alert("Community title is required!");
      return;
    }

    try {
      console.log("📡 Creating community:", newCommunity);
      const response = await fetch(`${API_BASE}/communities/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newCommunity)
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Community created:", data);
        alert("✅ Community created successfully!");
        setShowCreateModal(false);
        setNewCommunity({ title: "", description: "", category: "general", is_public: true });
        fetchCommunities();
        // Navigate to the new community
        if (data.community) {
          fetchCommunityDetails(data.community.id);
        }
      } else {
        const error = await response.json().catch(() => ({ error: "Failed to create community" }));
        alert(`❌ ${error.error || "Failed to create community"}`);
      }
    } catch (error) {
      console.error("Error creating community:", error);
      alert("❌ Failed to create community. Check your connection.");
    }
  };

  const handleJoinCommunity = async (communityId: number) => {
    try {
      console.log(`📡 Joining community ${communityId}...`);
      const response = await fetch(`${API_BASE}/communities/${communityId}/join`, {
        method: "POST",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        alert("✅ Successfully joined the community!");
        setShowJoinModal(false);
        // Refresh community details
        if (selectedCommunity) {
          fetchCommunityDetails(selectedCommunity.id);
        }
        // Refresh communities list to update member count
        fetchCommunities();
      } else {
        const error = await response.json().catch(() => ({ error: "Failed to join community" }));
        alert(`❌ ${error.error || "Failed to join community"}`);
      }
    } catch (error) {
      console.error("Error joining community:", error);
      alert("❌ Failed to join community. Check your connection.");
    }
  };

  const handleLeaveCommunity = async (communityId: number) => {
    try {
      console.log(`📡 Leaving community ${communityId}...`);
      const response = await fetch(`${API_BASE}/communities/${communityId}/leave`, {
        method: "POST",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        alert("✅ You have left the community");
        setShowLeaveModal(false);
        // Go back to communities list
        setSelectedCommunity(null);
        setCommunityPosts([]);
        // Refresh communities list
        fetchCommunities();
      } else {
        const error = await response.json().catch(() => ({ error: "Failed to leave community" }));
        alert(`❌ ${error.error || "Failed to leave community"}`);
      }
    } catch (error) {
      console.error("Error leaving community:", error);
      alert("❌ Failed to leave community. Check your connection.");
    }
  };

  const handleCreatePost = async () => {
    if (!selectedCommunity) return;
    
    if (!newPost.content.trim()) {
      alert("Post content is required!");
      return;
    }

    try {
      console.log("📡 Creating post in community:", selectedCommunity.id);
      const response = await fetch(`${API_BASE}/communities/${selectedCommunity.id}/posts`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newPost)
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Post created:", data);
        // Add new post to the beginning of the list
        const enrichedPost = {
          ...data.post,
          author_name: currentUser.name,
          author_photo: currentUser.profilePhoto,
          has_liked: false
        };
        setCommunityPosts(prev => [enrichedPost, ...prev]);
        // Clear post form
        setNewPost({ content: "", image_url: "", sticker_url: "" });
        // Clear textarea
        if (postTextareaRef.current) {
          postTextareaRef.current.style.height = 'auto';
          postTextareaRef.current.value = '';
        }
      } else {
        const error = await response.json().catch(() => ({ error: "Failed to create post" }));
        alert(`❌ ${error.error || "Failed to create post"}`);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("❌ Failed to create post. Check your connection.");
    }
  };

  const handleLikePost = async (postId: number) => {
    try {
      console.log(`📡 Liking post ${postId}...`);
      const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
        method: "POST",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Post liked:", data);
        // Update the post in the list
        setCommunityPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                like_count: data.like_count, 
                has_liked: data.has_liked,
                likes: data.has_liked 
                  ? [...(post.likes || []), currentUser.email]
                  : (post.likes || []).filter((email: string) => email !== currentUser.email)
              }
            : post
        ));
      } else {
        const error = await response.json().catch(() => ({}));
        console.error("❌ Like failed:", error);
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      console.log(`📡 Deleting post ${postToDelete.id}...`);
      const response = await fetch(`${API_BASE}/posts/${postToDelete.id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        // Remove post from list
        setCommunityPosts(prev => prev.filter(post => post.id !== postToDelete.id));
        setShowDeletePostModal(false);
        setPostToDelete(null);
      } else {
        const error = await response.json().catch(() => ({ error: "Failed to delete post" }));
        alert(`❌ ${error.error || "Failed to delete post"}`);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("❌ Failed to delete post. Check your connection.");
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (3MB max)
    if (file.size > 3 * 1024 * 1024) {
      alert('Image must be less than 3MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setNewPost(prev => ({ ...prev, image_url: base64String }));
    };
    reader.readAsDataURL(file);
  };

  // Auto-resize textarea
  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    setNewPost({ ...newPost, content: textarea.value });
  };

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (!selectedCommunity) {
      fetchCommunities(currentPage, selectedCategory, searchQuery);
      fetchCategories();
    }
  }, [selectedCommunity, currentPage, selectedCategory, searchQuery, fetchCommunities, fetchCategories]);

  // ==================== RENDER COMPONENTS ====================

  // Community Card Component
  const CommunityCard = ({ community }: { community: Community }) => {
    const isMember = community.is_member || 
      (Array.isArray(community.members) && community.members.includes(currentUser.email));
    
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => fetchCommunityDetails(community.id)}
        className="bg-white rounded-xl shadow-sm border border-[#e8e0d5] overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 group"
      >
        <div className={`h-2 ${getCategoryColor(community.category)}`} />
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#382110] text-lg truncate group-hover:text-[#2a180c] transition-colors">
                {community.title}
              </h3>
              {community.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {community.description}
                </p>
              )}
            </div>
            {community.is_public ? (
              <FaGlobe className="text-gray-400 ml-2 flex-shrink-0" title="Public Community" />
            ) : (
              <FaLock className="text-gray-400 ml-2 flex-shrink-0" title="Private Community" />
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              {community.category}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-gray-600">
                <FaUsers size={12} />
                <span className="font-medium">{community.member_count || 0}</span>
              </div>
              {isMember && (
                <span className="px-2 py-1 bg-[#d37e2f]/10 text-[#d37e2f] text-xs font-medium rounded-full flex items-center gap-1">
                  <FaCheck size={10} /> Member
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
              {community.owner_photo ? (
                <img src={community.owner_photo} alt={community.owner_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#382110] text-white text-xs">
                  {community.owner_name?.charAt(0) || "C"}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-600 truncate">
              Created by {community.owner_name || "Community Member"}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  // Post Component
  const PostCard = ({ post }: { post: CommunityPost }) => {
    const canDelete = post.author_email === currentUser.email || 
      selectedCommunity?.owner_email === currentUser.email;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-[#e8e0d5] p-4 mb-4 hover:shadow-md transition-shadow duration-300"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-300 flex-shrink-0">
            {post.author_photo ? (
              <img src={post.author_photo} alt={post.author_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#382110] text-white font-bold">
                {post.author_name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h4 className="font-bold text-[#382110] text-sm">{post.author_name || "Community Member"}</h4>
                <p className="text-xs text-gray-500">
                  {formatTimeAgo(post.created_at)}
                </p>
              </div>
              
              {canDelete && (
                <button
                  onClick={() => {
                    setPostToDelete(post);
                    setShowDeletePostModal(true);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Delete post"
                >
                  <FaTrash size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-gray-800 whitespace-pre-line text-sm leading-relaxed">{post.content}</p>
          
          {post.image_url && (
            <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
              <img 
                src={post.image_url} 
                alt="Post attachment" 
                className="w-full max-h-64 object-contain bg-gray-100"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            onClick={() => handleLikePost(post.id)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${
              post.has_liked 
                ? 'text-red-500 bg-red-50' 
                : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            <FaHeart size={14} className={post.has_liked ? "fill-current" : ""} />
            <span className="text-xs font-medium">{post.like_count || 0}</span>
          </button>

          <button className="flex items-center gap-1.5 px-2 py-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
            <FaComment size={14} />
            <span className="text-xs font-medium">{post.comment_count || 0}</span>
          </button>

          <button className="flex items-center gap-1.5 px-2 py-1 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors">
            <FaShare size={14} />
            <span className="text-xs font-medium">Share</span>
          </button>
        </div>
      </motion.div>
    );
  };

  // Helper function for category colors
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'fantasy': 'bg-purple-500',
      'sci-fi': 'bg-blue-500',
      'mystery': 'bg-indigo-500',
      'romance': 'bg-pink-500',
      'non-fiction': 'bg-green-500',
      'academic': 'bg-yellow-500',
      'general': 'bg-[#382110]'
    };
    return colors[category] || 'bg-gray-500';
  };

  // Get category strings for filter buttons
  const getCategoryStrings = () => {
    const categorySet = new Set(["all"]);
    categories.forEach(cat => {
      if (cat.category && cat.category.trim()) {
        categorySet.add(cat.category);
      }
    });
    return Array.from(categorySet);
  };

  // ==================== RENDER LOGIC ====================

  if (selectedCommunity) {
    const isMember = selectedCommunity.is_member || selectedCommunity.is_owner;
    
    return (
      <div className="h-[calc(100vh-110px)] md:h-[calc(100vh-60px)] bg-gradient-to-b from-[#f9f6f0] to-white flex flex-col overflow-hidden">
        {/* Clean Header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e0d5] shadow-sm flex-shrink-0">
          <div className="max-w-3xl mx-auto px-4 w-full py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedCommunity(null);
                  setCommunityPosts([]);
                  setError(null);
                }}
                className="text-[#382110] hover:text-[#2a180c] transition-colors p-1.5"
                title="Back to communities"
              >
                <FaArrowLeft size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-[#382110] truncate">{selectedCommunity.title}</h1>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <FaUsers size={10} /> {selectedCommunity.member_count || 0}
                  </span>
                  <span>•</span>
                  <span className="truncate">{selectedCommunity.category}</span>
                </div>
              </div>
              
              {/* Join/Leave button */}
              {!selectedCommunity.is_owner && (
                isMember ? (
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1"
                  >
                    <FaSignOutAlt size={10} /> Leave
                  </button>
                ) : (
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="px-2.5 py-1 bg-[#382110] text-white rounded-full text-xs font-medium hover:bg-[#2a180c] transition-colors flex items-center gap-1"
                  >
                    <FaUserPlus size={10} /> Join
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="max-w-3xl mx-auto px-4 w-full pb-4 pt-0">
            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <FaExclamationTriangle />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Join Prompt for non-members */}
            {!isMember && !selectedCommunity.is_owner && (
              <div className="bg-gradient-to-r from-[#382110]/10 to-[#d37e2f]/10 rounded-xl border border-dashed border-[#382110]/30 p-4 text-center mb-4">
                <FaUsers className="text-[#382110] text-2xl mx-auto mb-2" />
                <h3 className="font-bold text-[#382110] text-sm mb-1">Join to Participate</h3>
                <p className="text-gray-600 text-xs mb-3">Join this community to view and create posts</p>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-3 py-1.5 bg-[#382110] text-white rounded-full text-xs font-medium hover:bg-[#2a180c] transition-colors flex items-center gap-1 mx-auto"
                >
                  <FaUserPlus size={10} /> Join {selectedCommunity.title}
                </button>
              </div>
            )}

            {/* Posts */}
            {loadingPosts ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#382110]"></div>
              </div>
            ) : communityPosts.length > 0 ? (
              <AnimatePresence>
                {communityPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </AnimatePresence>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-[#e8e0d5] p-6 text-center">
                <FaBook className="text-gray-300 text-3xl mx-auto mb-2" />
                <h3 className="font-bold text-gray-500 text-sm mb-1">No posts yet</h3>
                <p className="text-gray-400 text-xs">
                  {isMember 
                    ? "Be the first to share something!" 
                    : "Join the community to see posts"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COMPACT POST FORM AT BOTTOM */}
        {isMember && (
          <div className="sticky bottom-0 z-30 bg-white border-t border-[#e8e0d5] shadow-lg">
            <div className="max-w-3xl mx-auto px-4 w-full py-3">
              {/* Image Preview */}
              {newPost.image_url && (
                <div className="mb-2 relative">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={newPost.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Image attached</p>
                      <p className="text-xs text-gray-400">Tap to remove</p>
                    </div>
                    <button
                      onClick={() => setNewPost({ ...newPost, image_url: "" })}
                      className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="flex items-end gap-2">
                {/* Text Input */}
                <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-300 focus-within:border-[#382110] transition-colors">
                  <textarea
                    ref={postTextareaRef}
                    value={newPost.content}
                    onChange={handleTextareaResize}
                    placeholder={`Message ${selectedCommunity.title}...`}
                    className="w-full px-3 py-2 bg-transparent border-none outline-none resize-none text-sm min-h-[40px] max-h-[80px] placeholder-gray-500"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleCreatePost();
                      }
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  {/* Image Upload */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-[#382110] transition-colors rounded-full hover:bg-gray-100"
                    title="Add image"
                  >
                    <FaImage size={18} />
                  </button>

                  {/* Post Button */}
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPost.content.trim()}
                    className={`p-2.5 rounded-full transition-colors ${
                      newPost.content.trim()
                        ? 'bg-[#382110] text-white hover:bg-[#2a180c]'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    title="Post"
                  >
                    <FaPaperPlane size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <AnimatePresence>
          {showJoinModal && selectedCommunity && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-5 w-full max-w-sm"
              >
                <h3 className="text-lg font-bold text-[#382110] mb-3">Join Community</h3>
                <p className="text-gray-600 text-sm mb-5">
                  Join <span className="font-bold">{selectedCommunity.title}</span> to view and create posts.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleJoinCommunity(selectedCommunity.id)}
                    className="px-3 py-1.5 bg-[#382110] text-white rounded-full text-sm font-medium hover:bg-[#2a180c]"
                  >
                    Join
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLeaveModal && selectedCommunity && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-5 w-full max-w-sm"
              >
                <h3 className="text-lg font-bold text-[#382110] mb-3">Leave Community</h3>
                <p className="text-gray-600 text-sm mb-5">
                  Leave <span className="font-bold">{selectedCommunity.title}</span>?
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowLeaveModal(false)}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleLeaveCommunity(selectedCommunity.id)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700"
                  >
                    Leave
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDeletePostModal && postToDelete && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-5 w-full max-w-sm"
              >
                <h3 className="text-lg font-bold text-[#382110] mb-3">Delete Post</h3>
                <p className="text-gray-600 text-sm mb-5">
                  Delete this post?
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowDeletePostModal(false);
                      setPostToDelete(null);
                    }}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==================== MAIN COMMUNITIES LIST VIEW ====================
  return (
    <div className="min-h-[calc(100vh-110px)] md:min-h-[calc(100vh-60px)] bg-gradient-to-b from-[#f9f6f0] to-white py-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#382110] mb-2">Communities</h1>
              <p className="text-gray-600">
                Join book clubs and connect with readers
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[#382110] text-white rounded-full font-medium hover:bg-[#2a180c] transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <FaPlus /> Create Community
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle />
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-[#e8e0d5] p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && fetchCommunities(1)}
                    placeholder="Search communities..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#382110]/30 focus:border-[#382110]"
                  />
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {getCategoryStrings().map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      fetchCommunities(1, category, searchQuery);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-[#382110] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All' : category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#382110]"></div>
          </div>
        ) : communities.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {communities.map((community) => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>

            {totalCommunities > communitiesPerPage && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newPage = Math.max(1, currentPage - 1);
                      setCurrentPage(newPage);
                      fetchCommunities(newPage);
                    }}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-[#382110] hover:bg-[#382110]/10'
                    }`}
                  >
                    <FaChevronLeft />
                  </button>
                  
                  {Array.from({ length: Math.ceil(totalCommunities / communitiesPerPage) }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === currentPage || 
                      page === currentPage - 1 || 
                      page === currentPage + 1 ||
                      page === Math.ceil(totalCommunities / communitiesPerPage)
                    )
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => {
                            setCurrentPage(page);
                            fetchCommunities(page);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-sm ${
                            currentPage === page
                              ? 'bg-[#382110] text-white'
                              : 'text-[#382110] hover:bg-[#382110]/10'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))
                  }
                  
                  <button
                    onClick={() => {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      fetchCommunities(newPage);
                    }}
                    disabled={currentPage >= Math.ceil(totalCommunities / communitiesPerPage)}
                    className={`p-2 rounded-lg ${
                      currentPage >= Math.ceil(totalCommunities / communitiesPerPage)
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-[#382110] hover:bg-[#382110]/10'
                    }`}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e0d5] p-12 text-center">
            <FaUsers className="text-gray-300 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-500 mb-2">
              {error ? "Failed to load" : "No communities found"}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try different search/filters'
                : 'Create the first community!'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[#382110] text-white rounded-full font-medium hover:bg-[#2a180c] transition-colors inline-flex items-center gap-2"
            >
              <FaPlus /> Create Community
            </button>
          </div>
        )}
      </div>

      {/* Create Community Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#382110]">Create Community</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Community Name *
                    </label>
                    <input
                      type="text"
                      value={newCommunity.title}
                      onChange={(e) => setNewCommunity({ ...newCommunity, title: e.target.value })}
                      placeholder="e.g., Fantasy Book Club"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#382110]/30 focus:border-[#382110]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newCommunity.description}
                      onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                      placeholder="What's this community about?"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#382110]/30 focus:border-[#382110] resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newCommunity.category}
                      onChange={(e) => setNewCommunity({ ...newCommunity, category: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#382110]/30 focus:border-[#382110]"
                    >
                      {getCategoryStrings().filter(cat => cat !== 'all').map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${newCommunity.is_public ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                      {newCommunity.is_public ? <FaGlobe size={20} /> : <FaLock size={20} />}
                    </div>
                    <div className="flex-1">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-700">
                            {newCommunity.is_public ? 'Public Community' : 'Private Community'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {newCommunity.is_public 
                              ? 'Anyone can join' 
                              : 'Only invited members'}
                          </p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={newCommunity.is_public}
                            onChange={(e) => setNewCommunity({ ...newCommunity, is_public: e.target.checked })}
                            className="sr-only"
                          />
                          <div className={`w-12 h-6 rounded-full transition-colors ${newCommunity.is_public ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${newCommunity.is_public ? 'translate-x-7' : 'translate-x-1'}`} />
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCommunity}
                    disabled={!newCommunity.title.trim()}
                    className={`px-5 py-2 rounded-full font-medium ${
                      newCommunity.title.trim()
                        ? 'bg-[#382110] text-white hover:bg-[#2a180c]'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    } transition-colors`}
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}