// src/pages/AuthCallback.tsx - SIMPLE WORKING VERSION
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://boocozmo-api.onrender.com";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔄 AuthCallback: Starting...");
    console.log("🔍 Full URL:", window.location.href);
    
    // Check HASH for token (Supabase puts it here)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    
    const accessToken = hashParams.get("access_token");
    const error = hashParams.get("error");
    
    console.log("Hash params:", hashParams.toString());
    console.log("Access token:", accessToken ? "FOUND ✓" : "NOT FOUND ✗");
    
    if (error) {
      console.error("❌ Error:", error);
      alert(`Login error: ${error}`);
      navigate("/login");
      return;
    }
    
    if (!accessToken) {
      console.error("❌ No access token in hash");
      alert("Login failed: No token received");
      navigate("/login");
      return;
    }
    
    console.log("✅ Got Supabase token from hash");
    
    // Process the token
    try {
      // Decode JWT to get user info
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      console.log("📋 Token payload:", payload);
      
      const userEmail = payload.email;
      const userName = payload.user_metadata?.name || payload.email?.split('@')[0] || "User";
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
      
      // Clean the URL (remove hash)
      window.history.replaceState({}, document.title, "/auth/callback");
      
      // Redirect to home
      setTimeout(() => {
        console.log("🚀 Redirecting to home...");
        window.location.href = "/home";
      }, 100);
      
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