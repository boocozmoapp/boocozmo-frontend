// src/pages/OfferScreen.tsx - PINTEREST-STYLE REDESIGN (Matching HomeScreen, ChatScreen, SingleChat)
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaCamera,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaDollarSign,
  FaExchangeAlt,
  FaPaperPlane,
  FaLocationArrow,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaEllipsisH,
  FaTimes,
  FaHome,
  FaMapMarkedAlt,
  FaPlus,
  FaComments,
  FaBell,
  FaBookmark,
  FaCompass,
  FaBook,
  FaStar,
  FaCog,
  FaUsers
} from "react-icons/fa";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onBack?: () => void;
  currentUser: { email: string; name: string; id: string };
  onProfilePress?: () => void;
  onMapPress?: () => void;
  onAddPress?: () => void;
};

// Exact Pinterest colors from previous screens
const PINTEREST = {
  primary: "#E60023",
  dark: "#A3081A",
  light: "#FF4D6D",
  bg: "#FFFFFF",
  sidebarBg: "#FFFFFF",
  textDark: "#000000",
  textLight: "#5F5F5F",
  textMuted: "#8E8E8E",
  border: "#E1E1E1",
  hoverBg: "#F5F5F5",
  icon: "#767676",
  redLight: "#FFE2E6",
  grayLight: "#F7F7F7",
  overlay: "rgba(0, 0, 0, 0.7)"
};

export default function OfferScreen({ 
  onBack, 
  currentUser,
  onProfilePress,
  onMapPress,
  onAddPress 
}: Props) {
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Auto-detect location
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
          background: ${PINTEREST.primary};
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(230, 0, 35, 0.4);
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

  // Update map center
  useEffect(() => {
    if (mapInstance.current && latitude && longitude) {
      mapInstance.current.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }
    
    setImage(file);
    
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
    { value: "Excellent", color: "#10B981", icon: "✨" },
    { value: "Very Good", color: PINTEREST.primary, icon: "👍" },
    { value: "Good", color: "#F59E0B", icon: "👌" },
    { value: "Fair", color: "#64748B", icon: "📖" },
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
        setDescription("");
        setPrice("");
        setExchangeBook("");
        setImage(null);
        setImagePreview(null);
        setError(null);
        setSuccess(false);
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

  // Sidebar items (same as other screens)
  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => {} },
    { icon: FaCompass, label: "Discover", onClick: () => {} },
    { icon: FaBook, label: "My Books", onClick: () => {} },
    { icon: FaBookmark, label: "Saved", onClick: () => {} },
    { icon: FaUsers, label: "Following", onClick: () => {} },
    { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress },
    { icon: FaComments, label: "Messages", onClick: () => {} },
    { icon: FaBell, label: "Notifications", onClick: () => {} },
    { icon: FaStar, label: "Top Picks", onClick: () => {} },
  ];

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      background: PINTEREST.bg,
      display: "flex",
      fontFamily: "'Inter', -apple-system, sans-serif",
      overflow: "hidden",
    }}>
      {/* Sidebar - Identical to other screens */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 25 }}
        style={{
          width: "240px",
          background: PINTEREST.sidebarBg,
          borderRight: `1px solid ${PINTEREST.border}`,
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          padding: "20px 16px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: PINTEREST.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "700",
              fontSize: "14px",
            }}>
              B
            </div>
            <span style={{
              fontSize: "20px",
              fontWeight: "700",
              color: PINTEREST.primary,
            }}>
              Boocozmo
            </span>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={onProfilePress}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px",
            borderRadius: "12px",
            background: PINTEREST.hoverBg,
            marginBottom: "24px",
            cursor: "pointer",
          }}
        >
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${PINTEREST.primary}, ${PINTEREST.dark})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "600",
            fontSize: "16px",
          }}>
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: PINTEREST.textDark }}>
              {currentUser.name.split(' ')[0]}
            </div>
            <div style={{ fontSize: "12px", color: PINTEREST.textLight }}>
              View profile
            </div>
          </div>
        </motion.div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <motion.button
              key={item.label}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={item.onClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "12px",
                background: "transparent",
                border: "none",
                color: PINTEREST.textDark,
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                borderRadius: "12px",
                marginBottom: "4px",
                textAlign: "left",
              }}
            >
              <item.icon size={18} />
              {item.label}
            </motion.button>
          ))}
        </nav>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddPress}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px",
            background: PINTEREST.primary,
            color: "white",
            border: "none",
            borderRadius: "24px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            width: "100%",
            justifyContent: "center",
            marginTop: "20px",
          }}
        >
          <FaPlus /> Share a Book
        </motion.button>

        <motion.button
          whileHover={{ x: 4 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            padding: "12px",
            background: "transparent",
            border: "none",
            color: PINTEREST.textLight,
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            borderRadius: "12px",
            marginTop: "12px",
            textAlign: "left",
          }}
        >
          <FaCog size={18} />
          Settings
        </motion.button>
      </motion.aside>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        marginLeft: sidebarOpen ? "240px" : "0",
        transition: "margin-left 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <header style={{
          padding: "12px 20px",
          background: PINTEREST.bg,
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: `1px solid ${PINTEREST.border}`,
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: PINTEREST.hoverBg,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: PINTEREST.textDark,
              cursor: "pointer",
            }}
          >
            {sidebarOpen ? <FaTimes /> : <FaEllipsisH />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: PINTEREST.hoverBg,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: PINTEREST.textDark,
              cursor: "pointer",
            }}
          >
            <FaArrowLeft size={18} />
          </motion.button>

          <h1 style={{
            fontSize: "20px",
            fontWeight: "700",
            color: PINTEREST.textDark,
            margin: 0,
          }}>
            Share a Book
          </h1>
        </header>

        {/* Scrollable Form */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
        }}>
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            {/* Book Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: `1px solid ${PINTEREST.border}`,
              }}
            >
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: PINTEREST.textDark,
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
                  border: `1px solid ${PINTEREST.border}`,
                  background: PINTEREST.grayLight,
                  fontSize: "16px",
                  resize: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                }}
              />
              <div style={{
                fontSize: "12px",
                color: PINTEREST.textMuted,
                marginTop: "8px",
                textAlign: "right",
              }}>
                {description.length}/500
              </div>
            </motion.div>

            {/* Condition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: `1px solid ${PINTEREST.border}`,
              }}
            >
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: PINTEREST.textDark,
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
                      border: `2px solid ${condition === opt.value ? opt.color : PINTEREST.border}`,
                      background: condition === opt.value ? `${opt.color}15` : "white",
                      color: condition === opt.value ? opt.color : PINTEREST.textDark,
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
              transition={{ delay: 0.15 }}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: `1px solid ${PINTEREST.border}`,
              }}
            >
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: PINTEREST.textDark,
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
                    border: `2px solid ${action === "sell" ? PINTEREST.primary : PINTEREST.border}`,
                    background: action === "sell" ? PINTEREST.redLight : "white",
                    color: action === "sell" ? PINTEREST.primary : PINTEREST.textDark,
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
                    border: `2px solid ${action === "trade" ? "#00A86B" : PINTEREST.border}`,
                    background: action === "trade" ? "#00A86B15" : "white",
                    color: action === "trade" ? "#00A86B" : PINTEREST.textDark,
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
              transition={{ delay: 0.2 }}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: `1px solid ${PINTEREST.border}`,
              }}
            >
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: PINTEREST.textDark,
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
                    color: PINTEREST.textMuted,
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
                      border: `1px solid ${PINTEREST.border}`,
                      background: PINTEREST.grayLight,
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
                    color: PINTEREST.textMuted,
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
                      border: `1px solid ${PINTEREST.border}`,
                      background: PINTEREST.grayLight,
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
              transition={{ delay: 0.25 }}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: `1px solid ${PINTEREST.border}`,
              }}
            >
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: PINTEREST.textDark,
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
                        background: PINTEREST.primary,
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
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
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
                      border: `2px dashed ${PINTEREST.border}`,
                      background: PINTEREST.grayLight,
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <FaCamera style={{
                      fontSize: "32px",
                      color: PINTEREST.primary,
                      marginBottom: "12px",
                    }} />
                    <div style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: PINTEREST.textDark,
                      marginBottom: "4px",
                    }}>
                      Tap to add photo
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: PINTEREST.textMuted,
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
                    background: PINTEREST.redLight,
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: PINTEREST.textDark,
                  }}>
                    <span style={{ fontWeight: "500" }}>
                      {image.name} ({(image.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <FaCheckCircle color={PINTEREST.primary} />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: `1px solid ${PINTEREST.border}`,
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
                  color: PINTEREST.textDark,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <FaMapMarkerAlt color={PINTEREST.primary} />
                  Location *
                </label>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                  style={{
                    background: "none",
                    border: "none",
                    color: PINTEREST.primary,
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
                  background: PINTEREST.grayLight,
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: locationSet ? PINTEREST.textDark : PINTEREST.textMuted,
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
                    background: PINTEREST.primary,
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
                        border: `2px solid ${PINTEREST.primary}`,
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Error & Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    background: PINTEREST.redLight,
                    borderLeft: `4px solid ${PINTEREST.primary}`,
                    padding: "12px 16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    fontSize: "14px",
                    color: PINTEREST.textDark,
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                    background: "#E6F7EE",
                    borderLeft: "4px solid #10B981",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    fontSize: "14px",
                    color: PINTEREST.textDark,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaCheckCircle color="#10B981" />
                  Book posted successfully! Redirecting...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Fixed Submit Button */}
        <div style={{
          padding: "16px 20px",
          background: PINTEREST.bg,
          borderTop: `1px solid ${PINTEREST.border}`,
        }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "24px",
              border: "none",
              background: loading ? PINTEREST.hoverBg : PINTEREST.primary,
              color: "white",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
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
        </div>
      </div>

      {/* Global Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { -webkit-tap-highlight-color: transparent; }
        input:focus, textarea:focus {
          outline: none;
          border-color: ${PINTEREST.primary} !important;
          box-shadow: 0 0 0 3px ${PINTEREST.redLight};
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: ${PINTEREST.border};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${PINTEREST.textLight};
        }
        @media (max-width: 768px) {
          aside { display: none; }
          div[style*="marginLeft"] { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}