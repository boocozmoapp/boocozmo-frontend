/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/OfferScreen.tsx - GREEN ENERGY THEME: Calm, Sustainable, Professional
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
  FaTimes,
  FaHome,
  FaMapMarkedAlt,
  FaPlus,
  FaComments,
  FaBell,
  FaBookmark,
  FaCompass,
  FaBookOpen,
  FaStar,
  FaCog,
  FaUsers,
  FaExpand,
  FaCompress,
  FaCrosshairs,
  FaBars,
} from "react-icons/fa";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api";

const GREEN = {
  dark: "#0F2415",
  medium: "#1A3A2A",
  accent: "#4A7C59",
  accentLight: "#6BA87A",
  textPrimary: "#E8F0E8",
  textSecondary: "#A8B8A8",
  textMuted: "#80A080",
  border: "rgba(74, 124, 89, 0.3)",
  grayLight: "#2A4A3A",
  hoverBg: "#255035",
  icon: "#80A080",
  success: "#6BA87A",
  info: "#1D9BF0",
  warning: "#FF9500",
};

// Custom marker icon
const createCustomIcon = () => {
  return L.divIcon({
    className: "custom-offer-marker",
    html: `
      <div style="
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: ${GREEN.accent};
        border: 4px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 20px;
        box-shadow: 0 4px 20px rgba(74, 124, 89, 0.5);
        cursor: move;
      ">
        📚
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50],
  });
};

type Props = {
  onBack?: () => void;
  currentUser: { email: string; name: string; id: string; token: string };
  onProfilePress?: () => void;
  onMapPress?: () => void;
  onAddPress?: () => void;
};

export default function OfferScreen({
  onBack,
  currentUser,
  onProfilePress,
  onMapPress,
  onAddPress,
}: Props) {
  const navigate = useNavigate();

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
  const [mapExpanded, setMapExpanded] = useState(false);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationSet, setLocationSet] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { icon: FaHome, label: "Home", onClick: () => navigate("/") },
    { icon: FaMapMarkedAlt, label: "Map", onClick: onMapPress || (() => navigate("/map")) },
    { icon: FaBookOpen, label: "My Library", onClick: () => navigate("/my-library") },
    { icon: FaCompass, label: "Discover", onClick: () => navigate("/discover") },
    { icon: FaBookmark, label: "Saved", onClick: () => navigate("/saved") },
    { icon: FaUsers, label: "Following", onClick: () => navigate("/following") },
    { icon: FaComments, label: "Messages", onClick: () => navigate("/chat") },
    { icon: FaBell, label: "Notifications", onClick: () => navigate("/notifications") },
    { icon: FaStar, label: "Top Picks", onClick: () => navigate("/top-picks") },
  ];

  const initializeMap = useCallback(() => {
    if (!mapRef.current) return;

    const defaultLat = latitude ?? 40.7128;
    const defaultLng = longitude ?? -74.006;

    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const map = L.map(mapRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 15,
      zoomControl: true,
      attributionControl: true,
      minZoom: 3,
      maxZoom: 19,
      scrollWheelZoom: 'center',
      wheelDebounceTime: 40,
      doubleClickZoom: 'center',
      touchZoom: 'center',
      bounceAtZoomLimits: true,
      inertia: true,
      inertiaDeceleration: 3000,
    });

    mapInstance.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '© OpenStreetMap contributors, © CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    L.control.scale({ imperial: true, metric: true, position: 'bottomleft' }).addTo(map);

    const customIcon = createCustomIcon();

    const marker = L.marker([defaultLat, defaultLng], {
      icon: customIcon,
      draggable: true,
      autoPan: true,
      riseOnHover: true,
    }).addTo(map);

    markerInstance.current = marker;

    marker.on("dragstart", () => marker.setOpacity(0.7));
    marker.on("dragend", async () => {
      const pos = marker.getLatLng();
      setLatitude(pos.lat);
      setLongitude(pos.lng);
      setLocationSet(true);
      marker.setOpacity(1);
      await reverseGeocode(pos.lat, pos.lng);
    });

    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setLatitude(lat);
      setLongitude(lng);
      setLocationSet(true);
      marker.setLatLng([lat, lng]);
      await reverseGeocode(lat, lng);
    });
  }, [latitude, longitude]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        const address = data.display_name.split(',').slice(0, 3).join(',');
        setCurrentAddress(address);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setCurrentAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const detectLocation = useCallback(async () => {
    setIsLocating(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setLatitude(latitude);
          setLongitude(longitude);
          setLocationSet(true);
          setIsLocating(false);

          if (mapInstance.current) {
            mapInstance.current.setView([latitude, longitude], 17, { animate: true, duration: 0.5 });
            if (markerInstance.current) markerInstance.current.setLatLng([latitude, longitude]);
          }

          await reverseGeocode(latitude, longitude);
        },
        () => {
          setError("Location access denied. Tap map to set manually.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation not supported");
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    if (showLocationPicker) {
      setTimeout(() => initializeMap(), 100);
    }
  }, [showLocationPicker, initializeMap]);

  useEffect(() => {
    if (mapInstance.current && latitude && longitude) {
      mapInstance.current.setView([latitude, longitude], 15, { animate: true, duration: 0.5 });
      if (markerInstance.current) markerInstance.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("Image too large (max 5MB)");
    if (!file.type.startsWith('image/')) return setError("Please select an image file");

    setImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const conditionOptions = [
    { value: "Excellent", color: GREEN.success, icon: "✨" },
    { value: "Very Good", color: GREEN.accentLight, icon: "👍" },
    { value: "Good", color: "#F59E0B", icon: "👌" },
    { value: "Fair", color: GREEN.textSecondary, icon: "📖" },
  ] as const;

  const handleSubmit = async () => {
    if (!description.trim()) return setError("Please describe the book");
    if (action === "sell" && (!price || isNaN(Number(price)) || Number(price) <= 0)) return setError("Enter a valid price");
    if (action === "trade" && !exchangeBook.trim()) return setError("Enter the book you want to trade for");
    if (!locationSet) return setError("Please set your location");

    setLoading(true);
    setError(null);

    try {
      let imageBase64: string | null = null;
      if (image) {
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(image);
        });
      }

      const payload = {
        type: action === "sell" ? "sell" : "exchange",
        bookTitle: description.trim(),
        exchangeBook: action === "trade" ? exchangeBook.trim() : null,
        price: action === "sell" ? Number(price) : null,
        latitude: latitude!,
        longitude: longitude!,
        image: imageBase64,
        condition,
        ownerEmail: currentUser.email,
        address: currentAddress,
      };

      const resp = await fetch(`${API_BASE}/submit-offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || "Failed to post offer");
      }

      setSuccess(true);
      setTimeout(() => {
        setDescription("");
        setPrice("");
        setExchangeBook("");
        setImage(null);
        setImagePreview(null);
        setSuccess(false);
        if (onBack) onBack();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to post offer");
    } finally {
      setLoading(false);
    }
  };

  const toggleMapExpansion = () => {
    setMapExpanded(!mapExpanded);
    setTimeout(() => {
      if (mapRef.current && mapInstance.current) {
        mapInstance.current.invalidateSize();
        if (latitude && longitude) {
          mapInstance.current.setView([latitude, longitude], 15, { animate: true, duration: 0.3 });
        }
      }
    }, 50);
  };

  const centerOnLocation = () => {
    if (mapInstance.current && latitude && longitude) {
      mapInstance.current.setView([latitude, longitude], 17, { animate: true, duration: 0.5 });
    }
  };

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      background: GREEN.dark,
      display: "flex",
      fontFamily: "'Inter', -apple-system, sans-serif",
      overflow: "hidden",
    }}>
      {/* Sidebar Navigation */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 25 }}
        style={{
          width: "240px",
          background: GREEN.medium,
          borderRight: `1px solid ${GREEN.border}`,
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 1000,
          padding: "20px 16px",
          overflowY: "auto",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: GREEN.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "700",
              fontSize: "14px",
            }}>
              B
            </div>
            <span style={{ fontSize: "20px", fontWeight: "800", color: GREEN.textPrimary }}>
              Boocozmo
            </span>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={onProfilePress || (() => navigate("/profile"))}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px",
            borderRadius: "12px",
            background: GREEN.hoverBg,
            marginBottom: "24px",
            cursor: "pointer",
          }}
        >
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: GREEN.accent,
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
            <div style={{ fontSize: "14px", fontWeight: "600", color: GREEN.textPrimary }}>
              {currentUser.name.split(" ")[0]}
            </div>
            <div style={{ fontSize: "12px", color: GREEN.textSecondary }}>View profile</div>
          </div>
        </motion.div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <motion.button
              key={item.label}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                item.onClick();
                setSidebarOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "12px",
                background: "transparent",
                border: "none",
                color: GREEN.textPrimary,
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

        {onAddPress && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onAddPress();
              setSidebarOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px",
              background: GREEN.accent,
              color: "white",
              border: "none",
              borderRadius: "24px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              width: "100%",
              justifyContent: "center",
              marginTop: "20px",
              boxShadow: "0 4px 20px rgba(74, 124, 89, 0.4)",
            }}
          >
            <FaPlus /> Share a Book
          </motion.button>
        )}

        <motion.button
          whileHover={{ x: 4 }}
          onClick={() => setSidebarOpen(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            padding: "12px",
            background: "transparent",
            border: "none",
            color: GREEN.textSecondary,
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
        <header style={{
          padding: "12px 20px",
          background: GREEN.medium,
          borderBottom: `1px solid ${GREEN.border}`,
          flexShrink: 0,
          zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
              <div
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "8px",
                  background: GREEN.grayLight,
                  border: `1px solid ${GREEN.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {sidebarOpen ? <FaTimes size={20} color={GREEN.textPrimary} /> : <FaBars size={20} color={GREEN.textPrimary} />}
              </div>

              <button
                onClick={onBack || (() => navigate(-1))}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "8px",
                  background: GREEN.grayLight,
                  border: `1px solid ${GREEN.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <FaArrowLeft size={20} color={GREEN.textPrimary} />
              </button>

              <h1 style={{
                fontSize: "20px",
                fontWeight: "700",
                color: GREEN.textPrimary,
                margin: 0,
              }}>
                Share a Book
              </h1>
            </div>
          </div>
        </header>

        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          position: "relative",
        }}>
          <div style={{ 
            maxWidth: "600px", 
            margin: "0 auto",
            transition: "filter 0.3s ease",
            filter: mapExpanded ? "blur(4px)" : "none",
            pointerEvents: mapExpanded ? "none" : "auto",
          }}>
            {/* Book Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: GREEN.medium,
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
                border: `1px solid ${GREEN.border}`,
              }}
            >
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: GREEN.textPrimary,
                marginBottom: "8px",
              }}>
                Book Description *
              </label>
              <textarea
                placeholder="Tell others about this book, include title, author, and any details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "12px",
                  borderRadius: "12px",
                  border: `1px solid ${GREEN.border}`,
                  background: GREEN.grayLight,
                  fontSize: "16px",
                  resize: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                  color: GREEN.textPrimary,
                }}
              />
              <div style={{
                fontSize: "12px",
                color: GREEN.textMuted,
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
                background: GREEN.medium,
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
                border: `1px solid ${GREEN.border}`,
              }}
            >
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: GREEN.textPrimary,
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
                      border: `2px solid ${condition === opt.value ? opt.color : GREEN.border}`,
                      background: condition === opt.value ? `${opt.color}20` : GREEN.grayLight,
                      color: condition === opt.value ? opt.color : GREEN.textPrimary,
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
                background: GREEN.medium,
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
                border: `1px solid ${GREEN.border}`,
              }}
            >
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: GREEN.textPrimary,
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
                    border: `2px solid ${action === "sell" ? GREEN.accent : GREEN.border}`,
                    background: action === "sell" ? GREEN.hoverBg : GREEN.grayLight,
                    color: action === "sell" ? GREEN.accentLight : GREEN.textPrimary,
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
                    border: `2px solid ${action === "trade" ? GREEN.success : GREEN.border}`,
                    background: action === "trade" ? `${GREEN.success}20` : GREEN.grayLight,
                    color: action === "trade" ? GREEN.success : GREEN.textPrimary,
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
                background: GREEN.medium,
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
                border: `1px solid ${GREEN.border}`,
              }}
            >
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: GREEN.textPrimary,
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
                    color: GREEN.textMuted,
                  }} />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    step="0.01"
                    min="0"
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 36px",
                      borderRadius: "12px",
                      border: `1px solid ${GREEN.border}`,
                      background: GREEN.grayLight,
                      fontSize: "16px",
                      boxSizing: "border-box",
                      color: GREEN.textPrimary,
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
                    color: GREEN.textMuted,
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
                      border: `1px solid ${GREEN.border}`,
                      background: GREEN.grayLight,
                      fontSize: "16px",
                      boxSizing: "border-box",
                      color: GREEN.textPrimary,
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
                background: GREEN.medium,
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
                border: `1px solid ${GREEN.border}`,
              }}
            >
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: GREEN.textPrimary,
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
                        background: GREEN.accent,
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
                      border: `2px dashed ${GREEN.border}`,
                      background: GREEN.grayLight,
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <FaCamera style={{
                      fontSize: "32px",
                      color: GREEN.accent,
                      marginBottom: "12px",
                    }} />
                    <div style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: GREEN.textPrimary,
                      marginBottom: "4px",
                    }}>
                      Tap to add photo
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: GREEN.textMuted,
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
                    background: GREEN.hoverBg,
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: GREEN.textPrimary,
                  }}>
                    <span style={{ fontWeight: "500" }}>
                      {image.name} ({(image.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <FaCheckCircle color={GREEN.success} />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Location Picker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                background: GREEN.medium,
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "16px",
                border: `1px solid ${GREEN.border}`,
                position: "relative",
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
                  color: GREEN.textPrimary,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  <FaMapMarkerAlt color={GREEN.accent} />
                  Location *
                </label>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                  style={{
                    border: "none",
                    color: GREEN.accent,
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: showLocationPicker ? GREEN.hoverBg : "transparent",
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
                  background: GREEN.grayLight,
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: locationSet ? GREEN.textPrimary : GREEN.textMuted,
                  fontWeight: locationSet ? "500" : "400",
                  minHeight: "40px",
                  display: "flex",
                  alignItems: "center",
                }}>
                  {currentAddress || (locationSet 
                    ? `${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`
                    : "Location not set - tap map or use detect"
                  )}
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
                    background: GREEN.accent,
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: isLocating ? "not-allowed" : "pointer",
                    opacity: isLocating ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    minWidth: "120px",
                    justifyContent: "center",
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
                    animate={{ height: mapExpanded ? "80vh" : "300px", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      overflow: "hidden",
                      marginTop: "12px",
                      position: "relative",
                      borderRadius: "12px",
                      border: mapExpanded ? `3px solid ${GREEN.accent}` : `2px solid ${GREEN.border}`,
                      zIndex: mapExpanded ? 1000 : "auto",
                    }}
                  >
                    <div style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      zIndex: 1001,
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleMapExpansion}
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: GREEN.accent,
                          border: "none",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "16px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        }}
                      >
                        {mapExpanded ? <FaCompress /> : <FaExpand />}
                      </motion.button>

                      {locationSet && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={centerOnLocation}
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: GREEN.info,
                            border: "none",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "16px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                          }}
                        >
                          <FaCrosshairs />
                        </motion.button>
                      )}
                    </div>

                    <div style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "12px",
                      right: "12px",
                      zIndex: 1001,
                      background: "rgba(26,58,42,0.9)",
                      backdropFilter: "blur(10px)",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: GREEN.textPrimary,
                      fontWeight: "500",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}>
                      <span>
                        Drag marker or tap map to set location
                      </span>
                      {mapExpanded && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={toggleMapExpansion}
                          style={{
                            padding: "6px 12px",
                            background: GREEN.accent,
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Done
                        </motion.button>
                      )}
                    </div>

                    <div
                      ref={mapRef}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "10px",
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Error / Success */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    background: GREEN.hoverBg,
                    borderLeft: `4px solid ${GREEN.warning}`,
                    padding: "12px 16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    fontSize: "14px",
                    color: GREEN.textPrimary,
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
                    background: `${GREEN.success}20`,
                    borderLeft: `4px solid ${GREEN.success}`,
                    padding: "12px 16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    fontSize: "14px",
                    color: GREEN.textPrimary,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaCheckCircle color={GREEN.success} />
                  Book posted successfully! Redirecting...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Submit Button */}
        <div style={{
          padding: "16px 20px",
          background: GREEN.medium,
          borderTop: `1px solid ${GREEN.border}`,
          zIndex: 50,
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
              background: loading ? GREEN.grayLight : GREEN.accent,
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

      {/* Expanded Map Overlay */}
      <AnimatePresence>
        {mapExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(8px)",
              zIndex: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={toggleMapExpansion}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .custom-offer-marker:hover {
          transform: scale(1.1);
        }
        
        .leaflet-control-zoom {
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        }
        
        .leaflet-control-scale {
          background: rgba(26,58,42,0.9) !important;
          border-radius: 4px !important;
          padding: 4px 8px !important;
          font-size: 11px !important;
          color: ${GREEN.textPrimary} !important;
        }
        
        .leaflet-container {
          font-family: 'Inter', -apple-system, sans-serif !important;
        }
      `}</style>
    </div>
  );
}