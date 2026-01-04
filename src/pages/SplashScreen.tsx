import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBookOpen } from "react-icons/fa";

type Props = {
  onFinish?: () => void;
};

export default function SplashScreen({ onFinish }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    const complete = setTimeout(() => {
      onFinish?.();
    }, 2800);

    return () => {
      clearInterval(timer);
      clearTimeout(complete);
    };
  }, [onFinish]);

  return (
    <div className="h-screen w-full bg-primary flex flex-col items-center justify-center overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary-light blur-[100px]" />
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-10 flex flex-col items-center"
        >
          {/* Logo Icon */}
          <motion.div
            initial={{ rotate: -10, y: -20 }}
            animate={{ rotate: 0, y: 0 }}
            transition={{ 
              duration: 1.2, 
              type: "spring", 
              bounce: 0.5 
            }}
            className="mb-6 relative"
          >
            <div className="absolute inset-0 bg-secondary blur-xl opacity-30 animate-pulse" />
            <FaBookOpen className="text-7xl text-secondary relative z-10" />
            <motion.div 
              className="absolute -top-2 -right-2 text-white"
              animate={{ rotate: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              ✨
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl font-serif font-bold text-white mb-2 tracking-wide"
          >
            Boocozmo
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-text-muted text-lg font-light tracking-widest uppercase mb-12"
          >
            Discover. Exchange. Connect.
          </motion.p>

          {/* Progress Bar */}
          <div className="w-64 h-1 bg-primary-light rounded-full overflow-hidden relative">
            <motion.div 
              className="h-full bg-secondary absolute top-0 left-0"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
          
          <motion.div 
            className="mt-4 text-xs text-text-muted font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.8 }}
          >
            Loading Library... {progress}%
          </motion.div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}