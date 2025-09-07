import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import openMap from 'react-native-open-maps';
import { AuthContext } from '../AuthContext';

interface Offer {
  id: number;
  type: 'sell' | 'exchange' | 'buy';
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

type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Offers: undefined;
  Chat: { chatId?: number };
  Profile: undefined;
};

type RootStackParamList = {
  Auth: { setIsLoggedIn: (value: boolean) => void };
  Main: undefined;
  Chat: { chatId?: number };
};

type NavigationProp = NativeStackNavigationProp<RootTabParamList & RootStackParamList>;

export default function HomeScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [savedOfferIds, setSavedOfferIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const navigation = useNavigation<NavigationProp>();
  const { user, setReceiverEmail, setCurrentOffer } = useContext(AuthContext);

  useEffect(() => {
    fetchOffers();
    if (user?.email) {
      fetchSavedOffers();
    }
  }, [searchQuery, priceFilter, user?.email]);

  const fetchOffers = async () => {
    try {
      const url = `https://834a32e433da.ngrok-free.app/search-offers?query=${encodeURIComponent(searchQuery)}&price=${priceFilter}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      const data = await response.json();
      const formattedData: Offer[] = data.map((offer: any) => ({
        ...offer,
        id: Number(offer.id),
      }));
      formattedData.forEach((offer) => console.log(`Offer ${offer.id} imageUrl: ${offer.imageUrl}`));
      setOffers(formattedData);
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to fetch offers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedOffers = async () => {
    if (!user?.email) return;
    try {
      const response = await fetch(
        `https://834a32e433da.ngrok-free.app/saved-offers?email=${encodeURIComponent(user.email)}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch saved offers: ${response.status}`);
      }
      const data = await response.json();
      const savedIds = new Set<number>(data.map((item: any) => Number(item.id)));
      setSavedOfferIds(savedIds);
      console.log('Fetched saved offer IDs:', Array.from(savedIds));
    } catch (error: any) {
      console.error('Fetch saved offers error:', error);
      if (error.message.includes('400')) {
        setSavedOfferIds(new Set());
        console.log('Invalid request for saved offers; assuming no saved offers.');
      } else {
        Alert.alert('Error', 'Failed to fetch saved offers. Please try again.');
      }
    }
  };

  const toggleSaveOffer = async (offerId: number) => {
    if (!user?.email) {
      Alert.alert('Error', 'Please log in to save or unsave an offer.');
      return;
    }
    try {
      const isSaved = savedOfferIds.has(offerId);
      const endpoint = isSaved ? '/unsave-offer' : '/save-offer';
      const response = await fetch(`https://834a32e433da.ngrok-free.app${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer_id: offerId,
          saved_by: user.email,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.log(`Toggle save offer raw response: ${text}`);
        throw new Error(`Failed to ${isSaved ? 'unsave' : 'save'} offer: ${response.status}`);
      }
      const data = await response.json();
      setSavedOfferIds((prev) => {
        const newSet = new Set(prev);
        if (isSaved) newSet.delete(offerId);
        else newSet.add(offerId);
        return newSet;
      });
      console.log(`${isSaved ? 'Unsaved' : 'Saved'} offer ${offerId}`);
    } catch (error: any) {
      console.error('Toggle save offer error:', error);
      if (error.message.includes('404')) {
        Alert.alert('Error', 'Saved offers feature is not available on the server. Please contact support.');
      } else {
        Alert.alert('Error', `Failed to ${savedOfferIds.has(offerId) ? 'unsave' : 'save'} offer. Please try again.`);
      }
    }
  };

  const openChatWithOffer = (offer: Offer) => {
    if (!user?.email || !offer.ownerEmail) {
      Alert.alert('Error', 'Please log in to start a chat.');
      return;
    }
    if (user.email === offer.ownerEmail) {
      Alert.alert('Error', 'You cannot start a chat for your own offer.');
      return;
    }
    setReceiverEmail(offer.ownerEmail);
    setCurrentOffer({ ...offer });
    navigation.navigate('Chat', { chatId: undefined });
    console.log(`Navigating to Chat with receiver=${offer.ownerEmail}, offerId=${offer.id}`);
  };

  const openGoogleMaps = (offer: Offer) => {
    if (offer.latitude != null && offer.longitude != null) {
      openMap({
        latitude: offer.latitude,
        longitude: offer.longitude,
        zoom: 15,
        provider: 'google',
        query: offer.bookTitle,
        end: `${offer.latitude},${offer.longitude}`,
      });
    } else {
      Alert.alert('Error', 'Location data not available for this offer.');
    }
  };

  const renderOfferCard = ({ item }: { item: Offer }) => (
    <View style={styles.card}>
      <View style={[styles.badge, styles[`badge-${item.type}`]]}>
        <Text style={styles.badgeText}>{item.type.toUpperCase()}</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openGoogleMaps(item)}>
          <Ionicons name="map-outline" size={20} color="#000000ff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleSaveOffer(item.id)}>
          <Ionicons
            name={savedOfferIds.has(item.id) ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={savedOfferIds.has(item.id) ? '#e39623ff' : '#000000ff'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => console.log('Share for', item.id)}>
          <Ionicons name="share-social-outline" size={20} color="#000000ff" />
        </TouchableOpacity>
      </View>
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image
            source={{
              uri: item.imageUrl.startsWith("data:image")
                ? item.imageUrl
                : `data:image/jpeg;base64,${item.imageUrl}`,
            }}
            style={styles.cardImage}
            defaultSource={require('../assets/favicon.png')}
            onError={(e) => console.log(`Image load error for ${item.id}:`, e.nativeEvent.error)}
          />
        ) : (
          <Text style={styles.noImageText}>No image</Text>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.bookTitle}</Text>
        {item.type === 'sell' && (
          <Text style={styles.cardDetail}>Price: {item.price != null ? `$${item.price}` : 'Not listed'}</Text>
        )}
        {item.type === 'exchange' && (
          <Text style={styles.cardDetail}>Exchange: {item.exchangeBook || 'None'}</Text>
        )}
        <Text style={styles.cardDetail}>Condition: {item.condition || 'Not specified'}</Text>
        <Text style={styles.cardDetail}>Status: {item.state}</Text>
        <View style={styles.ownerBar}>
          <Text style={styles.ownerText}>Owner: {item.ownerEmail}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.chatButton} onPress={() => openChatWithOffer(item)}>
          <Ionicons name="chatbubble-outline" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={20} color="gray" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search offers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Price Range:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['all', 'low', 'medium', 'high'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                priceFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => setPriceFilter(filter)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  priceFilter === filter && styles.filterButtonTextActive,
                ]}
              >
                {filter === 'all'
                  ? 'All'
                  : filter === 'low'
                  ? '≤$500'
                  : filter === 'medium'
                  ? '$500-$1000'
                  : '>$1000'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8511bfff" />
          <Text style={styles.loadingText}>Loading offers...</Text>
        </View>
      ) : (
        <FlatList
          data={offers}
          renderItem={renderOfferCard}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#efeeeeff',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1F2937',
  },
  filterContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
    fontWeight: '500',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#8B5A2B',
    borderColor: '#8B5A2B',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 4,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    display:'none'
  },
  'badge-buy': { backgroundColor: '#10B981' },
  'badge-sell': { backgroundColor: '#EF4444' },
  'badge-exchange': { backgroundColor: '#8B5A2B' },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    backgroundColor:'#ffffffff',
    borderRadius:15,
    paddingBottom:15,
    
    
  },
  actionBtn: {
    padding: 4,
    
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: -10,
    height: 120,
    width: '100%',
    marginBottom: 8,
    top:-12
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderRadius: -10,
    resizeMode: 'cover',
  },
  noImageText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  cardContent: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  ownerBar: {
    backgroundColor: '#F3F4F6',
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  ownerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  chatButton: {
    backgroundColor: '#000000ff',
    borderRadius: 8,
    padding: 6,
    width:140,
    alignItems:'center'
  },
}); 