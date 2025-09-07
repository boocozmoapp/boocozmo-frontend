import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../AuthContext";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const { width } = Dimensions.get("window");

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

type AuthScreenProps = {
  setIsLoggedIn: (value: boolean) => void;
};

export default function AuthScreen({ setIsLoggedIn }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setUser } = useContext(AuthContext);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleModeSwitch = (newMode: "login" | "signup") => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMode(newMode);
      setName("");
      setEmail("");
      setPassword("");
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleAuth = async () => {
    if (mode === "signup" && (!name || !email || !password)) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }
    if (mode === "login" && (!email || !password)) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/login" : "/signup";
      const response = await fetch(
        `https://834a32e433da.ngrok-free.app${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "signup" ? { name, email, password } : { email, password }
          ),
        }
      );
      const data = await response.json();
      if (response.ok) {
        // Store user data in AuthContext
        setUser({ name: data.name, email: data.email});
        Alert.alert(
          "Success",
          `Welcome ${mode === "signup" ? data.name : data.name || "user"}!`
        );
        setIsLoggedIn(true);
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      } else {
        Alert.alert(
          `${mode === "login" ? "Login" : "Signup"} Failed`,
          data.error || "Invalid credentials."
        );
      }
    } catch (error) {
      console.error(`${mode} error:`, error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Alert.alert(
      "Info",
      "Google Sign-In is not implemented yet. Please use email/password."
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.title}>Boocozmo</Text>
        <Text style={styles.subtitle}>Your Literary Journey</Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.formContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              mode === "login" && styles.activeToggle,
            ]}
            onPress={() => handleModeSwitch("login")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "login" && styles.activeToggleText,
              ]}
            >
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              mode === "signup" && styles.activeToggle,
            ]}
            onPress={() => handleModeSwitch("signup")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "signup" && styles.activeToggleText,
              ]}
            >
              Signup
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.formCard}>
          {mode === "signup" && (
            <TextInput
              style={[styles.input]}
              placeholder="Full Name"
              placeholderTextColor="#8A8A8A"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}
          <TextInput
            style={[styles.input, ]}
            placeholder="Email Address"
            placeholderTextColor="#8A8A8A"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, ]}
            placeholder="Password"
            placeholderTextColor="#8A8A8A"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>
              {loading ? "Processing..." : mode === "login" ? "Login" : "Sign Up"}
            </Text>
          </TouchableOpacity>
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Ionicons
              name="logo-google"
              size={18}
              color="#333"
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef7ec",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: " #2d1810",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#5d4037",
    marginTop: 8,
    fontWeight: "400",
  },
  formContainer: {
    width: width - 40,
    alignItems: "center",
  },
  modeToggle: {
    flexDirection: "row",
    width: "60%",
    backgroundColor: "#ffffffff",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#a67c5a",
  },
  activeToggle: {
    backgroundColor: "#8b5a3c",
  },
  toggleText: {
    fontSize: 14,
    color: "#ffffffff",
    fontWeight: "600",
  },
  activeToggleText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: 40,
    width: "114%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    height: 500,
    marginBottom: -150,
    opacity: 1,
  },
  input: {
    backgroundColor: "#fffff",
    color: "#1A1A1A",
    width: "100%",
    height: 58,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0d4c7",
  },
 
  button: {
    backgroundColor: "#8b5a3c",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#B0B0B0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  googleButtonText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },
  googleIcon: {
    marginRight: 8,
  },
});