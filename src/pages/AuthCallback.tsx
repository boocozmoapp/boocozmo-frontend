// src/pages/AuthCallback.tsx - HMR-PROOF REDIRECT
import { useEffect, useRef } from "react";

const AuthCallback = ({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) => {
  const processedRef = useRef(false);

  useEffect(() => {
    // 1. Strict double-execution prevention
    if (processedRef.current) return;
    processedRef.current = true;

    console.log("🔄 Auth: Loading token and fighting Vite HMR...");
    
    // Check both hash and search
    const hashData = window.location.hash.substring(1);
    const searchData = window.location.search.substring(1);
    const params = new URLSearchParams(hashData || searchData);
    const accessToken = params.get("access_token");
    
    if (!accessToken) {
      console.error("❌ No access token found");
      window.location.replace("/login");
      return;
    }
    
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const user = {
        id: `supa_${payload.sub}`,
        name: payload.user_metadata?.name || payload.email?.split('@')[0] || "User",
        email: payload.email,
        token: accessToken,
      };
      
      console.log("✅ Auth: Handover successful. Storing and redirecting...");
      
      // 2. IMMEDIATE PERSISTENCE
      // Save to BOTH to beat browser tracking prevention and session resets
      try {
        localStorage.setItem("user", JSON.stringify(user));
        sessionStorage.setItem("user", JSON.stringify(user));
      } catch (e) {
        console.error("Storage Error:", e);
      }

      // 3. Update App State (In-Memory)
      onLoginSuccess(user);

      // 4. THE VITE KILLER: Zero-delay Hard Redirect
      // We use window.location.replace to KILL the current process at /auth/callback
      // and start a fresh app at /home. This prevents HMR from resetting state mid-flow.
      window.location.replace("/home");
      
    } catch (err) {
      console.error("❌ Auth Processing Error:", err);
      window.location.replace("/login");
    }
  }, [onLoginSuccess]);

  return (
    <div className="h-screen bg-[#fdfaf5] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#382110] mx-auto mb-4"></div>
        <p className="text-xl font-bold font-serif text-[#382110]">Lancement de votre session...</p>
      </div>
    </div>
  );
};

export default AuthCallback;