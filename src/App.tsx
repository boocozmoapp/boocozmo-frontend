// src/App.tsx - COMPLETE FIXED VERSION with MyLibraryScreen
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import SplashScreen from "./pages/SplashScreen";
import HomeScreen from "./pages/HomeScreen";
import OfferScreen from "./pages/OfferScreen";
import ProfileScreen from "./pages/ProfileScreen";
import LoginScreen from "./pages/LoginScreen";
import SignupScreen from "./pages/SignupScreen";
import MapScreen from "./pages/MapScreen";
import ChatScreen from "./pages/ChatScreen";
import SingleChat from "./pages/SingleChat";
import OfferDetailScreen from "./pages/OfferDetailScreen";
import MyLibraryScreen from "./pages/MyLibraryScreen"; // ADD THIS IMPORT
import "leaflet/dist/leaflet.css";

const API_BASE = "https://boocozmo-api.onrender.com";

// Full user type with token
type User = {
  email: string;
  name: string;
  id: string;
  token: string;
} | null;

function AppContent() {
  const [user, setUser] = useState<User>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeUser = async () => {
      const saved = localStorage.getItem("user");
      if (saved) {
        try {
          const parsedUser = JSON.parse(saved) as User;

          if (parsedUser && parsedUser.token && parsedUser.email) {
            // Validate session with backend
            const response = await fetch(`${API_BASE}/validate-session`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: parsedUser.email }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.valid) {
                setUser(parsedUser);
              } else {
                localStorage.removeItem("user");
                setUser(null);
              }
            } else {
              localStorage.removeItem("user");
              setUser(null);
            }
          } else {
            localStorage.removeItem("user");
            setUser(null);
          }
        } catch (error) {
          console.error("Error loading user:", error);
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      setIsLoadingUser(false);
    };

    initializeUser();
  }, []);

  // Now correctly receives full user with token
  const handleAuthSuccess = (userData: { email: string; name: string; id: string; token: string }) => {
    const fullUser: User = {
      email: userData.email,
      name: userData.name,
      id: userData.id.toString(),
      token: userData.token,
    };

    localStorage.setItem("user", JSON.stringify(fullUser));
    setUser(fullUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const goTo = (path: string) => {
  return () => {
    navigate(path);
  };
};

  if (isLoadingUser) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#64748b",
          background: "#f5f0e6",
          fontFamily: "'Georgia', serif",
        }}
      >
        Loading your library...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          user ? (
            <HomeScreen
              currentUser={user}
              onAddPress={goTo("/offer")}
              onProfilePress={goTo("/profile")}
              onMapPress={goTo("/map")}
            />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      <Route
        path="/signup"
        element={
          user ? (
            <HomeScreen
              currentUser={user}
              onAddPress={goTo("/offer")}
              onProfilePress={goTo("/profile")}
              onMapPress={goTo("/map")}
            />
          ) : (
            <SignupScreen
              onSignupSuccess={handleAuthSuccess}
              onGoToLogin={goTo("/login")}
            />
          )
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          user ? (
            <HomeScreen
              currentUser={user}
              onAddPress={goTo("/offer")}
              onProfilePress={goTo("/profile")}
              onMapPress={goTo("/map")}
            />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      <Route
        path="/offer"
        element={
          user ? (
            <OfferScreen
              onBack={goTo("/")}
              currentUser={user}
              onProfilePress={goTo("/profile")}
              onMapPress={goTo("/map")}
              onAddPress={goTo("/offer")}
            />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      <Route
        path="/offer/:id"
        element={
          user ? (
            <OfferDetailScreen currentUser={user} />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      <Route
        path="/profile"
        element={
          user ? (
            <ProfileScreen onLogout={handleLogout} currentUser={user} />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      <Route
  path="/map"
  element={
    user ? (
      <MapScreen currentUser={user}/>
    ) : (
      <LoginScreen
        onLoginSuccess={handleAuthSuccess}
        onGoToSignup={goTo("/signup")}
      />
    )
  }
/>

      <Route
        path="/chat"
        element={
          user ? (
            <ChatScreen currentUser={user} />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      <Route
        path="/chat/:chatId"
        element={
          user ? (
            <SingleChat currentUser={user} />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />

      {/* ADD THIS NEW ROUTE - My Library Screen */}
      <Route
        path="/my-library"
        element={
          user ? (
            <MyLibraryScreen
              currentUser={user}
              onBack={goTo("/")}
            />
          ) : (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onGoToSignup={goTo("/signup")}
            />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      {showSplash ? <SplashScreen onFinish={() => setShowSplash(false)} /> : <AppContent />}
    </BrowserRouter>
  );
}