import React, { createContext, useState, useEffect, ReactNode } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

interface User {
  email: string;
  name?: string;
}

interface Offer {
  id: number;
  type: "sell" | "exchange" | "buy";
  bookTitle: string;
  exchangeBook: string | null;
  price: number | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  condition: string | null;
  ownerEmail: string;
  state: string;
  created_at: string;
}

interface Chat {
  unread: boolean;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loggedIn: boolean;
  setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  receiverEmail: string | null;
  setReceiverEmail: React.Dispatch<React.SetStateAction<string | null>>;
  hasNewMessages: boolean;
  setHasNewMessages: React.Dispatch<React.SetStateAction<boolean>>;
  lastMessage: Message | null;
  setLastMessage: React.Dispatch<React.SetStateAction<Message | null>>;
  currentOffer: Offer | null;
  setCurrentOffer: React.Dispatch<React.SetStateAction<Offer | null>>;
  login: (userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loggedIn: false,
  setLoggedIn: () => {},
  receiverEmail: null,
  setReceiverEmail: () => {},
  hasNewMessages: false,
  setHasNewMessages: () => {},
  lastMessage: null,
  setLastMessage: () => {},
  currentOffer: null,
  setCurrentOffer: () => {},
  login: () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [receiverEmail, setReceiverEmail] = useState<string | null>(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (userData: User) => {
    setUser(userData);
    setLoggedIn(true);
  };

  const logout = () => {
    setUser(null);
    setLoggedIn(false);
    setReceiverEmail(null);
    setHasNewMessages(false);
    setLastMessage(null);
    setCurrentOffer(null);
  };

  useEffect(() => {
    // Simulate async auth check (replace with AsyncStorage or Firebase in production)
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (!loggedIn || !user?.email) {
      setHasNewMessages(false);
      return;
    }

    const checkUnreadMessages = async (retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          console.log("AuthContext: Fetching chats for", user.email);
          const res = await fetch(
            `https://524060c0e912.ngrok-free.app/chats?user=${encodeURIComponent(
              user.email
            )}`
          );
          if (!res.ok) throw new Error(`Failed to fetch chats: ${res.status}`);
          const text = await res.text();
          const data: Chat[] = text ? JSON.parse(text) : [];
          const hasUnread = data.some((chat) => chat.unread);
          setHasNewMessages(hasUnread);
          console.log(
            "AuthContext: Fetched chats, hasUnread:",
            hasUnread,
            "Chats:",
            data
          );
          return;
        } catch (err) {
          console.error(
            `AuthContext: Error checking unread messages (attempt ${i + 1}):`,
            err
          );
          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            setHasNewMessages(false);
          }
        }
      }
    };

    checkUnreadMessages();
  }, [loggedIn, user?.email]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8511bfff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loggedIn,
        setLoggedIn,
        receiverEmail,
        setReceiverEmail,
        hasNewMessages,
        setHasNewMessages,
        lastMessage,
        setLastMessage,
        currentOffer,
        setCurrentOffer,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8511bfff",
  },
});
