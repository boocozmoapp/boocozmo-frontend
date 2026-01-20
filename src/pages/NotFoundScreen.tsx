// src/pages/NotFoundScreen.tsx - Beautiful 404 Page
import { motion } from "framer-motion";
import { FaBook, FaHome, FaSearch, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-110px)] md:min-h-[calc(100vh-60px)] bg-gradient-to-br from-[#f4f1ea] to-[#e8e0d5] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Floating Books Animation */}
        <div className="relative h-40 mb-8">
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/4 top-0"
          >
            <div className="w-12 h-16 bg-gradient-to-br from-[#382110] to-[#5a3e2b] rounded-sm shadow-lg transform -rotate-12" />
          </motion.div>
          
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [3, -3, 3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            className="absolute left-1/2 top-4 transform -translate-x-1/2"
          >
            <div className="w-16 h-20 bg-gradient-to-br from-[#377458] to-[#2d5c46] rounded-sm shadow-xl" />
          </motion.div>
          
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [8, -2, 8] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="absolute right-1/4 top-2"
          >
            <div className="w-10 h-14 bg-gradient-to-br from-[#8b5a2b] to-[#6d4422] rounded-sm shadow-lg transform rotate-12" />
          </motion.div>
          
          {/* Question mark */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute left-1/2 bottom-0 transform -translate-x-1/2"
          >
            <span className="text-6xl font-serif text-[#382110]/30">?</span>
          </motion.div>
        </div>

        {/* 404 Text */}
        <motion.h1
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-8xl font-bold font-serif text-[#382110] mb-4"
        >
          404
        </motion.h1>
        
        <h2 className="text-2xl font-serif font-bold text-[#382110] mb-3">
          Page Not Found
        </h2>
        
        <p className="text-[#555] mb-8 leading-relaxed">
          Looks like this page wandered off to a different chapter. 
          Let's get you back to familiar territory!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-[#382110] text-[#382110] font-semibold hover:bg-[#382110] hover:text-white transition-all active:scale-95"
          >
            <FaArrowLeft />
            Go Back
          </button>
          
          <button
            onClick={() => navigate("/home")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#382110] to-[#5a3e2b] text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <FaHome />
            Home
          </button>
          
          <button
            onClick={() => navigate("/discover")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#377458] to-[#2d5c46] text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <FaSearch />
            Discover
          </button>
        </div>

        {/* Fun fact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 p-4 bg-white/60 rounded-2xl border border-[#d8d8d8]"
        >
          <p className="text-sm text-[#555] flex items-center justify-center gap-2">
            <FaBook className="text-[#382110]" />
            <span>Fun fact: The average person reads 12 books per year. How many have you read?</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
