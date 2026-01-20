// src/components/Toast.tsx - Beautiful Cartoonish Toast & Modal System
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaTimesCircle, FaBook } from "react-icons/fa";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
};

type ModalConfig = {
  title: string;
  message: string;
  type?: ToastType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

type ToastContextType = {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  showModal: (config: ModalConfig) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  confirm: (title: string, message: string, onConfirm: () => void) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

const iconMap = {
  success: FaCheckCircle,
  error: FaTimesCircle,
  warning: FaExclamationTriangle,
  info: FaInfoCircle,
};

const colorMap = {
  success: {
    bg: "bg-gradient-to-r from-emerald-500 to-green-600",
    border: "border-emerald-400",
    icon: "text-white",
    shadow: "shadow-emerald-500/30",
  },
  error: {
    bg: "bg-gradient-to-r from-rose-500 to-red-600",
    border: "border-rose-400",
    icon: "text-white",
    shadow: "shadow-rose-500/30",
  },
  warning: {
    bg: "bg-gradient-to-r from-amber-400 to-orange-500",
    border: "border-amber-300",
    icon: "text-white",
    shadow: "shadow-amber-500/30",
  },
  info: {
    bg: "bg-gradient-to-r from-blue-500 to-indigo-600",
    border: "border-blue-400",
    icon: "text-white",
    shadow: "shadow-blue-500/30",
  },
};

const modalColorMap = {
  success: "from-emerald-500 to-green-600",
  error: "from-rose-500 to-red-600",
  warning: "from-amber-400 to-orange-500",
  info: "from-blue-500 to-indigo-600",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = iconMap[toast.type];
  const colors = colorMap[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, y: -30, scale: 0.8, rotateX: 15 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`
        relative flex items-start gap-3 p-4 pr-10 rounded-2xl border-2 ${colors.border}
        ${colors.bg} text-white min-w-[300px] max-w-[420px]
        shadow-xl ${colors.shadow} backdrop-blur-sm
      `}
      style={{ perspective: "1000px" }}
    >
      {/* Decorative book icon */}
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
        <FaBook className="text-[#382110] text-sm" />
      </div>
      
      <div className={`flex-shrink-0 mt-0.5 ${colors.icon}`}>
        <Icon size={24} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-base leading-tight">{toast.title}</h4>
        {toast.message && (
          <p className="text-sm opacity-90 mt-1 leading-snug">{toast.message}</p>
        )}
      </div>
      
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss notification"
      >
        <FaTimes size={14} />
      </button>
      
      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: (toast.duration || 4000) / 1000, ease: "linear" }}
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 origin-left rounded-b-2xl"
      />
    </motion.div>
  );
}

function ModalOverlay({
  config,
  onClose,
}: {
  config: ModalConfig;
  onClose: () => void;
}) {
  const type = config.type || "info";
  const Icon = iconMap[type];
  const gradientColor = modalColorMap[type];

  const handleConfirm = () => {
    config.onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    config.onCancel?.();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
      >
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${gradientColor} p-6 pb-12 relative`}>
          {/* Decorative circles */}
          <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute top-8 right-8 w-8 h-8 rounded-full bg-white/10" />
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Icon className="text-white text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-white">{config.title}</h2>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-6 pt-0 -mt-6 relative">
          {/* Card that overlaps header */}
          <div className="bg-[#fdfaf5] rounded-2xl p-5 shadow-lg border border-[#e8e0d5]">
            {/* Cute book mascot */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#382110] to-[#5a3e2b] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                <FaBook className="text-white text-2xl" />
              </div>
            </div>
            
            <p className="text-center text-[#555] leading-relaxed">{config.message}</p>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3 mt-5">
            {config.cancelText !== undefined && (
              <button
                onClick={handleCancel}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-[#d8d8d8] text-[#555] font-semibold hover:bg-[#f4f1ea] transition-all active:scale-95"
              >
                {config.cancelText || "Cancel"}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`flex-1 py-3 px-4 rounded-xl bg-gradient-to-r ${gradientColor} text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95`}
            >
              {config.confirmText || "OK"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modal, setModal] = useState<ModalConfig | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newToast: Toast = { id, type, title, message, duration };
      
      setToasts((prev) => [...prev.slice(-2), newToast]); // Keep max 3 toasts
      
      setTimeout(() => dismissToast(id), duration);
    },
    [dismissToast]
  );

  const showModal = useCallback((config: ModalConfig) => {
    setModal(config);
  }, []);

  const success = useCallback(
    (title: string, message?: string) => showToast("success", title, message),
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string) => showToast("error", title, message),
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => showToast("warning", title, message),
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string) => showToast("info", title, message),
    [showToast]
  );

  const confirm = useCallback(
    (title: string, message: string, onConfirm: () => void) => {
      setModal({
        title,
        message,
        type: "warning",
        confirmText: "Yes, Continue",
        cancelText: "Cancel",
        onConfirm,
      });
    },
    []
  );

  return (
    <ToastContext.Provider
      value={{ showToast, showModal, success, error, warning, info, confirm }}
    >
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onDismiss={() => dismissToast(toast.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Modal */}
      <AnimatePresence>
        {modal && <ModalOverlay config={modal} onClose={() => setModal(null)} />}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export default ToastContext;
