import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useContext,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import NetInfo from "@react-native-community/netinfo";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CompositeNavigationProp } from "@react-navigation/native";
import { AuthContext } from "../AuthContext";
import Constants from "expo-constants";

const { width } = Dimensions.get("window");

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

interface OfferWithAddress extends Offer {
  address: string;
}

type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Offers: undefined;
  Chat: { chatId?: number };
  Profile: undefined;
};

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Chat: { chatId?: number };
};

type SearchScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, "Search">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface SearchScreenProps {
  navigation: SearchScreenNavigationProp;
}

export default function SearchScreen({ navigation }: SearchScreenProps) {
  const [offers, setOffers] = useState<OfferWithAddress[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithAddress | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [offerAddress, setOfferAddress] = useState("Loading location...");
  const [isConnected, setIsConnected] = useState(true);
  const mapRef = useRef<MapView>(null);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const timer = useRef<NodeJS.Timeout | null>(null);
  const { user, setReceiverEmail, setCurrentOffer } = useContext(AuthContext);

  // Verify MapTiler API key
  const mapTilerApiKey = Constants.expoConfig?.extra?.mapTilerApiKey;
  useEffect(() => {
    if (!mapTilerApiKey) {
      setMapError("MapTiler API key is missing. Please check app configuration.");
      console.error("MapTiler API key is missing in app.json");
    }
  }, [mapTilerApiKey]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
      if (!state.isConnected) {
        setSearchError("No internet connection. Please check your network.");
        setMapError("No internet connection. Map may not load correctly.");
        Alert.alert("Error", "No internet connection. Please try again.");
      }
    });

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setMapError("Location permission is required for map functionality.");
          Alert.alert(
            "Permission Denied",
            "Location permission is required for map functionality."
          );
          return;
        }
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation(location.coords);
      } catch (error) {
        console.error("Location Error:", error);
        setMapError("Failed to fetch user location.");
      }
    })();

    fetchOffers();

    return () => {
      unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (selectedOffer?.latitude && selectedOffer?.longitude) {
      getAddressFromCoords(
        selectedOffer.latitude,
        selectedOffer.longitude
      ).then(setOfferAddress);
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: selectedOffer.latitude,
            longitude: selectedOffer.longitude,
            latitudeDelta: 0.2,
            longitudeDelta: 0.2,
          },
          400
        );
      }
    } else {
      setOfferAddress("No location available");
      Animated.timing(cardAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedOffer]);

  const fetchOffers = async () => {
    if (!isConnected) {
      setSearchError("No internet connection. Please check your network.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const url = searchQuery
        ? `https://834a32e433da.ngrok-free.app/search-offers?query=${encodeURIComponent(
            searchQuery
          )}`
        : `https://834a32e433da.ngrok-free.app/offers`;

      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Failed to fetch offers: ${response.status}`);

      const data: Offer[] = await response.json();

      const offersWithAddress = await Promise.all(
        data.map(async (offer) => {
          try {
            const location = await Location.reverseGeocodeAsync({
              latitude: offer.latitude || 31.5204,
              longitude: offer.longitude || 74.3587,
            });
            const addr = location[0];
            const address = addr
              ? `${addr.street || addr.name || ""}, ${addr.city || ""}, ${
                  addr.country || ""
                }`.trim()
              : "Unknown location";
            return { ...offer, address };
          } catch (error) {
            console.error("Reverse Geocode Error:", error);
            return { ...offer, address: "Failed to load location" };
          }
        })
      );
      setOffers(offersWithAddress);
      setSearchError(
        offersWithAddress.length === 0 ? "No results found." : null
      );

      if (offersWithAddress.length > 0 && mapRef.current) {
        const validOffers = offersWithAddress.filter(
          (offer) => offer.latitude && offer.longitude
        );
        if (validOffers.length > 0) {
          mapRef.current.animateToRegion(
            {
              latitude: validOffers[0].latitude || 31.5204,
              longitude: validOffers[0].longitude || 74.3587,
              latitudeDelta: 3.5,
              longitudeDelta: 3.5,
            },
            400
          );
        }
      }
    } catch (err: any) {
      console.error("Fetch error:", err.message);
      setSearchError("Failed to load offers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetchOffers();
    }, 800);
  }, []);

  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (address.length > 0) {
        const { street, city, region, country } = address[0];
        return `${street || ""}, ${city || ""}, ${region || ""}, ${
          country || ""
        }`.trim();
      }
      return "Unknown location";
    } catch (error) {
      console.error("Reverse Geocode Error:", error);
      return "Failed to load location";
    }
  };

  const getOfferIconColor = (type: string) => {
    if (type === "buy") return "#1E90FF";
    if (type === "sell") return "#00FF7F";
    if (type === "exchange") return "#000000";
    return "#999999";
  };

  const handleMarkerPress = (offer: OfferWithAddress) => {
    setSelectedOffer(offer);
  };

  const openChatWithOffer = (offer: OfferWithAddress) => {
    if (!user?.email || !offer.ownerEmail) {
      Alert.alert("Error", "Please log in to start a chat.");
      return;
    }
    if (user.email === offer.ownerEmail) {
      Alert.alert("Error", "You cannot start a chat for your own offer.");
      return;
    }
    setReceiverEmail(offer.ownerEmail);
    setCurrentOffer({ ...offer });
    navigation.navigate("Chat", { chatId: undefined });
    console.log(
      `Navigating to Chat with receiver=${offer.ownerEmail}, offerId=${offer.id}`
    );
  };

  if (mapError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{mapError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setMapError(null);
            setSearchError(null);
            fetchOffers();
            // Retry location fetch
            (async () => {
              try {
                const { status } =
                  await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                  setMapError("Location permission is required.");
                  return;
                }
                const location = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.Balanced,
                });
                setUserLocation(location.coords);
              } catch (error) {
                console.error("Retry Location Error:", error);
                setMapError("Failed to fetch user location.");
              }
            })();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <MapView
        ref={mapRef}
        provider={undefined} // Disable Google Maps provider
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || 31.5204,
          longitude: userLocation?.longitude || 74.3587,
          latitudeDelta: 3.5,
          longitudeDelta: 3.5,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <UrlTile
          urlTemplate={
            mapTilerApiKey
              ? `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${mapTilerApiKey}`
              : ""
          }
          maximumZ={20}
          flipY={false}
        />
        {offers
          .filter((offer) => offer.latitude && offer.longitude)
          .map((offer) => (
            <Marker
              key={`offer-${offer.id}`}
              coordinate={{
                latitude: offer.latitude!,
                longitude: offer.longitude!,
              }}
              onPress={() => handleMarkerPress(offer)}
            >
              <View style={styles.marker}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={getOfferIconColor(offer.type)}
                />
              </View>
            </Marker>
          ))}
      </MapView>
      <View style={styles.attributionContainer}>
        <Text style={styles.attributionText}>
          © MapTiler © OpenStreetMap contributors
        </Text>
      </View>
      <View style={styles.searchBarContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="gray"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search offers..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={debouncedSearch}
        />
        {loading && (
          <ActivityIndicator
            style={styles.searchLoading}
            size="small"
            color="#8511bfff"
          />
        )}
      </View>

      {searchError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{searchError}</Text>
        </View>
      )}

      {selectedOffer && (
        <Animated.View
          style={[
            styles.floatingCard,
            { opacity: cardAnim, transform: [{ scale: cardAnim }] },
          ]}
        >
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedOffer(null)}
            >
              <Ionicons name="close" size={24} color="#d32f2f" />
            </TouchableOpacity>
            <View style={styles.imageContainer}>
              {selectedOffer.imageUrl ? (
                <Image
                  source={{
                    uri: selectedOffer.imageUrl.startsWith("http")
                      ? selectedOffer.imageUrl
                      : `data:image/jpeg;base64,${selectedOffer.imageUrl}`,
                  }}
                  style={styles.cardImage}
                />
              ) : (
                <Text style={styles.noImageText}>No image</Text>
              )}
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{selectedOffer.bookTitle}</Text>
              <Text style={styles.cardDetail}>Type: {selectedOffer.type}</Text>
              {selectedOffer.type === "sell" && (
                <Text style={styles.cardDetail}>
                  Price: ${selectedOffer.price ?? "Not listed"}
                </Text>
              )}
              {selectedOffer.type === "exchange" && (
                <Text style={styles.cardDetail}>
                  Exchange: {selectedOffer.exchangeBook || "None"}
                </Text>
              )}
              <Text style={styles.cardDetail}>
                Condition: {selectedOffer.condition || "Not specified"}
              </Text>
              <Text style={styles.cardDetail}>Location: {offerAddress}</Text>
              <View style={styles.ownerBar}>
                <Text style={styles.ownerText}>
                  Owner: {selectedOffer.ownerEmail}
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => openChatWithOffer(selectedOffer)}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => console.log("Share for", selectedOffer.id)}
              >
                <Ionicons
                  name="share-social-outline"
                  size={24}
                  color="#007AFF"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => console.log("Bookmark for", selectedOffer.id)}
              >
                <Ionicons name="bookmark-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8511bfff" />
          <Text style={styles.loadingText}>Loading offers...</Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  map: { ...StyleSheet.absoluteFillObject },
  attributionContainer: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  attributionText: {
    fontSize: 12,
    color: "#333",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
    position: "absolute",
    top: 40,
    width: width - 32,
    zIndex: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 40, fontSize: 16, color: "#333" },
  searchLoading: { marginLeft: 8 },
  errorContainer: {
    backgroundColor: "#FFF5F5",
    padding: 10,
    marginHorizontal: 16,
    marginTop: 80,
    borderRadius: 10,
  },
  errorText: { color: "#FF2D55", fontSize: 14, textAlign: "center" },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.8,
  },
  floatingCard: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  closeButton: { position: "absolute", top: 8, right: 8, padding: 4 },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    height: 60,
    width: 60,
    marginBottom: 8,
  },
  cardImage: { width: 60, height: 60, borderRadius: 8 },
  noImageText: { color: "#999999", fontSize: 12 },
  cardContent: { paddingHorizontal: 12 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  cardDetail: { fontSize: 14, color: "#666666", marginBottom: 2 },
  ownerBar: {
    backgroundColor: "#E8ECEF",
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  ownerText: { fontSize: 14, fontWeight: "bold", color: "#333" },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  loadingContainer: {
    position: "absolute",
    top: "40%",
    left: "15%",
    right: "15%",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666666" },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});