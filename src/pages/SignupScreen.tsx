import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaCheck, FaBookOpen } from "react-icons/fa";

const API_BASE = "https://boocozmo-api.onrender.com";

type Props = {
  onSignupSuccess: (user: { email: string; name: string; id: string; token: string }) => void;
  onGoToLogin: () => void;
};

export default function SignupScreen({ onSignupSuccess, onGoToLogin }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!name.trim()) return setError("Please enter your name");
    if (!email.trim()) return setError("Please enter your email");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return setError("Please enter a valid email address");
    if (!password) return setError("Please enter a password");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim().toLowerCase(), 
          password 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      const user = {
        id: data.id.toString(),
        name: data.name,
        email: data.email,
        token: data.token,
      };

      localStorage.setItem("user", JSON.stringify(user));
      setSuccess(true);

      setTimeout(() => {
        onSignupSuccess(user);
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { width: "0%", color: "bg-gray-600", label: "" };
    if (pass.length < 6) return { width: "33%", color: "bg-red-500", label: "Weak" };
    if (pass.length < 10) return { width: "66%", color: "bg-yellow-500", label: "Medium" };
    return { width: "100%", color: "bg-green-500", label: "Strong" };
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen w-full bg-primary flex items-center justify-center p-4 relative overflow-hidden">
       {/* Background Decor */}
       <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />
       <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary-light/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-panel w-full max-w-md p-8 md:p-10 rounded-3xl shadow-2xl relative z-10 backdrop-blur-xl border border-white/10"
      >
        <AnimatePresence>
          {success && (
             <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 bg-primary/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center z-20"
           >
             <motion.div
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               transition={{ type: "spring", stiffness: 200 }}
               className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6 shadow-xl"
             >
               <FaCheck className="text-white text-4xl" />
             </motion.div>
             <h3 className="text-2xl font-bold text-white mb-2">Welcome Aboard!</h3>
             <p className="text-text-muted text-center max-w-xs">Your account has been created. Preparing your library...</p>
           </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-secondary text-white rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-lg mb-4 -rotate-3">
             <FaBookOpen />
          </div>
          <h2 className="text-3xl font-serif font-bold text-white mb-2">Join Boocozmo</h2>
          <p className="text-text-muted">Start your sustainable reading journey today.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
           <div className="space-y-1">
            <label className="text-sm font-medium text-text-muted ml-1">Full Name</label>
            <div className="relative group">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-secondary transition-colors" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-primary-light/50 border border-white/10 rounded-xl px-12 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                placeholder="John Doe"
              />
            </div>
           </div>

           <div className="space-y-1">
            <label className="text-sm font-medium text-text-muted ml-1">Email</label>
            <div className="relative group">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-secondary transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-primary-light/50 border border-white/10 rounded-xl px-12 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                placeholder="john@example.com"
              />
            </div>
           </div>

           <div className="space-y-1">
            <label className="text-sm font-medium text-text-muted ml-1">Password</label>
            <div className="relative group">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-secondary transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-primary-light/50 border border-white/10 rounded-xl px-12 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
             {password && (
              <div className="flex items-center gap-2 mt-1 ml-1">
                <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${strength.color}`} 
                    initial={{ width: 0 }}
                    animate={{ width: strength.width }}
                  />
                </div>
                <span className="text-xs text-text-muted">{strength.label}</span>
              </div>
            )}
           </div>

           <div className="space-y-1">
            <label className="text-sm font-medium text-text-muted ml-1">Confirm Password</label>
            <div className="relative group">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-secondary transition-colors" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-primary-light/50 border border-white/10 rounded-xl px-12 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                placeholder="Repeat password"
              />
               <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {confirmPassword && (
              <p className={`text-xs ml-1 ${password === confirmPassword ? "text-green-400" : "text-red-400"}`}>
                {password === confirmPassword ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
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

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-secondary hover:bg-secondary-hover text-white font-semibold py-4 rounded-xl shadow-lg shadow-secondary/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-8 text-center text-text-muted text-sm">
          Already have an account?{" "}
          <button 
            onClick={onGoToLogin}
            className="text-white hover:text-secondary font-semibold ml-1 transition-colors"
          >
            Sign In
          </button>
        </div>
      </motion.div>
    </div>
  );
}