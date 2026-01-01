import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  FaBookOpen,
  FaRegBookmark,
  FaPlus,
  FaComment,
  FaUser,
  FaArrowLeft,
  FaCamera,
} from "react-icons/fa6";
import { 
  FaMapMarkerAlt, 
  FaImage, 
  FaCheckCircle 
} from "react-icons/fa";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onBack?: () => void;
  currentUser: { email: string; name: string; id: string };
};

// Bronze color palette
const BRONZE = {
  primary: "#CD7F32",
  light: "#E6B17E",
  dark: "#B87333",
  pale: "#F5E7D3",
  bgLight: "#FDF8F3",
  bgDark: "#F5F0E6",
  text: "#5D4037"
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

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationSet, setLocationSet] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);

  const ownerEmail = currentUser.email;

  // Image compression function
  const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
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
          
          // Calculate new dimensions while maintaining aspect ratio
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
          
          // Draw image with new dimensions
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to compressed base64 (JPEG for better compression)
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
  };

  // Auto-detect location
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        setLocationSet(true);
      },
      () => {
        setError("Location denied. Tap map to set manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Init map
  useEffect(() => {
    if (!mapRef.current || latitude === null || longitude === null) return;

    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });
    mapInstance.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    const icon = L.divIcon({
      className: "custom-pin",
      html: `<div style="background:${BRONZE.primary};color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px ${BRONZE.primary}80;font-weight:bold;font-size:12px;">📍</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });

    const marker = L.marker([latitude, longitude], { icon }).addTo(map);
    markerInstance.current = marker;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setLatitude(lat);
      setLongitude(lng);
      setLocationSet(true);
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], 15);
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
      map.remove();
    };
  }, [latitude, longitude]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    
    setImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!description.trim()) return setError("Please describe the book.");
    if (action === "sell" && (!price || isNaN(Number(price)))) return setError("Enter valid price.");
    if (action === "trade" && !exchangeBook.trim()) return setError("Enter trade book.");
    if (!locationSet) return setError("Set your location.");

    setLoading(true);
    setError(null);

    try {
      let imageBase64: string | null = null;
      if (image) {
        try {
          console.log("Compressing image...");
          // Compress image to reduce size
          imageBase64 = await compressImage(image, 600, 0.7);
          console.log("Image compressed. Size:", imageBase64.length, "bytes");
          
          // If still too large, compress further
          if (imageBase64.length > 500000) { // More than 500KB
            console.log("Image still large, compressing further...");
            imageBase64 = await compressImage(image, 400, 0.6);
          }
        } catch (compressErr) {
          console.error("Image compression failed:", compressErr);
          // Fallback to original
          imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Image read failed"));
            reader.readAsDataURL(image);
          });
        }
      }

      // Use currentUser.id for the owner
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
        ownerId: currentUser.id, // Add ownerId to the payload
      };

      // Log payload size for debugging
      const payloadSize = JSON.stringify(payload).length;
      console.log(`Payload size: ${payloadSize} bytes (${Math.round(payloadSize / 1024)} KB)`);
      
      if (payloadSize > 10000000) { // More than 10MB
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
        throw new Error(err.error || "Failed to post");
      }

      setSuccess(true);
      setTimeout(() => {
        setDescription("");
        setPrice("");
        setExchangeBook("");
        setImage(null);
        setImagePreview(null);
        setLatitude(null);
        setLongitude(null);
        setLocationSet(false);
        setSuccess(false);
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const tradeBorder = action === "trade" ? `2px solid ${BRONZE.dark}` : `1px solid ${BRONZE.pale}`;
  const sellBorder = action === "sell" ? `2px solid ${BRONZE.primary}` : `1px solid ${BRONZE.pale}`;

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: BRONZE.bgLight,
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          background: "white",
          border: `2px solid ${BRONZE.pale}`,
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          color: BRONZE.primary,
          cursor: "pointer",
          zIndex: 100,
          boxShadow: `0 2px 8px ${BRONZE.primary}20`,
        }}
      >
        <FaArrowLeft />
      </button>

      {/* Header */}
      <header
        style={{
          padding: "60px 16px 16px",
          background: `linear-gradient(135deg, ${BRONZE.dark} 0%, ${BRONZE.primary} 100%)`,
          color: "white",
          textAlign: "center",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <h1 style={{ fontSize: "22px", fontWeight: "bold", margin: 0 }}>
          Share a Book
        </h1>
        <p style={{ fontSize: "14px", color: BRONZE.pale, margin: "4px 0 0" }}>
          Help someone find their next read
        </p>
      </header>

      {/* SCROLLABLE CONTENT — INCLUDES SUBMIT BUTTON */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          paddingBottom: "100px", // Space for bottom nav
          WebkitOverflowScrolling: "touch",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Description */}
        <div style={{ marginBottom: "20px" }}>
          <textarea
            placeholder="Tell others about this book..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "12px",
              borderRadius: "12px",
              border: `1px solid ${BRONZE.pale}`,
              background: "white",
              fontSize: "16px",
              resize: "none",
              boxSizing: "border-box",
              fontFamily: "'Georgia', serif",
            }}
          />
        </div>

        {/* Condition */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontWeight: "bold", margin: "0 0 8px", color: BRONZE.text }}>Condition</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {(["Excellent", "Very Good", "Good", "Fair"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "none",
                  background: condition === c ? BRONZE.primary : BRONZE.pale,
                  color: condition === c ? "white" : BRONZE.dark,
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {condition === c && <FaCheckCircle size={12} />}
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Action */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontWeight: "bold", margin: "0 0 8px", color: BRONZE.text }}>Action</p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setAction("sell")}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "12px",
                border: sellBorder,
                background: action === "sell" ? BRONZE.primary : "white",
                color: action === "sell" ? "white" : BRONZE.primary,
                fontWeight: "bold",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => action !== "sell" && (e.currentTarget.style.background = BRONZE.bgLight)}
              onMouseLeave={(e) => action !== "sell" && (e.currentTarget.style.background = "white")}
            >
              $ Sell
            </button>
            <button
              onClick={() => setAction("trade")}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "12px",
                border: tradeBorder,
                background: action === "trade" ? BRONZE.dark : "white",
                color: action === "trade" ? "white" : BRONZE.dark,
                fontWeight: "bold",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => action !== "trade" && (e.currentTarget.style.background = BRONZE.bgLight)}
              onMouseLeave={(e) => action !== "trade" && (e.currentTarget.style.background = "white")}
            >
              Trade
            </button>
          </div>
        </div>

        {/* Price / Trade */}
        {action === "sell" ? (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontWeight: "bold", margin: "0 0 8px", color: BRONZE.text }}>Price *</p>
            <input
              type="number"
              placeholder="$0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: `1px solid ${BRONZE.pale}`,
                background: "white",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontWeight: "bold", margin: "0 0 8px", color: BRONZE.text }}>Trade for...</p>
            <input
              placeholder="Book title"
              value={exchangeBook}
              onChange={(e) => setExchangeBook(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: `1px solid ${BRONZE.pale}`,
                background: "white",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* Image Upload with Preview */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontWeight: "bold", margin: "0 0 8px", color: BRONZE.text }}>Photo (optional)</p>
          <label
            style={{
              display: "block",
              padding: "20px",
              borderRadius: "12px",
              border: `2px dashed ${BRONZE.light}`,
              background: imagePreview ? `url(${imagePreview}) center/cover` : BRONZE.pale,
              textAlign: "center",
              cursor: "pointer",
              fontSize: "14px",
              color: BRONZE.dark,
              transition: "all 0.3s ease",
              minHeight: "150px",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = BRONZE.primary}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = BRONZE.light}
          >
            {imagePreview ? (
              <>
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(205, 127, 50, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <div style={{
                    background: "rgba(255, 255, 255, 0.9)",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    color: BRONZE.primary,
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <FaCamera />
                    Change Photo
                  </div>
                </div>
              </>
            ) : (
              <>
                <FaImage size={32} color={BRONZE.light} style={{ marginBottom: "8px" }} />
                <div style={{ fontWeight: "600" }}>Tap to upload photo</div>
                <div style={{ fontSize: "12px", color: BRONZE.dark, opacity: 0.7, marginTop: "4px" }}>
                  JPG or PNG, max 5MB
                </div>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleImagePick} style={{ display: "none" }} />
          </label>
          {image && (
            <div style={{ 
              marginTop: "8px", 
              fontSize: "14px", 
              color: BRONZE.dark,
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <FaCheckCircle color={BRONZE.primary} />
              {image.name} ({(image.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>

        {/* MINI MAP */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ 
            fontWeight: "bold", 
            margin: "0 0 8px", 
            display: "flex", 
            alignItems: "center", 
            gap: "6px",
            color: BRONZE.text 
          }}>
            <FaMapMarkerAlt style={{ color: BRONZE.primary }} /> Location
          </p>
          <div
            ref={mapRef}
            style={{
              height: "220px",
              borderRadius: "12px",
              overflow: "hidden",
              border: `2px solid ${BRONZE.primary}`,
              position: "relative",
              width: "100%",
            }}
          >
            {!locationSet && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255,255,255,0.95)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  color: BRONZE.primary,
                  fontSize: "14px",
                  zIndex: 10,
                }}
              >
                <FaMapMarkerAlt size={32} />
                <p>Tap to set location</p>
              </div>
            )}
          </div>
          <p style={{ fontSize: "13px", color: BRONZE.dark, margin: "8px 0 0" }}>
            {locationSet
              ? `Set: ${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`
              : "Auto-detecting..."}
          </p>
        </div>

        {/* Error / Success */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              color: "#d32f2f", 
              textAlign: "center", 
              margin: "0 0 16px", 
              fontSize: "14px",
              background: "rgba(211, 47, 47, 0.1)",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid rgba(211, 47, 47, 0.2)",
            }}
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              color: "#2e7d32", 
              textAlign: "center", 
              fontWeight: "bold", 
              fontSize: "15px",
              background: "rgba(46, 125, 50, 0.1)",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid rgba(46, 125, 50, 0.2)",
            }}
          >
            Offer posted successfully!
          </motion.p>
        )}

        {/* SUBMIT BUTTON — INSIDE SCROLL, NO FLOAT */}
        <div style={{ marginTop: "24px", padding: "0 16px" }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              background: `linear-gradient(135deg, ${BRONZE.primary}, ${BRONZE.dark})`,
              color: "white",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: `0 4px 16px ${BRONZE.primary}40`,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = "translateY(0)")}
          >
            {loading ? "Posting..." : "Share Your Book"}
          </button>
        </div>
      </div>

      {/* Bottom Nav — Fixed */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "12px 0",
          borderTop: `1px solid ${BRONZE.pale}`,
          background: "white",
          flexShrink: 0,
          boxShadow: "0 -2px 10px rgba(205, 127, 50, 0.1)",
        }}
      >
        {[
          { Icon: FaBookOpen, label: "Home" },
          { Icon: FaRegBookmark, label: "Saved" },
          { Icon: FaPlus, label: "Post", active: true },
          { Icon: FaComment, label: "Chat" },
          { Icon: FaUser, label: "Profile" },
        ].map(({ Icon, label, active }) => (
          <motion.div
            key={label}
            whileTap={{ scale: 0.9 }}
            style={{ 
              color: active ? BRONZE.primary : BRONZE.dark, 
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Icon size={22} />
            <span style={{ fontSize: "10px", fontWeight: "600" }}>{label}</span>
          </motion.div>
        ))}
      </nav>
    </div>
  );
}