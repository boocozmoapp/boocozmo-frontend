// src/pages/CommunityScreen.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBookOpen,
  FaMapMarkedAlt,
  FaPlus,
  FaComments,
  FaUser,
  FaClock,
  FaFire,
  FaHeart,
  FaShareAlt,
  FaUsers,
  FaHashtag,
  FaChevronRight,
  FaSearch,
  FaCrown} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

type ViewMode = "feed" | "salons";

export default function CommunityScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const [feedFilter, setFeedFilter] = useState<"latest" | "popular" | "following">("latest");
  const [salonFilter, setSalonFilter] = useState<"active" | "popular" | "new">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [joinedSalons, setJoinedSalons] = useState<number[]>([1]);
  const navigate = useNavigate();

  // Bronze color palette
  const BRONZE = {
    primary: "#CD7F32",
    light: "#E6B17E",
    dark: "#B87333",
    pale: "#F5E7D3",
    shimmer: "#FFD700",
    bg: "#F9F5F0",
  };

  const mockFeedPosts = [
    {
      id: 1,
      username: "bookworm_annie",
      displayName: "Annie Bookworm",
      timestamp: "Just now",
      content: "Do we need another Aligarh movement for literary enlightenment? What do you think about reviving the spirit of intellectual discourse through books? 📚",
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=400&fit=crop",
      likes: 42,
      comments: 18,
      shares: 7,
      isYou: true,
      tags: ["Philosophy", "History", "Discussion"],
      userColor: "#4CAF50",
    },
    {
      id: 2,
      username: "literary_explorer",
      displayName: "Samuel Reader",
      timestamp: "2 hours ago",
      content: "Just finished 'Sapiens' and it blew my mind! Anyone want to exchange thoughts on human evolution and storytelling? 🔥",
      image: null,
      likes: 89,
      comments: 34,
      shares: 12,
      isYou: false,
      tags: ["Non-fiction", "Science", "Book Review"],
      userColor: "#2196F3",
    },
    {
      id: 3,
      username: "poetry_lover",
      displayName: "Maya Verse",
      timestamp: "5 hours ago",
      content: "Sharing my favorite poetry collection from Rumi. Which poet speaks to your soul the most? Let's create a community poetry anthology! ✨",
      image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w-800&h=500&fit=crop",
      likes: 156,
      comments: 47,
      shares: 23,
      isYou: false,
      tags: ["Poetry", "Rumi", "Literature"],
      userColor: "#9C27B0",
    },
  ];

  const mockSalons = [
    {
      id: 1,
      name: "House of Philosophy",
      description: "Deep discussions on philosophical concepts, from ancient thinkers to modern philosophers.",
      members: 156,
      comments: 342,
      created: "Created 2 weeks ago",
      popular: true,
      category: "Philosophy",
      color: "#FF9800",
      icon: "🧠",
    },
    {
      id: 2,
      name: "Science Fiction & Fantasy",
      description: "Explore worlds beyond imagination with fellow sci-fi and fantasy enthusiasts.",
      members: 289,
      comments: 892,
      created: "Created 1 month ago",
      popular: true,
      category: "Fiction",
      color: "#2196F3",
      icon: "🚀",
    },
    {
      id: 3,
      name: "Classic Literature Club",
      description: "Dive into timeless classics and discuss their relevance in modern society.",
      members: 198,
      comments: 456,
      created: "Created 3 days ago",
      popular: false,
      category: "Classics",
      color: "#4CAF50",
      icon: "📜",
    },
    {
      id: 4,
      name: "Poetry & Prose",
      description: "Share your favorite poems, analyze literary works, and discuss writing techniques.",
      members: 124,
      comments: 287,
      created: "Created 1 week ago",
      popular: false,
      category: "Poetry",
      color: "#9C27B0",
      icon: "✍️",
    },
  ];

  const handleLikePost = (postId: number) => {
    if (likedPosts.includes(postId)) {
      setLikedPosts(likedPosts.filter(id => id !== postId));
    } else {
      setLikedPosts([...likedPosts, postId]);
    }
  };

  const handleJoinSalon = (salonId: number) => {
    if (joinedSalons.includes(salonId)) {
      setJoinedSalons(joinedSalons.filter(id => id !== salonId));
    } else {
      setJoinedSalons([...joinedSalons, salonId]);
    }
  };

  const filteredSalons = mockSalons.filter(salon =>
    salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    salon.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    salon.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: BRONZE.bg, 
      display: "flex", 
      flexDirection: "column",
      fontFamily: "'Georgia', 'Times New Roman', serif",
    }}>
      {/* Fixed Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ 
          padding: "16px 16px 12px 16px", 
          background: "white", 
          borderBottom: `1px solid ${BRONZE.pale}`,
          boxShadow: "0 2px 10px rgba(205, 127, 50, 0.1)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <motion.div
              whileHover={{ rotate: 10 }}
              style={{ 
                width: "44px", 
                height: "44px", 
                borderRadius: "12px", 
                background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "20px",
                fontWeight: "bold",
              }}
            >
              C
            </motion.div>
            <div>
              <h1 style={{ 
                fontSize: "28px", 
                fontWeight: 800, 
                margin: 0, 
                color: BRONZE.dark,
                fontFamily: "'Playfair Display', serif",
                background: `linear-gradient(135deg, ${BRONZE.dark}, ${BRONZE.primary})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Community
              </h1>
              <p style={{ 
                fontSize: "13px", 
                color: "#666", 
                margin: "2px 0 0",
                letterSpacing: "0.5px",
              }}>
                Connect • Discuss • Share
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (viewMode === "feed") {
                // Open post creation modal
              } else {
                // Open salon creation modal
              }
            }}
            style={{
              background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "14px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: `0 4px 12px ${BRONZE.primary}40`,
            }}
          >
            <FaPlus size={14} />
            {viewMode === "feed" ? "New Post" : "Create Salon"}
          </motion.button>
        </div>

        {/* View Mode Tabs */}
        <div style={{ 
          display: "flex", 
          gap: "8px",
          marginBottom: viewMode === "salons" ? "16px" : "0",
        }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode("feed")}
            style={{
              padding: "12px 24px",
              borderRadius: "14px",
              border: "none",
              fontWeight: viewMode === "feed" ? "700" : "500",
              background: viewMode === "feed" ? `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})` : BRONZE.pale,
              color: viewMode === "feed" ? "white" : BRONZE.dark,
              fontSize: "14px",
              cursor: "pointer",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.3s ease",
            }}
          >
            <FaComments /> Feed
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode("salons")}
            style={{
              padding: "12px 24px",
              borderRadius: "14px",
              border: "none",
              fontWeight: viewMode === "salons" ? "700" : "500",
              background: viewMode === "salons" ? `linear-gradient(135deg, #9C27B0, #7B1FA2)` : BRONZE.pale,
              color: viewMode === "salons" ? "white" : BRONZE.dark,
              fontSize: "14px",
              cursor: "pointer",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.3s ease",
            }}
          >
            <FaUsers /> Salons
          </motion.button>
        </div>

        {/* Search Bar for Salons */}
        {viewMode === "salons" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ position: "relative", marginTop: "12px" }}
          >
            <FaSearch style={{ 
              position: "absolute", 
              left: "16px", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: BRONZE.primary,
              fontSize: "18px",
            }} />
            <input
              type="text"
              placeholder="Search salons by name, topic, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 14px 14px 48px",
                borderRadius: "14px",
                border: `1px solid ${BRONZE.light}`,
                background: "white",
                fontSize: "16px",
                color: "#333",
                transition: "all 0.3s ease",
                outline: "none",
                boxShadow: "0 2px 8px rgba(205, 127, 50, 0.08)",
              }}
              onFocus={(e) => e.target.style.borderColor = BRONZE.primary}
              onBlur={(e) => e.target.style.borderColor = BRONZE.light}
            />
          </motion.div>
        )}
      </motion.header>

      {/* Filter Tabs */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ 
          padding: "12px 16px", 
          background: BRONZE.bg,
          position: "sticky",
          top: viewMode === "salons" ? "156px" : "122px",
          zIndex: 90,
          borderBottom: `1px solid ${BRONZE.pale}`,
        }}
      >
        <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
          {viewMode === "feed" ? (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFeedFilter("latest")}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: feedFilter === "latest" ? "700" : "500",
                  background: feedFilter === "latest" ? BRONZE.primary : BRONZE.pale,
                  color: feedFilter === "latest" ? "white" : BRONZE.dark,
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                }}
              >
                <FaClock /> Latest
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFeedFilter("popular")}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: feedFilter === "popular" ? "700" : "500",
                  background: feedFilter === "popular" ? BRONZE.primary : BRONZE.pale,
                  color: feedFilter === "popular" ? "white" : BRONZE.dark,
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                }}
              >
                <FaFire /> Popular
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFeedFilter("following")}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: feedFilter === "following" ? "700" : "500",
                  background: feedFilter === "following" ? BRONZE.primary : BRONZE.pale,
                  color: feedFilter === "following" ? "white" : BRONZE.dark,
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                }}
              >
                <FaUsers /> Following
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSalonFilter("active")}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: salonFilter === "active" ? "700" : "500",
                  background: salonFilter === "active" ? "#9C27B0" : BRONZE.pale,
                  color: salonFilter === "active" ? "white" : BRONZE.dark,
                  fontSize: "14px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Most Active
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSalonFilter("popular")}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: salonFilter === "popular" ? "700" : "500",
                  background: salonFilter === "popular" ? "#9C27B0" : BRONZE.pale,
                  color: salonFilter === "popular" ? "white" : BRONZE.dark,
                  fontSize: "14px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Most Popular
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSalonFilter("new")}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: "none",
                  fontWeight: salonFilter === "new" ? "700" : "500",
                  background: salonFilter === "new" ? "#9C27B0" : BRONZE.pale,
                  color: salonFilter === "new" ? "white" : BRONZE.dark,
                  fontSize: "14px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                New & Growing
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* Content Area */}
      <div style={{ 
        flex: 1, 
        overflowY: "auto",
        padding: "16px",
        paddingBottom: "80px",
      }}>
        <AnimatePresence mode="wait">
          {viewMode === "feed" ? (
            // Feed View
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {mockFeedPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  style={{
                    background: "white",
                    borderRadius: "24px",
                    padding: "24px",
                    boxShadow: "0 8px 32px rgba(205, 127, 50, 0.12)",
                    border: `1px solid ${BRONZE.pale}`,
                  }}
                >
                  {/* Post Header */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px", 
                    marginBottom: "16px" 
                  }}>
                    <div style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      background: post.userColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "20px",
                      fontWeight: "bold",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}>
                      {post.username[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px",
                        marginBottom: "4px",
                      }}>
                        <h3 style={{ 
                          fontSize: "16px", 
                          fontWeight: 700, 
                          color: BRONZE.dark,
                          margin: 0,
                        }}>
                          {post.displayName}
                        </h3>
                        {post.isYou && (
                          <span style={{
                            background: BRONZE.primary,
                            color: "white",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}>
                            You
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px",
                        fontSize: "13px",
                        color: "#666",
                      }}>
                        <span>@{post.username}</span>
                        <span>•</span>
                        <span>{post.timestamp}</span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ rotate: 90 }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#666",
                        fontSize: "20px",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                    >
                      ⋯
                    </motion.button>
                  </div>

                  {/* Post Content */}
                  <p style={{ 
                    fontSize: "16px", 
                    color: "#333", 
                    lineHeight: 1.6,
                    margin: "0 0 20px",
                  }}>
                    {post.content}
                  </p>

                  {/* Tags */}
                  <div style={{ 
                    display: "flex", 
                    flexWrap: "wrap", 
                    gap: "8px",
                    marginBottom: "16px",
                  }}>
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: BRONZE.pale,
                          color: BRONZE.dark,
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <FaHashtag size={10} /> {tag}
                      </span>
                    ))}
                  </div>

                  {/* Post Image */}
                  {post.image && (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      style={{
                        borderRadius: "16px",
                        overflow: "hidden",
                        marginBottom: "20px",
                      }}
                    >
                      <img
                        src={post.image}
                        alt="Post content"
                        style={{
                          width: "100%",
                          height: "300px",
                          objectFit: "cover",
                        }}
                      />
                    </motion.div>
                  )}

                  {/* Post Actions */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    paddingTop: "16px",
                    borderTop: `1px solid ${BRONZE.pale}`,
                  }}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleLikePost(post.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "none",
                        border: "none",
                        color: likedPosts.includes(post.id) ? "#E91E63" : "#666",
                        fontSize: "15px",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: "8px 16px",
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <FaHeart /> {post.likes + (likedPosts.includes(post.id) ? 1 : 0)}
                    </motion.button>
                    
                    <button style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "none",
                      border: "none",
                      color: "#666",
                      fontSize: "15px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "8px 16px",
                      borderRadius: "12px",
                    }}>
                      💬 {post.comments}
                    </button>
                    
                    <button style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "none",
                      border: "none",
                      color: "#666",
                      fontSize: "15px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "8px 16px",
                      borderRadius: "12px",
                    }}>
                      <FaShareAlt /> {post.shares}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // Salons View
            <motion.div
              key="salons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {searchQuery && (
                <p style={{ 
                  fontSize: "14px", 
                  color: "#666", 
                  margin: "0 0 8px",
                  textAlign: "center",
                }}>
                  Showing results for "{searchQuery}"
                </p>
              )}

              {filteredSalons.length === 0 ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    textAlign: "center",
                    padding: "48px 20px",
                    background: "white",
                    borderRadius: "24px",
                    boxShadow: "0 8px 24px rgba(205, 127, 50, 0.1)",
                  }}
                >
                  <div style={{ fontSize: "64px", marginBottom: "16px", color: BRONZE.light }}>
                    🏛️
                  </div>
                  <h3 style={{ 
                    fontSize: "22px", 
                    fontWeight: 700, 
                    color: BRONZE.dark,
                    marginBottom: "8px",
                  }}>
                    No Salons Found
                  </h3>
                  <p style={{ 
                    fontSize: "15px", 
                    color: "#666", 
                    marginBottom: "24px",
                  }}>
                    Try a different search or create your own salon!
                  </p>
                </motion.div>
              ) : (
                filteredSalons.map((salon, index) => (
                  <motion.div
                    key={salon.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                    style={{
                      background: "white",
                      borderRadius: "24px",
                      padding: "24px",
                      boxShadow: "0 8px 32px rgba(205, 127, 50, 0.12)",
                      border: `1px solid ${BRONZE.pale}`,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Salon Header */}
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "flex-start",
                      marginBottom: "16px",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                        <div style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "16px",
                          background: salon.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "28px",
                          color: "white",
                          boxShadow: `0 6px 20px ${salon.color}40`,
                        }}>
                          {salon.icon}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h3 style={{ 
                              fontSize: "22px", 
                              fontWeight: 800, 
                              margin: "0 0 8px", 
                              color: salon.color,
                            }}>
                              {salon.name}
                            </h3>
                            {salon.popular && (
                              <FaCrown style={{ 
                                color: BRONZE.shimmer,
                                fontSize: "20px",
                              }} />
                            )}
                          </div>
                          <p style={{ 
                            fontSize: "15px", 
                            color: "#666", 
                            margin: "0 0 12px",
                            lineHeight: 1.5,
                          }}>
                            {salon.description}
                          </p>
                        </div>
                      </div>
                      
                      {salon.popular && (
                        <div style={{
                          position: "absolute",
                          top: "20px",
                          right: "20px",
                          background: "linear-gradient(135deg, #FFD700, #FF9800)",
                          color: "white",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}>
                          <FaFire /> Popular
                        </div>
                      )}
                    </div>

                    {/* Salon Stats */}
                    <div style={{ 
                      display: "flex", 
                      gap: "24px",
                      marginBottom: "20px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaUsers style={{ color: BRONZE.primary }} />
                        <span style={{ fontSize: "14px", color: "#666", fontWeight: 600 }}>
                          {salon.members} members
                        </span>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaComments style={{ color: BRONZE.primary }} />
                        <span style={{ fontSize: "14px", color: "#666", fontWeight: 600 }}>
                          {salon.comments} discussions
                        </span>
                      </div>
                      
                      <div style={{ 
                        background: BRONZE.pale,
                        color: BRONZE.dark,
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}>
                        {salon.category}
                      </div>
                    </div>

                    {/* Salon Footer */}
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      paddingTop: "16px",
                      borderTop: `1px solid ${BRONZE.pale}`,
                    }}>
                      <div style={{ fontSize: "13px", color: "#999" }}>
                        {salon.created}
                      </div>
                      
                      <div style={{ display: "flex", gap: "12px" }}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleJoinSalon(salon.id)}
                          style={{
                            background: joinedSalons.includes(salon.id) 
                              ? BRONZE.pale 
                              : `linear-gradient(135deg, ${salon.color}, ${salon.color}DD)`,
                            color: joinedSalons.includes(salon.id) ? BRONZE.dark : "white",
                            border: joinedSalons.includes(salon.id) ? `2px solid ${BRONZE.light}` : "none",
                            padding: "10px 24px",
                            borderRadius: "14px",
                            fontSize: "15px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: joinedSalons.includes(salon.id) ? "none" : `0 4px 12px ${salon.color}40`,
                          }}
                        >
                          {joinedSalons.includes(salon.id) ? "✓ Joined" : "Join Salon"}
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(`/salon/${salon.id}`)}
                          style={{
                            background: BRONZE.pale,
                            color: BRONZE.dark,
                            border: `2px solid ${BRONZE.light}`,
                            padding: "10px 20px",
                            borderRadius: "14px",
                            fontSize: "15px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          Explore <FaChevronRight size={12} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "white",
          borderTop: `1px solid ${BRONZE.pale}`,
          display: "flex",
          justifyContent: "space-around",
          padding: "12px 0",
          boxShadow: "0 -4px 20px rgba(205, 127, 50, 0.1)",
          zIndex: 100,
        }}
      >
        {[
          { Icon: FaBookOpen, label: "Home", path: "/", color: "#4CAF50" },
          { Icon: FaMapMarkedAlt, label: "Map", path: "/map", color: "#2196F3" },
          { Icon: FaPlus, label: "Post", path: "/offer", color: "#FF9800" },
          { Icon: FaComments, label: "Community", path: "/community", color: "#9C27B0", active: true },
          { Icon: FaUser, label: "Profile", path: "/profile", color: BRONZE.primary },
        ].map(({ Icon, label, path, color, active }) => (
          <motion.button
            key={label}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(path)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              color: active ? color : "#94A3B8",
              fontSize: "12px",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: active ? `${color}15` : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: active ? `2px solid ${color}30` : "none",
            }}>
              <Icon size={22} color={active ? color : "#94A3B8"} />
            </div>
            {label}
            {active && (
              <motion.div
                layoutId="navIndicator"
                style={{
                  position: "absolute",
                  bottom: "-2px",
                  width: "20px",
                  height: "3px",
                  background: color,
                  borderRadius: "2px",
                }}
              />
            )}
          </motion.button>
        ))}
      </motion.nav>
    </div>
  );
}