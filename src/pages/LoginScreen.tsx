import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaBookOpen } from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onLoginSuccess: (user: { email: string; name: string; id: string; token: string }) => void;
  onGoToSignup: () => void;
};

export default function LoginScreen({ onLoginSuccess, onGoToSignup }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check for existing session
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const response = await fetch(`${API_BASE}/validate-session`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });

          if (response.ok) {
            onLoginSuccess(user);
            return;
          }
        }
      } catch {
        console.log("No valid session");
      } finally {
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [onLoginSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      const user = {
        id: data.id.toString(),
        name: data.name,
        email: data.email,
        token: data.token,
      };

      localStorage.setItem("user", JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }} 
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center"
        >
          <div className="text-secondary text-4xl mb-4">
            <FaBookOpen />
          </div>
          <p className="text-text-muted text-sm tracking-wider uppercase">Authenticating...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary-light/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-panel w-full max-w-md p-8 md:p-12 rounded-3xl shadow-2xl relative z-10 backdrop-blur-xl border border-white/10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-16 h-16 bg-secondary text-white rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-lg mb-6 rotate-3"
          >
            <FaBookOpen />
          </motion.div>
          <h2 className="text-3xl font-serif font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-text-muted">Sign in to continue your literary journey.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted ml-1">Email</label>
            <div className="relative group">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-secondary transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-primary-light/50 border border-white/10 rounded-xl px-12 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                placeholder="reader@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted ml-1">Password</label>
            <div className="relative group">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-secondary transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-primary-light/50 border border-white/10 rounded-xl px-12 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-secondary focus:ring-secondary" />
              <span className="text-text-muted group-hover:text-white transition-colors">Remember me</span>
            </label>
            <button type="button" className="text-secondary hover:text-secondary-hover transition-colors font-medium">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary hover:bg-secondary-hover text-white font-semibold py-4 rounded-xl shadow-lg shadow-secondary/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center text-text-muted text-sm">
          Don't have an account?{" "}
          <button 
            onClick={onGoToSignup}
            className="text-white hover:text-secondary font-semibold ml-1 transition-colors"
          >
            Create account
          </button>
        </div>
      </motion.div>
    </div>
  );
}