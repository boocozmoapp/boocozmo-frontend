import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";

type Props = {
  title: string;
  onBack?: () => void;
  children: ReactNode;
};

export default function PremiumLayout({ title, onBack, children }: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#382110] to-[#5a3e2b] text-white">
      {/* Curved Hero Header */}
      <header className="relative h-[25vh] md:h-[30vh] w-full rounded-b-[40px] md:rounded-b-[80px] overflow-hidden shadow-lg">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2000&auto=format&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#382110]/60 via-[#382110]/30 to-transparent" />
        </div>
        <div className="absolute inset-0 flex items-center justify-between px-6 md:px-12 z-20">
          {onBack && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-all"
            >
              <FaArrowLeft />
            </motion.button>
          )}
          <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 pointer-events-none">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h2>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">{children}</main>
    </div>
  );
}
