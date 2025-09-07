import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthContext } from '../AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import NetInfo from '@react-native-community/netinfo';
import io, { Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { AppState, AppStateStatus } from 'react-native';

type RootStackParamList = {
  Home: undefined;
  Search: undefined;
  Offers: undefined;
  Chat: { chatId?: number };
  Profile: undefined;
  Settings: undefined;
};

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

interface Chat {
  id: string;
  user1: string;
  user2: string;
  offer_id: string;
  offer_title: string;
  other_user_name: string;
  unread: boolean;
}

interface Message {
  id: string;
  chat_id: string;
  senderEmail: string;
  content: string;
}

interface Offer {
  id: string;
  state: 'open' | 'closed';
  title: string;
}

interface AuthContextType {
  user: { name?: string; email?: string; avatar?: string } | null;
  receiverEmail: string | null;
  setReceiverEmail: (email: string | null) => void;
  currentOffer: { id: string } | null;
  setCurrentOffer: (offer: { id: string } | null) => void;
  hasNewMessages: boolean;
  setHasNewMessages: (hasNew: boolean) => void;
}

export default function ChatScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Montserrat_400Regular,
    Montserrat_700Bold,
  });
  const { user, receiverEmail, setReceiverEmail, currentOffer, setHasNewMessages } = useContext(AuthContext) as AuthContextType;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ChatScreenProps['route']>();
  const userEmail = user?.email;
  const offerId = currentOffer?.id;
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [dealClosed, setDealClosed] = useState(false);
  const [closingDeal, setClosingDeal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const socket = useRef<Socket | null>(null);
  const sidebarAnim = useRef(new Animated.Value(0)).current;
  const appState = useRef(AppState.currentState);
  const messageListRef = useRef<FlatList<Message>>(null);

  // Initialize Socket.IO with reconnection
  useEffect(() => {
    socket.current = io('https://834a32e433da.ngrok-free.app', {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.current.on('connect', () => {
      console.log('Socket connected');
    });

    socket.current.on('connect_error', (err) => {
      console.log('Socket connection error:', err.message);
      Alert.alert('Connection Error', 'Failed to connect to chat server. Please try again later.');
    });

    return () => {
      socket.current?.disconnect();
      console.log('Socket disconnected');
    };
  }, []);

  // Animate sidebar
  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: sidebarOpen ? 0 : -160,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen]);

  // Check network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);
      if (!connected) {
        Alert.alert('No Internet Connection', 'Please check your network and try again.');
        socket.current?.disconnect();
        setChats([]);
        setMessages([]);
        setSelectedChat(null);
        setSelectedOffer(null);
        setHasNewMessages(false);
        console.log('Network disconnected, cleared state');
      } else {
        socket.current?.connect();
        console.log('Network connected, socket initialized');
      }
    });
    return () => unsubscribe();
  }, [setHasNewMessages]);

  // Fetch chats
  const fetchChats = async () => {
    if (!userEmail || !isConnected) {
      if (!isConnected) {
        Alert.alert('Error', 'No internet connection. Please check your network.');
      } else if (!userEmail) {
        Alert.alert('Error', 'User not logged in. Please log in again.');
      }
      setChats([]);
      setHasNewMessages(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`https://834a32e433da.ngrok-free.app/chats?user=${encodeURIComponent(userEmail)}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(res.status === 400 ? 'Invalid request' : `Server error: ${res.status}`);
      }
      const text = await res.text();
      const data: Chat[] = text ? JSON.parse(text) : [];
      setChats(data);
      const hasUnread = data.some((chat) => chat.unread);
      setHasNewMessages(hasUnread);
      console.log('Fetched chats:', data, 'hasUnread:', hasUnread);
    } catch (err) {
      Alert.alert('Error', 'Failed to load chats. Please try again.');
      console.error('Error fetching chats:', err);
      setChats([]);
      setHasNewMessages(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      appState.current = nextAppState;
      if (nextAppState === 'active' && userEmail && isConnected) {
        fetchChats();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [userEmail, isConnected]);

  // Fetch chats on mount
  useEffect(() => {
    fetchChats();
  }, [userEmail, isConnected]);

  // Handle notification navigation
  useEffect(() => {
    if (route.params?.chatId && userEmail && isConnected) {
      const fetchChatDetails = async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `https://834a32e433da.ngrok-free.app/chat-details?chat_id=${route.params.chatId}&user=${encodeURIComponent(userEmail)}`,
            { headers: { 'Content-Type': 'application/json' } }
          );
          if (!res.ok) {
            throw new Error(res.status === 400 ? 'Invalid chat request' : `Server error: ${res.status}`);
          }
          const text = await res.text();
          const chat: Chat = text ? JSON.parse(text) : null;
          if (chat) {
            setSelectedChat(chat);
            console.log('Fetched chat details for chat:', route.params.chatId, chat);
          } else {
            Alert.alert('Error', 'No chat found.');
            console.error('No chat found for chatId:', route.params.chatId);
          }
        } catch (err) {
          Alert.alert('Error', 'Failed to load chat from notification.');
          console.error('Error fetching chat details:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchChatDetails();
    }
  }, [route.params?.chatId, userEmail, isConnected]);

  // Handle chat creation or selection
  useEffect(() => {
    if (!receiverEmail || !offerId || !userEmail || !isConnected) {
      if (!isConnected) {
        Alert.alert('Error', 'No internet connection. Please check your network.');
      } else if (!userEmail) {
        Alert.alert('Error', 'User not logged in. Please log in again.');
      }
      return;
    }

    const handleChat = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://834a32e433da.ngrok-free.app/find-chats?user1=${encodeURIComponent(userEmail)}&user2=${encodeURIComponent(receiverEmail)}&offer_id=${offerId}`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (!res.ok) {
          throw new Error(res.status === 400 ? 'Invalid chat request' : `Server error: ${res.status}`);
        }
        const text = await res.text();
        const existingChats: Chat[] = text ? JSON.parse(text) : [];
        if (existingChats.length > 0) {
          setSelectedChat(existingChats[0]);
          console.log('Selected existing chat:', existingChats[0]);
        } else {
          const createRes = await fetch('https://834a32e433da.ngrok-free.app/create-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user1: userEmail,
              user2: receiverEmail,
              offer_id: offerId,
            }),
          });
          if (!createRes.ok) {
            throw new Error(createRes.status === 400 ? 'Invalid chat creation' : `Server error: ${createRes.status}`);
          }
          const textCreate = await createRes.text();
          const newChat: Chat = textCreate ? JSON.parse(textCreate) : null;
          if (newChat) {
            setSelectedChat(newChat);
            setChats((prev) => [newChat, ...prev.filter((chat) => chat.id !== newChat.id)]);
            console.log('Created new chat:', newChat);
            fetchChats();
          }
        }
        setReceiverEmail(null);
      } catch (err) {
        Alert.alert('Error', 'Failed to load or create chat. Please try again.');
        console.error('Error handling chat:', err);
      } finally {
        setLoading(false);
      }
    };

    handleChat();
  }, [receiverEmail, offerId, userEmail, isConnected, setReceiverEmail]);

  // Socket listener for new messages
  useEffect(() => {
    if (!userEmail || !isConnected || !socket.current) return;

    const listener = async (message: Message) => {
      if (!message.chat_id || !message.senderEmail || !message.content) {
        console.error('Invalid message format:', message);
        return;
      }

      if (selectedChat && message.chat_id === selectedChat.id) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === message.id)) return prev;
          const updatedMessages = [...prev, message];
          setTimeout(() => messageListRef.current?.scrollToEnd({ animated: true }), 100);
          return updatedMessages;
        });
      }

      try {
        const res = await fetch(`https://834a32e433da.ngrok-free.app/chats?user=${encodeURIComponent(userEmail)}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error(`Failed to fetch chats: ${res.status}`);
        const text = await res.text();
        const data: Chat[] = text ? JSON.parse(text) : [];
        setChats(data);
        const hasUnread = data.some((chat) => chat.unread);
        setHasNewMessages(hasUnread);
        console.log('Updated chats after new message, hasUnread:', hasUnread, 'Chats:', data);

        if (appState.current === 'active' && selectedChat && message.chat_id === selectedChat.id) {
          const markReadRes = await fetch(
            `https://834a32e433da.ngrok-free.app/mark-read?chat_id=${selectedChat.id}&user=${encodeURIComponent(userEmail)}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' } }
          );
          if (markReadRes.ok) {
            setChats((prev) =>
              prev.map((chat) =>
                chat.id === selectedChat.id ? { ...chat, unread: false } : chat
              )
            );
            const hasOtherUnread = data.some((chat) => chat.id !== selectedChat.id && chat.unread);
            setHasNewMessages(hasOtherUnread);
            console.log('Marked read for current chat:', selectedChat.id, 'hasOtherUnread:', hasOtherUnread);
          }
        } else {
          setHasNewMessages(true);
          console.log('Set hasNewMessages to true for chat:', message.chat_id);
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to update chats after new message.');
        console.error('Error updating chats after new message:', err);
      }
    };

    socket.current.on('new_message', listener);
    return () => {
      socket.current?.off('new_message', listener);
    };
  }, [userEmail, isConnected, selectedChat, setHasNewMessages]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat || !isConnected || !userEmail) {
      if (!isConnected) {
        Alert.alert('Error', 'No internet connection. Please check your network.');
      } else if (!userEmail) {
        Alert.alert('Error', 'User not logged in. Please log in again.');
      }
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://834a32e433da.ngrok-free.app/chat-messages?chat_id=${selectedChat.id}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          throw new Error(res.status === 400 ? 'Invalid request' : `Server error: ${res.status}`);
        }
        const text = await res.text();
        const data: { messages: Message[] } = text ? JSON.parse(text) : { messages: [] };
        setMessages(data.messages);
        console.log('Fetched messages for chat:', selectedChat.id, data.messages);

        if (appState.current === 'active') {
          const markReadRes = await fetch(
            `https://834a32e433da.ngrok-free.app/mark-read?chat_id=${selectedChat.id}&user=${encodeURIComponent(userEmail)}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' } }
          );
          if (markReadRes.ok) {
            setChats((prev) =>
              prev.map((chat) =>
                chat.id === selectedChat.id ? { ...chat, unread: false } : chat
              )
            );
            const hasUnread = chats.some((chat) => chat.id !== selectedChat.id && chat.unread);
            setHasNewMessages(hasUnread);
            console.log('Messages marked read for chat:', selectedChat.id, 'hasUnread:', hasUnread);
          }
        }
        setTimeout(() => messageListRef.current?.scrollToEnd({ animated: true }), 100);
      } catch (err) {
        Alert.alert('Error', 'Failed to load messages. Please try again.');
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    socket.current?.emit('join_chat', selectedChat.id);
  }, [selectedChat, userEmail, isConnected, setHasNewMessages, chats]);

  // Fetch offer details
  useEffect(() => {
    if (!selectedChat || !userEmail || !isConnected) {
      if (!isConnected) {
        Alert.alert('Error', 'No internet connection. Please check your network.');
      } else if (!userEmail) {
        Alert.alert('Error', 'User not logged in. Please log in again.');
      }
      return;
    }

    const fetchOffer = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://834a32e433da.ngrok-free.app/my-offers?email=${encodeURIComponent(userEmail)}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          throw new Error(res.status === 400 ? 'Invalid request' : `Server error: ${res.status}`);
        }
        const text = await res.text();
        const offers: Offer[] = text ? JSON.parse(text) : [];
        const offer = offers.find((o) => o.id === selectedChat.offer_id);
        setSelectedOffer(offer || null);
        setDealClosed(offer?.state === 'closed' || false);
        console.log('Fetched offer details:', offer);
      } catch (err) {
        Alert.alert('Error', 'Failed to load offer details. Please try again.');
        console.error('Error fetching offer:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [selectedChat, userEmail, isConnected]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || dealClosed || !isConnected || !userEmail) {
      if (!isConnected) {
        Alert.alert('Error', 'No internet connection. Please check your network.');
      } else if (dealClosed) {
        Alert.alert('Error', 'Cannot send messages in a closed deal.');
      } else if (!userEmail) {
        Alert.alert('Error', 'User not logged in. Please log in again.');
      }
      return;
    }

    const otherEmail = selectedChat.user1 === userEmail ? selectedChat.user2 : selectedChat.user1;

    setLoading(true);
    try {
      const res = await fetch('https://834a32e433da.ngrok-free.app/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: userEmail,
          receiver: otherEmail,
          content: newMessage.trim(),
          chat_id: selectedChat.id,
        }),
      });
      if (!res.ok) {
        throw new Error(res.status === 400 ? 'Invalid message' : `Server error: ${res.status}`);
      }
      const text = await res.text();
      const message: Message = text ? JSON.parse(text) : null;
      if (message) {
        setMessages((prev) => [...prev, message]);
        setTimeout(() => messageListRef.current?.scrollToEnd({ animated: true }), 100);
      }
      setNewMessage('');
      console.log('Message sent:', message);
    } catch (err) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  // Close deal
  const handleCloseDeal = async () => {
    if (!selectedChat || dealClosed || !isConnected || !userEmail) {
      if (!isConnected) {
        Alert.alert('Error', 'No internet connection. Please check your network.');
      } else if (!userEmail) {
        Alert.alert('Error', 'User not logged in. Please log in again.');
      } else if (dealClosed) {
        Alert.alert('Error', 'Deal is already closed.');
      }
      return;
    }

    setClosingDeal(true);
    try {
      const res = await fetch('https://834a32e433da.ngrok-free.app/close-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: selectedChat.offer_id }),
      });
      if (!res.ok) {
        throw new Error(`Failed to close deal: ${res.status}`);
      }
      Alert.alert('Success', 'Deal closed successfully!');
      setDealClosed(true);
      setSelectedOffer((prev) => (prev ? { ...prev, state: 'closed' } : null));
      console.log('Deal closed for offer:', selectedChat.offer_id);
    } catch (err) {
      Alert.alert('Error', 'Could not close the deal. Please try again.');
      console.error('Error closing deal:', err);
    } finally {
      setClosingDeal(false);
    }
  };

  const isOwner = !!selectedOffer;

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0288d1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Constants.statusBarHeight }]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0288d1" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: sidebarAnim }],
            width: sidebarOpen ? 160 : 0,
            opacity: sidebarOpen ? 1 : 0,
          },
        ]}
      >
        {sidebarOpen && (
          <>
            <TouchableOpacity
              onPress={() => {
                console.log('Sidebar toggle clicked, closing sidebar');
                setSidebarOpen(false);
              }}
              style={styles.sidebarToggle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#0288d1" />
            </TouchableOpacity>
            <FlatList
              data={chats}
              keyExtractor={(chat) => chat.id}
              renderItem={({ item: chat }) => (
                <TouchableOpacity
                  style={[styles.chatItem, selectedChat?.id === chat.id && styles.selectedChat]}
                  onPress={() => {
                    console.log('Selected chat:', chat.id);
                    setSelectedChat(chat);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chatName}>{chat.other_user_name || 'Unknown'}</Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {chat.offer_title || 'No title'}
                  </Text>
                  <Text style={styles.offerIdText}>Offer ID: {chat.offer_id}</Text>
                  {chat.unread && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.noChatText}>No chats available</Text>
              }
            />
          </>
        )}
      </Animated.View>
      <View style={styles.chatArea}>
        {!sidebarOpen && (
          <TouchableOpacity
            style={styles.reopenSidebarButton}
            onPress={() => {
              console.log('Reopening sidebar');
              setSidebarOpen(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={24} color="#0288d1" />
          </TouchableOpacity>
        )}
        {selectedChat ? (
          <>
            {dealClosed && (
              <View style={styles.dealClosedBanner}>
                <Text style={styles.dealClosedText}>This offer is now closed.</Text>
              </View>
            )}
            <Text style={[styles.chatHeader, dealClosed && styles.chatHeaderClosed]}>
              {selectedChat.other_user_name || 'Unknown'} {'\n'}
              <Text style={styles.offerTitle}>Offer: {selectedChat.offer_title || 'No title'}</Text>
            </Text>
            <FlatList
              ref={messageListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.messageBubble,
                    item.senderEmail === userEmail ? styles.myMessage : styles.theirMessage,
                    dealClosed && styles.messageBubbleClosed,
                  ]}
                >
                  <Text style={styles.messageText}>{item.content}</Text>
                </View>
              )}
            />
            {isOwner && (
              <TouchableOpacity
                style={[styles.closeDealButton, (dealClosed || closingDeal) && styles.closeDealButtonDisabled]}
                onPress={handleCloseDeal}
                disabled={dealClosed || closingDeal}
                activeOpacity={0.7}
              >
                <Text style={styles.closeDealButtonText}>
                  {closingDeal ? 'Closing Deal...' : dealClosed ? 'Deal Closed' : 'Close Deal'}
                </Text>
              </TouchableOpacity>
            )}
            <View style={styles.inputBar}>
              <TextInput
                style={[styles.input, dealClosed && styles.inputDisabled]}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type a message"
                placeholderTextColor="#999"
                editable={!dealClosed}
              />
              <TouchableOpacity
                onPress={sendMessage}
                style={[styles.sendButton, dealClosed && styles.sendButtonDisabled]}
                disabled={dealClosed}
                activeOpacity={0.7}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.noChatText}>Select a chat from the sidebar</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingOverlay: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    right: '20%',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0288d1',
    fontFamily: 'Poppins_600SemiBold',
  },
  sidebar: {
    backgroundColor: '#ffffff',
    paddingTop: 20,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 20,
  },
  sidebarToggle: {
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  reopenSidebarButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 10,
    zIndex: 30,
  },
  chatItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  selectedChat: {
    backgroundColor: '#e6f0fa',
  },
  chatName: {
    color: '#1e293b',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
   

  },
  lastMessage: {
    color: '#64748b',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 4,
  },
  offerIdText: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  chatArea: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  chatHeader: {
    color: '#1e293b',
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
     justifyContent:'center',
    alignSelf:'center',
  },
  chatHeaderClosed: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  offerTitle: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Poppins_400Regular',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  myMessage: {
    backgroundColor: '#0288d1',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: '#1e293b',
    alignSelf: 'flex-start',
  },
  messageBubbleClosed: {
    opacity: 0.7,
  },
  messageText: {
    color: '#ffffff',
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  inputBar: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  inputDisabled: {
    backgroundColor: '#e5e7eb',
    color: '#94a3b8',
  },
  sendButton: {
    marginLeft: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0288d1',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  sendButtonText: {
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  closeDealButton: {
    backgroundColor: '#0288d1',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  closeDealButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  closeDealButtonText: {
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  dealClosedBanner: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    alignItems: 'center',
  },
  dealClosedText: {
    color: '#dc2626',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  noChatText: {
    color: '#1e293b',
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});