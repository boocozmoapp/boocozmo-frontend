/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/CommunityScreen.tsx - BOOCOZMO Communities
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaUsers, FaPlus, FaArrowLeft, FaPaperPlane, FaCamera, 
  FaHeart, FaComment, FaShare, FaCheck, FaTimes,
  FaSearch, FaFilter, FaUserPlus, FaSignOutAlt, FaEdit,
  FaTrash, FaBook, FaGlobe, FaLock, FaStar, FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

const API_BASE = "https://boocozmo-api.onrender.com";

type User = {
  email: string;
  name: string;
  id: string;
  token: string;
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
  const [categories, setCategories] = useState<string[]>(["all", "general", "fantasy", "sci-fi", "mystery", "romance", "non-fiction", "academic"]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCommunities, setTotalCommunities] = useState(0);
  const communitiesPerPage = 12;
  
  // Create community refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==================== FETCH FUNCTIONS ====================

  const fetchCommunities = useCallback(async (page = 1, category = selectedCategory, search = searchQuery) => {
    setLoading(true);
    try {
      let url = `${API_BASE}/communities?limit=${communitiesPerPage}&offset=${(page - 1) * communitiesPerPage}`;
      
      if (category !== "all") {
        url += `&category=${category}`;
      }
      
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCommunities(data.communities || []);
        setTotalCommunities(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser.token, selectedCategory, searchQuery]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/communities/categories`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const fetchedCategories = data.map((cat: any) => cat.category).filter(Boolean);
        setCategories(["all", "general", ...fetchedCategories]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [currentUser.token]);

  const fetchCommunityDetails = useCallback(async (communityId: number) => {
    setLoadingPosts(true);
    try {
      const response = await fetch(`${API_BASE}/communities/${communityId}`, {
        headers: { "Authorization": `Bearer ${currentUser.token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedCommunity(data.community);
        setCommunityPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching community details:", error);
      alert("Failed to load community. It may have been deleted.");
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
      const response = await fetch(`${API_BASE}/communities/create`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newCommunity)
      });

      if (response.ok) {
        const data = await response.json();
        alert("Community created successfully!");
        setShowCreateModal(false);
        setNewCommunity({ title: "", description: "", category: "general", is_public: true });
        fetchCommunities();
        // Navigate to the new community
        setSelectedCommunity(data.community);
        fetchCommunityDetails(data.community.id);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create community");
      }
    } catch (error) {
      console.error("Error creating community:", error);
      alert("Failed to create community");
    }
  };

  const handleJoinCommunity = async (communityId: number) => {
    try {
      const response = await fetch(`${API_BASE}/communities/${communityId}/join`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        alert("Successfully joined the community!");
        setShowJoinModal(false);
        // Refresh community details
        if (selectedCommunity) {
          fetchCommunityDetails(selectedCommunity.id);
        }
        // Refresh communities list to update member count
        fetchCommunities();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to join community");
      }
    } catch (error) {
      console.error("Error joining community:", error);
      alert("Failed to join community");
    }
  };

  const handleLeaveCommunity = async (communityId: number) => {
    try {
      const response = await fetch(`${API_BASE}/communities/${communityId}/leave`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        alert("You have left the community");
        setShowLeaveModal(false);
        // Go back to communities list
        setSelectedCommunity(null);
        setCommunityPosts([]);
        // Refresh communities list
        fetchCommunities();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to leave community");
      }
    } catch (error) {
      console.error("Error leaving community:", error);
      alert("Failed to leave community");
    }
  };

  const handleCreatePost = async () => {
    if (!selectedCommunity) return;
    
    if (!newPost.content.trim()) {
      alert("Post content is required!");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/communities/${selectedCommunity.id}/posts`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newPost)
      });

      if (response.ok) {
        const data = await response.json();
        // Add new post to the beginning of the list
        setCommunityPosts(prev => [data.post, ...prev]);
        // Clear post form
        setNewPost({ content: "", image_url: "", sticker_url: "" });
        // Show success message
        alert("Post created successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    }
  };

  const handleLikePost = async (postId: number) => {
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update the post in the list
        setCommunityPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                like_count: data.like_count, 
                has_liked: data.has_liked,
                likes: data.has_liked 
                  ? [...post.likes, currentUser.email]
                  : post.likes.filter(email => email !== currentUser.email)
              }
            : post
        ));
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      const response = await fetch(`${API_BASE}/posts/${postToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentUser.token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        // Remove post from list
        setCommunityPosts(prev => prev.filter(post => post.id !== postToDelete.id));
        setShowDeletePostModal(false);
        setPostToDelete(null);
        alert("Post deleted successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
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

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (!selectedCommunity) {
      fetchCommunities(currentPage);
      fetchCategories();
    }
  }, [selectedCommunity, currentPage, fetchCommunities, fetchCategories]);

  // ==================== RENDER COMPONENTS ====================

  // Community Card Component
  const CommunityCard = ({ community }: { community: Community }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => fetchCommunityDetails(community.id)}
      className="bg-white rounded-xl shadow-sm border border-[#e8e0d5] overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 group"
    >
      {/* Header with color based on category */}
      <div className={`h-2 ${getCategoryColor(community.category)}`} />
      
      {/* Content */}
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

        {/* Category and Stats */}
        <div className="flex items-center justify-between text-sm">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {community.category}
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-gray-600">
              <FaUsers size={12} />
              <span className="font-medium">{community.member_count}</span>
            </div>
            {community.is_member && (
              <span className="px-2 py-1 bg-[#d37e2f]/10 text-[#d37e2f] text-xs font-medium rounded-full flex items-center gap-1">
                <FaCheck size={10} /> Member
              </span>
            )}
          </div>
        </div>

        {/* Owner Info */}
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

  // Post Component
  const PostCard = ({ post }: { post: CommunityPost }) => (
    <div className="bg-white rounded-xl shadow-sm border border-[#e8e0d5] p-4 mb-4">
      {/* Author Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-300">
            {post.author_photo ? (
              <img src={post.author_photo} alt={post.author_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#382110] text-white font-bold">
                {post.author_name?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-[#382110]">{post.author_name || "Community Member"}</h4>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        {/* Post Actions (Delete for author/owner) */}
        {(post.author_email === currentUser.email || selectedCommunity?.owner_email === currentUser.email) && (
          <button
            onClick={() => {
              setPostToDelete(post);
              setShowDeletePostModal(true);
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Delete post"
          >
            <FaTrash size={14} />
          </button>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-line">{post.content}</p>
        
        {post.image_url && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img 
              src={post.image_url} 
              alt="Post attachment" 
              className="w-full max-h-96 object-contain bg-gray-100"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <button
          onClick={() => handleLikePost(post.id)}
          className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
            post.has_liked 
              ? 'text-red-500 bg-red-50' 
              : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <FaHeart size={14} />
          <span className="text-sm font-medium">{post.like_count}</span>
        </button>

        <div className="flex items-center gap-4 text-gray-500">
          <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
            <FaComment size={14} />
            <span className="text-sm font-medium">{post.comment_count}</span>
          </button>
          <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
            <FaShare size={14} />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </div>
    </div>
  );

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

  // ==================== RENDER LOGIC ====================

  if (selectedCommunity) {
    // Render Community Detail View
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f9f6f0] to-white py-6 px-4 md:px-6">
        {/* Back Button and Header */}
        <div className="max-w-3xl mx-auto mb-6">
          <button
            onClick={() => {
              setSelectedCommunity(null);
              setCommunityPosts([]);
            }}
            className="flex items-center gap-2 text-[#382110] hover:text-[#2a180c] font-medium mb-4 transition-colors"
          >
            <FaArrowLeft /> Back to Communities
          </button>

          {/* Community Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e0d5] p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-[#382110]">{selectedCommunity.title}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(selectedCommunity.category)}`}>
                    {selectedCommunity.category}
                  </span>
                  {selectedCommunity.is_public ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <FaGlobe size={10} /> Public
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <FaLock size={10} /> Private
                    </span>
                  )}
                </div>
                {selectedCommunity.description && (
                  <p className="text-gray-600 mb-4">{selectedCommunity.description}</p>
                )}
              </div>

              {/* Community Actions */}
              <div className="flex items-center gap-3">
                {selectedCommunity.is_owner ? (
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this community?")) {
                        // Implement delete functionality
                        alert("Delete functionality coming soon!");
                      }
                    }}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
                  >
                    <FaTrash size={14} /> Delete
                  </button>
                ) : selectedCommunity.is_member ? (
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <FaSignOutAlt size={14} /> Leave
                  </button>
                ) : (
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="px-4 py-2 bg-[#382110] text-white rounded-full text-sm font-medium hover:bg-[#2a180c] transition-colors flex items-center gap-2"
                  >
                    <FaUserPlus size={14} /> Join Community
                  </button>
                )}
              </div>
            </div>

            {/* Community Stats */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#382110]/10 flex items-center justify-center">
                  <FaUsers className="text-[#382110]" size={14} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Members</p>
                  <p className="font-bold text-lg text-[#382110]">{selectedCommunity.member_count}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#d37e2f]/10 flex items-center justify-center">
                  <FaBook className="text-[#d37e2f]" size={14} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Posts</p>
                  <p className="font-bold text-lg text-[#d37e2f]">{communityPosts.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Create Post Form (Only for members) */}
          {selectedCommunity.can_post ? (
            <div className="bg-white rounded-xl shadow-sm border border-[#e8e0d5] p-4 mb-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {currentUser.name && (
                    <div className="w-full h-full flex items-center justify-center bg-[#382110] text-white font-bold">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder={`What's on your mind in ${selectedCommunity.title}?`}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#382110]/30 focus:border-[#382110] resize-none"
                    rows={3}
                  />
                  
                  {newPost.image_url && (
                    <div className="mt-3 relative">
                      <img 
                        src={newPost.image_url} 
                        alt="Preview" 
                        className="w-full max-h-64 object-contain rounded-lg bg-gray-100"
                      />
                      <button
                        onClick={() => setNewPost({ ...newPost, image_url: "" })}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                      >
                        <FaTimes size={14} />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-[#382110] transition-colors"
                        title="Add image"
                      >
                        <FaCamera size={18} />
                      </button>
                    </div>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPost.content.trim()}
                      className={`px-5 py-2 rounded-full flex items-center gap-2 font-medium ${
                        newPost.content.trim()
                          ? 'bg-[#382110] text-white hover:bg-[#2a180c]'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      } transition-colors`}
                    >
                      <FaPaperPlane /> Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Join Prompt for non-members */
            !selectedCommunity.is_member && (
              <div className="bg-gradient-to-r from-[#382110]/10 to-[#d37e2f]/10 rounded-xl border-2 border-dashed border-[#382110]/30 p-6 text-center mb-6">
                <FaUsers className="text-[#382110] text-3xl mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[#382110] mb-2">Join to Participate</h3>
                <p className="text-gray-600 mb-4">Join this community to view and create posts</p>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-6 py-3 bg-[#382110] text-white rounded-full font-medium hover:bg-[#2a180c] transition-colors flex items-center gap-2 mx-auto"
                >
                  <FaUserPlus /> Join {selectedCommunity.title}
                </button>
              </div>
            )
          )}

          {/* Posts Feed */}
          <div>
            {loadingPosts ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#382110]"></div>
              </div>
            ) : communityPosts.length > 0 ? (
              <div>
                <h3 className="font-bold text-[#382110] text-lg mb-4">Recent Posts</h3>
                {communityPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-[#e8e0d5] p-8 text-center">
                <FaBook className="text-gray-300 text-4xl mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-500 mb-2">No posts yet</h3>
                <p className="text-gray-400">
                  {selectedCommunity.can_post 
                    ? "Be the first to share something in this community!" 
                    : "Join the community to see posts"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Join Modal */}
        <AnimatePresence>
          {showJoinModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-bold text-[#382110] mb-4">Join Community</h3>
                <p className="text-gray-600 mb-6">
                  You're about to join <span className="font-bold">{selectedCommunity.title}</span>. 
                  Once joined, you'll be able to view and create posts in this community.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleJoinCommunity(selectedCommunity.id)}
                    className="px-4 py-2 bg-[#382110] text-white rounded-full font-medium hover:bg-[#2a180c]"
                  >
                    Join Community
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Leave Modal */}
        <AnimatePresence>
          {showLeaveModal && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-bold text-[#382110] mb-4">Leave Community</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to leave <span className="font-bold">{selectedCommunity.title}</span>? 
                  You'll no longer be able to view or create posts in this community.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowLeaveModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleLeaveCommunity(selectedCommunity.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700"
                  >
                    Leave Community
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Post Modal */}
        <AnimatePresence>
          {showDeletePostModal && postToDelete && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-bold text-[#382110] mb-4">Delete Post</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this post? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowDeletePostModal(false);
                      setPostToDelete(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="px-4 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700"
                  >
                    Delete Post
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
    <div className="min-h-screen bg-gradient-to-b from-[#f9f6f0] to-white py-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#382110] mb-2">Communities</h1>
              <p className="text-gray-600">
                Join book clubs, share reviews, and connect with fellow readers
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[#382110] text-white rounded-full font-medium hover:bg-[#2a180c] transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <FaPlus /> Create Community
            </button>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-[#e8e0d5] p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search communities..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#382110]/30 focus:border-[#382110]"
                  />
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-[#382110] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All Categories' : category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Communities Grid */}
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

            {/* Pagination */}
            {totalCommunities > communitiesPerPage && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                          <span className="px-2">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-lg ${
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
                    onClick={() => setCurrentPage(prev => prev + 1)}
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
            <h3 className="text-xl font-bold text-gray-500 mb-2">No communities found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Be the first to create a community!'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[#382110] text-white rounded-full font-medium hover:bg-[#2a180c] transition-colors inline-flex items-center gap-2"
            >
              <FaPlus /> Create First Community
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
                      {categories.filter(cat => cat !== 'all').map((category) => (
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
                              ? 'Anyone can join and see posts' 
                              : 'Only invited members can join'}
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
                    Create Community
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

