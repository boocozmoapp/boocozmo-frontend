import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaCamera,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaDollarSign,
  FaExchangeAlt,
  FaStar,
  FaPaperPlane,
  FaLocationArrow,
  FaTrash,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onBack?: () => void;
  currentUser: { email: string; name: string; id: string };
};

// Modern color palette
const MODERN = {
  primary: "#3B82F6",     // Modern blue
  secondary: "#8B5CF6",   // Purple
  accent: "#10B981",      // Emerald
  danger: "#EF4444",      // Red
  warning: "#F59E0B",     // Amber
  light: "#F8FAFC",       // Light slate
  dark: "#1E293B",        // Dark slate
  gray: "#64748B",        // Slate
  border: "#E2E8F0",      // Light border
  card: "#FFFFFF",
  gradient: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
  gradientHover: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)"
};

export default function OfferScreen({ onBack, currentUser }: Props) {
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<"Excellent" | "Very Good" | "Good" | "Fair">("Excellent");
  const [action, setAction] = useState<"sell" | "trade">("sell");
  const [price, setPrice] = useState("");
  const [exchangeBook, setExchangeBook] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationSet, setLocationSet] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ownerEmail = currentUser.email;

  // Image compression function
  const compressImage = useCallback((file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxWidth) {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    });
  }, []);

  // Auto-detect location with better UX
  const detectLocation = useCallback(() => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLatitude(latitude);
          setLongitude(longitude);
          setLocationSet(true);
          setIsLocating(false);
          
          // Center map on detected location
          if (mapInstance.current) {
            mapInstance.current.setView([latitude, longitude], 15);
            if (markerInstance.current) {
              markerInstance.current.setLatLng([latitude, longitude]);
            }
          }
        },
        () => {
          setError("Location access denied. Please tap map to set manually.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation not supported");
      setIsLocating(false);
    }
  }, []);

  // Auto-detect on mount
  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const defaultLat = latitude ?? 40.7128;
    const defaultLng = longitude ?? -74.006;

    const map = L.map(mapRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
    });
    mapInstance.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '© OpenStreetMap contributors, © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${MODERN.primary};
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          cursor: pointer;
        ">
          📚
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    const marker = L.marker([defaultLat, defaultLng], { 
      icon: customIcon,
      draggable: true 
    }).addTo(map);
    markerInstance.current = marker;

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      setLatitude(position.lat);
      setLongitude(position.lng);
      setLocationSet(true);
    });

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setLatitude(lat);
      setLongitude(lng);
      setLocationSet(true);
      marker.setLatLng([lat, lng]);
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
      map.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map center when location changes
  useEffect(() => {
    if (mapInstance.current && latitude && longitude) {
      mapInstance.current.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }
    
    setImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const conditionOptions = [
    { value: "Excellent", color: MODERN.accent, icon: "✨" },
    { value: "Very Good", color: MODERN.primary, icon: "👍" },
    { value: "Good", color: MODERN.warning, icon: "👌" },
    { value: "Fair", color: MODERN.gray, icon: "📖" },
  ] as const;

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Please describe the book");
      return;
    }
    if (action === "sell" && (!price || isNaN(Number(price)) || Number(price) < 0)) {
      setError("Please enter a valid price");
      return;
    }
    if (action === "trade" && !exchangeBook.trim()) {
      setError("Please enter the book you want to trade for");
      return;
    }
    if (!locationSet) {
      setError("Please set your location on the map");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let imageBase64: string | null = null;
      if (image) {
        try {
          imageBase64 = await compressImage(image, 600, 0.7);
          if (imageBase64.length > 500000) {
            imageBase64 = await compressImage(image, 400, 0.6);
          }
        } catch (compressErr) {
          console.error("Image compression failed:", compressErr);
          imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Image read failed"));
            reader.readAsDataURL(image);
          });
        }
      }

      const payload = {
        type: action === "sell" ? "sell" : "exchange",
        bookTitle: description,
        exchangeBook: action === "trade" ? exchangeBook : null,
        price: action === "sell" ? Number(price) : null,
        latitude: latitude!,
        longitude: longitude!,
        image: imageBase64,
        condition,
        ownerEmail,
        ownerId: currentUser.id,
      };

      const payloadSize = JSON.stringify(payload).length;
      if (payloadSize > 10000000) {
        setError("Image is too large. Please choose a smaller image.");
        setLoading(false);
        return;
      }

      const resp = await fetch(`${API_BASE}/submit-offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to post offer");
      }

      setSuccess(true);
      setTimeout(() => {
        // Reset form
        setDescription("");
        setPrice("");
        setExchangeBook("");
        setImage(null);
        setImagePreview(null);
        setError(null);
        setSuccess(false);
        // Navigate back after success
        setTimeout(() => {
          if (onBack) onBack();
        }, 1500);
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      background: MODERN.light,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      overflow: "hidden",
    }}>
      {/* Fixed Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "white",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          zIndex: 1000,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: MODERN.dark,
            fontSize: "20px",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FaArrowLeft />
        </button>
        
        <h1 style={{
          fontSize: "18px",
          fontWeight: "700",
          color: MODERN.dark,
          margin: 0,
        }}>
          Share a Book
        </h1>
        
        <div style={{ width: "44px" }} /> {/* Spacer for alignment */}
      </motion.div>

      {/* Main Content */}
      <div style={{
        height: "100%",
        paddingTop: "60px",
        paddingBottom: "80px",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}>
        <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
          {/* Book Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: MODERN.card,
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: MODERN.dark,
              marginBottom: "8px",
            }}>
              Book Description *
            </label>
            <textarea
              placeholder="Tell others about this book, include title, author, and any details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "12px",
                borderRadius: "12px",
                border: `1px solid ${MODERN.border}`,
                background: "white",
                fontSize: "16px",
                resize: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
            />
            <div style={{
              fontSize: "12px",
              color: MODERN.gray,
              marginTop: "8px",
              textAlign: "right",
            }}>
              {description.length}/500
            </div>
          </motion.div>

          {/* Condition Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              background: MODERN.card,
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: MODERN.dark,
              marginBottom: "12px",
            }}>
              Condition
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {conditionOptions.map((opt) => (
                <motion.button
                  key={opt.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCondition(opt.value)}
                  style={{
                    flex: 1,
                    minWidth: "80px",
                    padding: "12px 8px",
                    borderRadius: "12px",
                    border: `2px solid ${condition === opt.value ? opt.color : MODERN.border}`,
                    background: condition === opt.value ? `${opt.color}15` : "white",
                    color: condition === opt.value ? opt.color : MODERN.dark,
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>{opt.icon}</span>
                  {opt.value}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Action Type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: MODERN.card,
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: MODERN.dark,
              marginBottom: "12px",
            }}>
              I want to...
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAction("sell")}
                style={{
                  flex: 1,
                  padding: "16px",
                  borderRadius: "12px",
                  border: `2px solid ${action === "sell" ? MODERN.primary : MODERN.border}`,
                  background: action === "sell" ? `${MODERN.primary}10` : "white",
                  color: action === "sell" ? MODERN.primary : MODERN.dark,
                  fontWeight: "600",
                  fontSize: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                <FaDollarSign />
                Sell
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAction("trade")}
                style={{
                  flex: 1,
                  padding: "16px",
                  borderRadius: "12px",
                  border: `2px solid ${action === "trade" ? MODERN.secondary : MODERN.border}`,
                  background: action === "trade" ? `${MODERN.secondary}10` : "white",
                  color: action === "trade" ? MODERN.secondary : MODERN.dark,
                  fontWeight: "600",
                  fontSize: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                <FaExchangeAlt />
                Trade
              </motion.button>
            </div>
          </motion.div>

          {/* Price or Trade For */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              background: MODERN.card,
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: MODERN.dark,
              marginBottom: "8px",
            }}>
              {action === "sell" ? "Price *" : "Trade For *"}
            </label>
            {action === "sell" ? (
              <div style={{ position: "relative" }}>
                <FaDollarSign style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: MODERN.gray,
                }} />
                <input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 36px",
                    borderRadius: "12px",
                    border: `1px solid ${MODERN.border}`,
                    background: "white",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <FaExchangeAlt style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: MODERN.gray,
                }} />
                <input
                  type="text"
                  placeholder="What book are you looking for?"
                  value={exchangeBook}
                  onChange={(e) => setExchangeBook(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 36px",
                    borderRadius: "12px",
                    border: `1px solid ${MODERN.border}`,
                    background: "white",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}
          </motion.div>

          {/* Image Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: MODERN.card,
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "600",
              color: MODERN.dark,
              marginBottom: "12px",
            }}>
              Photo (Optional)
            </label>
            
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}>
              {imagePreview ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "12px",
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={removeImage}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: MODERN.danger,
                      color: "white",
                      border: "none",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "14px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    <FaTrash />
                  </motion.button>
                </div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "40px 20px",
                    borderRadius: "12px",
                    border: `2px dashed ${MODERN.border}`,
                    background: "white",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <FaCamera style={{
                    fontSize: "32px",
                    color: MODERN.primary,
                    marginBottom: "12px",
                  }} />
                  <div style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: MODERN.dark,
                    marginBottom: "4px",
                  }}>
                    Tap to add photo
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: MODERN.gray,
                  }}>
                    JPG or PNG, max 5MB
                  </div>
                </motion.div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImagePick}
                style={{ display: "none" }}
              />
              
              {image && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: `${MODERN.primary}10`,
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: MODERN.dark,
                }}>
                  <span style={{ fontWeight: "500" }}>
                    {image.name} ({(image.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <FaCheckCircle color={MODERN.accent} />
                </div>
              )}
            </div>
          </motion.div>

          {/* Location Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            style={{
              background: MODERN.card,
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}>
              <label style={{
                fontSize: "14px",
                fontWeight: "600",
                color: MODERN.dark,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <FaMapMarkerAlt color={MODERN.primary} />
                Location *
              </label>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                style={{
                  background: "none",
                  border: "none",
                  color: MODERN.primary,
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {showLocationPicker ? <FaChevronUp /> : <FaChevronDown />}
                {showLocationPicker ? "Hide Map" : "Set Location"}
              </motion.button>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: showLocationPicker ? "12px" : "0",
            }}>
              <div style={{
                flex: 1,
                padding: "12px",
                background: MODERN.light,
                borderRadius: "8px",
                fontSize: "13px",
                color: locationSet ? MODERN.dark : MODERN.gray,
                fontWeight: locationSet ? "500" : "400",
              }}>
                {locationSet 
                  ? `${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`
                  : "Location not set"
                }
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={detectLocation}
                disabled={isLocating}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  background: MODERN.gradient,
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: isLocating ? "not-allowed" : "pointer",
                  opacity: isLocating ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {isLocating ? (
                  <>
                    <div style={{
                      width: "12px",
                      height: "12px",
                      border: "2px solid white",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }} />
                    Detecting...
                  </>
                ) : (
                  <>
                    <FaLocationArrow />
                    Detect
                  </>
                )}
              </motion.button>
            </div>

            <AnimatePresence>
              {showLocationPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "300px", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{
                    overflow: "hidden",
                    marginTop: "12px",
                  }}
                >
                  <div
                    ref={mapRef}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: `2px solid ${MODERN.primary}`,
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            <div style={{
              fontSize: "12px",
              color: MODERN.gray,
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}>
              <FaStar size={10} />
              Your location helps others find books nearby
            </div>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  background: `${MODERN.danger}15`,
                  borderLeft: `4px solid ${MODERN.danger}`,
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "14px",
                  color: MODERN.dark,
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  background: `${MODERN.accent}15`,
                  borderLeft: `4px solid ${MODERN.accent}`,
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "14px",
                  color: MODERN.dark,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaCheckCircle color={MODERN.accent} />
                Book posted successfully! Redirecting...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed Submit Button */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px",
          background: "white",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "12px",
            border: "none",
            background: loading ? MODERN.gray : MODERN.gradient,
            color: "white",
            fontSize: "16px",
            fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: loading ? "none" : "0 6px 20px rgba(59, 130, 246, 0.3)",
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: "16px",
                height: "16px",
                border: "2px solid white",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }} />
              Posting...
            </>
          ) : (
            <>
              <FaPaperPlane />
              Post Your Book
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Global Styles */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .custom-map-marker {
            transition: transform 0.2s ease;
          }
          
          .custom-map-marker:hover {
            transform: scale(1.1);
          }
          
          input:focus, textarea:focus {
            outline: none;
            border-color: ${MODERN.primary} !important;
            box-shadow: 0 0 0 3px ${MODERN.primary}20;
          }
          
          ::-webkit-scrollbar {
            width: 6px;
          }
          
          ::-webkit-scrollbar-track {
            background: ${MODERN.light};
          }
          
          ::-webkit-scrollbar-thumb {
            background: ${MODERN.border};
            border-radius: 3px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: ${MODERN.gray};
          }
        `}
      </style>
    </div>
  );
}