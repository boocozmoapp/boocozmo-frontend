import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import {
  FontAwesome5,
  MaterialIcons,
  Entypo,
  Feather,
  AntDesign,
} from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { AuthContext } from '../AuthContext';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  SplashScreen: undefined;
  Auth: undefined;
  Main: undefined;
};

type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Offers: undefined;
  Chat: { chatId?: number };
  Profile: undefined;
};

type OfferScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Offer = {
  id: string;
  type: 'buy' | 'sell' | 'exchange';
  bookTitle: string;
  price?: number;
  exchangeBook?: string;
  latitude: number;
  longitude: number;
  image?: string;
  ownerEmail: string;
};

type Store = {
  id: string;
  name: string;
  ownerEmail: string;
  offers: Offer[];
};

export default function OfferScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
    Montserrat_400Regular,
    Montserrat_700Bold,
  });
  const { user } = useContext(AuthContext);
  const userEmail = user?.email;
  const navigation = useNavigation<OfferScreenNavigationProp>();
  const [mode, setMode] = useState<'create-offer' | 'create-store'>('create-offer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [offerType, setOfferType] = useState<'buy' | 'sell' | 'exchange'>('buy');
  const [bookTitle, setBookTitle] = useState('');
  const [price, setPrice] = useState('');
  const [exchangeBook, setExchangeBook] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [location, setLocation] = useState({ latitude: 31.5204, longitude: 74.3587 });
  const [storeName, setStoreName] = useState('');
  const [storeOffers, setStoreOffers] = useState<any[]>([]);
  const mapRef = useRef<MapView>(null);
  const storeMapRefs = useRef<any[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
      if (!state.isConnected) {
        Alert.alert('No Internet Connection', 'Please check your network and try again.');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const index = ['create-offer', 'create-store'].indexOf(mode);
    Animated.spring(indicatorAnim, {
      toValue: index * (width / 2),
      useNativeDriver: true,
    }).start();
  }, [mode]);

  const handleModeSwitch = (newMode: 'create-offer' | 'create-store') => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setMode(newMode);
      setBookTitle('');
      setPrice('');
      setExchangeBook('');
      setImageBase64(null);
      setStoreName('');
      setStoreOffers([]);
      setError(null);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const addOfferToStore = () => {
    setStoreOffers((prev) => [
      ...prev,
      {
        type: 'buy',
        bookTitle: '',
        price: '',
        exchangeBook: '',
        imageBase64: null,
        latitude: 31.5204,
        longitude: 74.3587,
        condition: '',
      },
    ]);
    storeMapRefs.current.push(React.createRef());
  };

  const updateStoreOffer = (index: number, field: string, value: any) => {
    setStoreOffers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeStoreOffer = (index: number) => {
    setStoreOffers((prev) => prev.filter((_, i) => i !== index));
    storeMapRefs.current.splice(index, 1);
  };

  const pickImage = async (index: number | null = null) => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        quality: 0.6,
      });
      if (!result.canceled && result.assets.length > 0) {
        const base64 = result.assets[0].base64;
        if (index === null) {
          setImageBase64(base64!);
        } else {
          updateStoreOffer(index, 'imageBase64', base64);
        }
      } else {
        Alert.alert('Error', 'Image selection was canceled.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async (index: number | null = null) => {
    setLoading(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        base64: true,
        quality: 0.6,
      });
      if (!result.canceled && result.assets.length > 0) {
        const base64 = result.assets[0].base64;
        if (index === null) {
          setImageBase64(base64!);
        } else {
          updateStoreOffer(index, 'imageBase64', base64);
        }
      } else {
        Alert.alert('Error', 'Photo capture was canceled.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to auto-locate.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          400
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    }
  };

  const getCurrentLocationForOffer = async (index: number) => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to auto-locate.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      updateStoreOffer(index, 'latitude', loc.coords.latitude);
      updateStoreOffer(index, 'longitude', loc.coords.longitude);
      if (storeMapRefs.current[index]?.current) {
        storeMapRefs.current[index].current.animateToRegion(
          {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          400
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    }
  };

  const handlePostOffer = async () => {
    if (!userEmail) {
      setError('Please log in to post an offer.');
      Alert.alert('Error', 'Please log in to post an offer.');
      return;
    }
    if (!bookTitle || (offerType !== 'exchange' && !price)) {
      setError('Please fill out all required fields.');
      Alert.alert('Error', 'Please fill out all required fields.');
      return;
    }
    if (!isConnected) {
      setError('No internet connection. Please check your network.');
      Alert.alert('Error', 'No internet connection. Please check your network.');
      return;
    }
    const offerData = {
      type: offerType,
      bookTitle,
      exchangeBook: offerType === 'exchange' ? exchangeBook : null,
      price: offerType !== 'exchange' ? parseInt(price) : null,
      latitude: location.latitude,
      longitude: location.longitude,
      image: offerType !== 'buy' ? imageBase64 : null,
      ownerEmail: userEmail,
    };
    setLoading(true);
    try {
      const response = await fetch('https://834a32e433da.ngrok-free.app/submit-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerData),
      });
      if (!response.ok) {
        throw new Error(response.status === 400 ? 'Invalid offer data' : 'Server error');
      }
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        Alert.alert('Success', 'Offer submitted successfully!');
        setBookTitle('');
        setPrice('');
        setExchangeBook('');
        setImageBase64(null);
        setError(null);
      } catch {
        setError('Server returned invalid JSON response.');
        Alert.alert('Error', 'Server returned invalid JSON response.');
      }
    } catch (err) {
      setError('Network Error: Could not post offer. Please try again.');
      Alert.alert('Error', 'Could not post offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostStore = async () => {
    if (!userEmail) {
      setError('Please log in to post a store.');
      Alert.alert('Error', 'Please log in to post a store.');
      return;
    }
    if (!storeName || storeOffers.length === 0) {
      setError('Please provide a store name and at least one offer.');
      Alert.alert('Error', 'Please provide a store name and at least one offer.');
      return;
    }
    for (const offer of storeOffers) {
      if (!offer.bookTitle || (offer.type !== 'exchange' && !offer.price)) {
        setError('Please fill out all required fields for each offer.');
        Alert.alert('Error', 'Please fill out all required fields for each offer.');
        return;
      }
    }
    if (!isConnected) {
      setError('No internet connection. Please check your network.');
      Alert.alert('Error', 'No internet connection. Please check your network.');
      return;
    }
    const storeData = {
      name: storeName,
      ownerEmail: userEmail,
      offers: storeOffers.map((offer) => ({
        type: offer.type,
        bookTitle: offer.bookTitle,
        exchangeBook: offer.type === 'exchange' ? offer.exchangeBook : null,
        price: offer.type !== 'exchange' ? parseInt(offer.price) : null,
        latitude: offer.latitude,
        longitude: offer.longitude,
        image: offer.type !== 'buy' ? offer.imageBase64 : null,
        condition: offer.condition,
      })),
    };
    setLoading(true);
    try {
      const response = await fetch('https://834a32e433da.ngrok-free.app/create-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData),
      });
      if (!response.ok) {
        throw new Error(response.status === 400 ? 'Invalid store data' : 'Server error');
      }
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        Alert.alert('Success', 'Store created successfully!');
        setStoreName('');
        setStoreOffers([]);
        setError(null);
      } catch {
        setError('Server returned invalid JSON response.');
        Alert.alert('Error', 'Server returned invalid JSON response.');
      }
    } catch (err) {
      setError('Network Error: Could not create store. Please try again.');
      Alert.alert('Error', 'Could not create store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStoreOfferForm = (offer: any, index: number) => {
    return (
      <Animated.View
        style={[styles.storeOfferCard, { opacity: fadeAnim }]}
        key={index}
      >
        <TouchableOpacity
          style={styles.removeOfferBtn}
          onPress={() => removeStoreOffer(index)}
          activeOpacity={0.7}
        >
          <AntDesign name="closecircle" size={18} color="#D32F2F" />
        </TouchableOpacity>
        <Text style={styles.label}>Offer Type</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={offer.type}
            onValueChange={(val) => updateStoreOffer(index, 'type', val)}
            style={styles.picker}
            dropdownIconColor="#8A8A8A"
          >
            <Picker.Item label="Buy" value="buy" />
            <Picker.Item label="Sell" value="sell" />
            <Picker.Item label="Exchange" value="exchange" />
          </Picker>
        </View>
        <Text style={styles.label}>Book Title</Text>
        <View style={styles.inputWrapper}>
          <Feather name="book" size={16} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Enter book title"
            placeholderTextColor="#8A8A8A"
            value={offer.bookTitle}
            onChangeText={(val) => updateStoreOffer(index, 'bookTitle', val)}
          />
        </View>
        {offer.type === 'exchange' && (
          <>
            <Text style={styles.label}>Exchange With</Text>
            <View style={styles.inputWrapper}>
              <AntDesign name="swap" size={16} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Other book title"
                placeholderTextColor="#8A8A8A"
                value={offer.exchangeBook}
                onChangeText={(val) => updateStoreOffer(index, 'exchangeBook', val)}
              />
            </View>
          </>
        )}
        {(offer.type === 'sell' || offer.type === 'buy') && (
          <>
            <Text style={styles.label}>Price (PKR)</Text>
            <View style={styles.inputWrapper}>
              <FontAwesome5 name="rupee-sign" size={14} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Enter price"
                placeholderTextColor="#8A8A8A"
                keyboardType="numeric"
                value={offer.price}
                onChangeText={(val) => updateStoreOffer(index, 'price', val)}
              />
            </View>
          </>
        )}
        {offer.type !== 'buy' && (
          <>
            <Text style={styles.label}>Book Image</Text>
            <View style={styles.imageOptions}>
              <TouchableOpacity onPress={() => pickImage(index)} style={styles.imageBtn} activeOpacity={0.7}>
                <Feather name="image" size={16} color="#FFF" />
                <Text style={styles.imageBtnText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => takePhoto(index)} style={styles.imageBtn} activeOpacity={0.7}>
                <Feather name="camera" size={16} color="#FFF" />
                <Text style={styles.imageBtnText}>Camera</Text>
              </TouchableOpacity>
            </View>
            {offer.imageBase64 && (
              <Image
                source={{ uri: `data:image/jpeg;base64,${offer.imageBase64}` }}
                style={styles.previewImage}
              />
            )}
          </>
        )}
        <Text style={styles.label}>Condition</Text>
        <View style={styles.inputWrapper}>
          <Feather name="info" size={16} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Enter condition (optional)"
            placeholderTextColor="#8A8A8A"
            value={offer.condition}
            onChangeText={(val) => updateStoreOffer(index, 'condition', val)}
          />
        </View>
        <Text style={styles.label}>Location</Text>
        <TouchableOpacity style={styles.locateBtn} onPress={() => getCurrentLocationForOffer(index)} activeOpacity={0.7}>
          <MaterialIcons name="my-location" size={20} color="#007AFF" />
          <Text style={styles.locateBtnText}>Use Current Location</Text>
        </TouchableOpacity>
        <MapView
          style={styles.map}
          ref={storeMapRefs.current[index]}
          initialRegion={{
            latitude: offer.latitude,
            longitude: offer.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={(e) => {
            updateStoreOffer(index, 'latitude', e.nativeEvent.coordinate.latitude);
            updateStoreOffer(index, 'longitude', e.nativeEvent.coordinate.longitude);
            storeMapRefs.current[index].current?.animateToRegion(
              {
                latitude: e.nativeEvent.coordinate.latitude,
                longitude: e.nativeEvent.coordinate.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              400
            );
          }}
        >
          <UrlTile
            urlTemplate="https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=pps3Llejghq7tBKaMmgf"
            maximumZ={20}
            flipY={false}
          />
          <Marker
            coordinate={{ latitude: offer.latitude, longitude: offer.longitude }}
            draggable
            onDragEnd={(e) => {
              updateStoreOffer(index, 'latitude', e.nativeEvent.coordinate.latitude);
              updateStoreOffer(index, 'longitude', e.nativeEvent.coordinate.longitude);
              storeMapRefs.current[index].current?.animateToRegion(
                {
                  latitude: e.nativeEvent.coordinate.latitude,
                  longitude: e.nativeEvent.coordinate.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                400
              );
            }}
          >
            <FontAwesome5 name="map-marker-alt" size={24} color="#007AFF" />
          </Marker>
        </MapView>
        <View style={styles.attributionContainer}>
          <Text style={styles.attributionText}>© MapTiler © OpenStreetMap contributors</Text>
        </View>
      </Animated.View>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
        <View style={styles.modeBar}>
          <Animated.View
            style={[
              styles.modeIndicator,
              {
                transform: [{ translateX: indicatorAnim }],
                width: width / 2,
              },
            ]}
          />
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => handleModeSwitch('create-offer')}
            activeOpacity={0.7}
          >
            <Feather name="plus-circle" size={20} color={mode === 'create-offer' ? '#FFF' : '#007AFF'} />
            <Text style={[styles.modeButtonText, { color: mode === 'create-offer' ? '#FFF' : '#007AFF' }]}>Create Offer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => handleModeSwitch('create-store')}
            activeOpacity={0.7}
          >
            <Feather name="shopping-bag" size={20} color={mode === 'create-store' ? '#FFF' : '#007AFF'} />
            <Text style={[styles.modeButtonText, { color: mode === 'create-store' ? '#FFF' : '#007AFF' }]}>Create Store</Text>
          </TouchableOpacity>
        </View>
        <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            {mode === 'create-offer' ? (
              <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                <Text style={styles.sectionTitle}>Create an Offer</Text>
                <Text style={styles.label}>Offer Type</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={offerType}
                    onValueChange={setOfferType}
                    style={styles.picker}
                    dropdownIconColor="#8A8A8A"
                  >
                    <Picker.Item label="Buy" value="buy" />
                    <Picker.Item label="Sell" value="sell" />
                    <Picker.Item label="Exchange" value="exchange" />
                  </Picker>
                </View>
                <Text style={styles.label}>Book Title</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="book" size={16} color="#666" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter book title"
                    placeholderTextColor="#8A8A8A"
                    value={bookTitle}
                    onChangeText={setBookTitle}
                  />
                </View>
                {offerType === 'exchange' && (
                  <>
                    <Text style={styles.label}>Exchange With</Text>
                    <View style={styles.inputWrapper}>
                      <AntDesign name="swap" size={16} color="#666" />
                      <TextInput
                        style={styles.input}
                        placeholder="Other book title"
                        placeholderTextColor="#8A8A8A"
                        value={exchangeBook}
                        onChangeText={setExchangeBook}
                      />
                    </View>
                  </>
                )}
                {(offerType === 'sell' || offerType === 'buy') && (
                  <>
                    <Text style={styles.label}>Price (PKR)</Text>
                    <View style={styles.inputWrapper}>
                      <FontAwesome5 name="rupee-sign" size={14} color="#666" />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter price"
                        placeholderTextColor="#8A8A8A"
                        keyboardType="numeric"
                        value={price}
                        onChangeText={setPrice}
                      />
                    </View>
                  </>
                )}
                {offerType !== 'buy' && (
                  <>
                    <Text style={styles.label}>Book Image</Text>
                    <View style={styles.imageOptions}>
                      <TouchableOpacity onPress={() => pickImage()} style={styles.imageBtn} activeOpacity={0.7}>
                        <Feather name="image" size={16} color="#FFF" />
                        <Text style={styles.imageBtnText}>Gallery</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => takePhoto()} style={styles.imageBtn} activeOpacity={0.7}>
                        <Feather name="camera" size={16} color="#FFF" />
                        <Text style={styles.imageBtnText}>Camera</Text>
                      </TouchableOpacity>
                    </View>
                    {imageBase64 && (
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
                        style={styles.previewImage}
                      />
                    )}
                  </>
                )}
                <Text style={styles.label}>Your Location</Text>
                <TouchableOpacity style={styles.locateBtn} onPress={getCurrentLocation} activeOpacity={0.7}>
                  <MaterialIcons name="my-location" size={20} color="#4bd580ff" />
                  <Text style={styles.locateBtnText}>Use Current Location</Text>
                </TouchableOpacity>
                <MapView
                  style={styles.map}
                  ref={mapRef}
                  initialRegion={{
                    ...location,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  onPress={(e) => {
                    setLocation(e.nativeEvent.coordinate);
                    mapRef.current?.animateToRegion(
                      {
                        latitude: e.nativeEvent.coordinate.latitude,
                        longitude: e.nativeEvent.coordinate.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      },
                      400
                    );
                  }}
                >
                  <UrlTile
                    urlTemplate="https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=pps3Llejghq7tBKaMmgf"
                    maximumZ={20}
                    flipY={false}
                  />
                  <Marker
                    coordinate={location}
                    draggable
                    onDragEnd={(e) => {
                      setLocation(e.nativeEvent.coordinate);
                      mapRef.current?.animateToRegion(
                        {
                          latitude: e.nativeEvent.coordinate.latitude,
                          longitude: e.nativeEvent.coordinate.longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        },
                        400
                      );
                    }}
                  >
                    <FontAwesome5 name="map-marker-alt" size={24} color="#4bd580ff" />
                  </Marker>
                </MapView>
                <View style={styles.attributionContainer}>
                  <Text style={styles.attributionText}>© MapTiler © OpenStreetMap contributors</Text>
                </View>
                <TouchableOpacity style={styles.submitBtn} onPress={handlePostOffer} disabled={loading} activeOpacity={0.7}>
                  <Text style={styles.submitBtnText}>Post Offer</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                <Text style={styles.sectionTitle}>Create a Store</Text>
                <Text style={styles.label}>Store Name</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="shopping-bag" size={16} color="#666" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter store name"
                    placeholderTextColor="#8A8A8A"
                    value={storeName}
                    onChangeText={setStoreName}
                  />
                </View>
                <Text style={styles.sectionTitle}>Offers in Store</Text>
                <View style={styles.storeOffersList}>
                  {storeOffers.map(renderStoreOfferForm)}
                </View>
                <TouchableOpacity style={styles.addOfferBtn} onPress={addOfferToStore} activeOpacity={0.7}>
                  <Entypo name="plus" size={16} color="#FFF" />
                  <Text style={styles.addOfferBtnText}>Add Offer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handlePostStore} disabled={loading} activeOpacity={0.7}>
                  <Text style={styles.submitBtnText}>Launch Store</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#007AFF',
  },
  modeBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    position: 'relative',
  },
  modeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 24,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modeButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    marginLeft: 4,
  },
  formContainer: {
    flex: 1,
    width: width,
    zIndex: 10,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#dc2626',
    textAlign: 'center',
  },
  map: {
    height: 180,
    width: '100%',
    borderRadius: 16,
    marginBottom: 16,
  },
  attributionContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  attributionText: {
    fontSize: 12,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 8,
  },
  pickerWrapper: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    color: '#1e293b',
    height: 48,
    width: '100%',
    fontFamily: 'Poppins_400Regular',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    flex: 1,
    color: '#1e293b',
    paddingVertical: 10,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
  imageOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  imageBtn: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  imageBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    marginLeft: 6,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 16,
  },
  storeOfferCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  removeOfferBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  storeOffersList: {
    marginBottom: 16,
  },
  addOfferBtn: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addOfferBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    marginLeft: 6,
  },
  submitBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    justifyContent: 'center',
  },
  locateBtnText: {
    marginLeft: 8,
    color: '#007AFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
});