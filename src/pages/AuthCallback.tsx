// src/pages/AuthCallback.tsx - FIXED VERSION
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

const AuthCallback = ({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔄 AuthCallback: Starting...");
    console.log("🔍 Full URL:", window.location.href);
    console.log("🔍 Hash:", window.location.hash);
    console.log("🔍 Search:", window.location.search);
    
    // Parse BOTH hash AND query parameters
    const hash = window.location.hash.substring(1);
    const search = window.location.search.substring(1);
    
    // Supabase puts token in hash, but let's check both
    let accessToken = null;
    let error = null;
    
    // First, try to parse hash (most common for Supabase)
    if (hash) {
      // Parse hash fragment manually
      const hashParams = new URLSearchParams(hash);
      accessToken = hashParams.get("access_token");
      error = hashParams.get("error");
    }
    
    // If not in hash, check query params
    if (!accessToken && search) {
      const searchParams = new URLSearchParams(search);
      accessToken = searchParams.get("access_token") || accessToken;
      error = searchParams.get("error") || error;
    }
    
    console.log("Access token found:", accessToken ? "YES ✓" : "NO ✗");
    console.log("Error found:", error || "None");
    
    if (error) {
      console.error("❌ Error:", error);
      alert(`Login error: ${error}`);
      navigate("/login");
      return;
    }
    
    if (!accessToken) {
      console.error("❌ No access token found");
      console.log("Hash content:", hash);
      console.log("Search content:", search);
      
      // Check if we have a refresh token instead
      const refreshToken = hash.includes("refresh_token") || search.includes("refresh_token");
      if (refreshToken) {
        console.log("Found refresh token instead");
      }
      
      alert("Login failed: No token received. Please try again.");
      navigate("/login");
      return;
    }
    
    console.log("✅ Got Supabase token");
    
    // Process the token
    try {
      // Decode JWT to get user info
      const parts = accessToken.split('.');
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }
      
      const payload = JSON.parse(atob(parts[1]));
      console.log("📋 Token payload:", payload);
      
      const userEmail = payload.email;
      const userName = payload.user_metadata?.name || 
                      payload.email?.split('@')[0] || 
                      "User";
      const userId = payload.sub; // Supabase user ID
      
      if (!userEmail) {
        throw new Error("No email in token");
      }
      
      console.log(`👤 User: ${userEmail}, Name: ${userName}`);
      
      // Create user object
      const user = {
        id: `supa_${userId}`,
        name: userName,
        email: userEmail,
        token: accessToken,
      };
      
      // Save to localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", accessToken);
      
      console.log("💾 Saved user to localStorage:", userEmail);
      
      // Update application state immediately
      onLoginSuccess(user);
      
      // Clean the URL (remove hash and query params)
      window.history.replaceState({}, document.title, "/home");
      
      // Navigate to home immediately
      console.log("🚀 Navigating to home...");
      navigate("/home", { replace: true });
      
    } catch (err) {
      console.error("❌ Error processing token:", err);
      alert("Login failed. Please try again.");
      navigate("/login");
    }
    
  }, [navigate]);

  return (
    <div className="h-screen bg-[#f4f1ea] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#382110] mx-auto mb-4"></div>
        <p className="text-[#382110] font-serif">Completing Google login...</p>
        <p className="text-sm text-[#555] mt-2">Please wait a moment</p>
      </div>
    </div>
  );
};

export default AuthCallback;