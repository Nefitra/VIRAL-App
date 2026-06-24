import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info, Sparkles, Coins, Gift, ShieldAlert } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'reward' | 'system';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Auto-resolve defaults for premium feel
    let toastTitle = title;
    if (!toastTitle) {
      if (type === 'success') toastTitle = 'Action Completed';
      else if (type === 'error') toastTitle = 'Audit Alert';
      else if (type === 'reward') toastTitle = 'Reward Dispatched';
      else if (type === 'system') toastTitle = 'Ecosystem Sync';
      else toastTitle = 'Notice';
    }

    const newToast: Toast = { id, message, type, title: toastTitle, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-18 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 flex flex-col gap-2.5 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const { type, title, message } = toast;

  // Premium look configuration
  let icon = <Info className="h-5 w-5 text-[#8A2BFF]" />;
  let borderStyle = 'border-[#8A2BFF]/30';
  let bgStyle = 'bg-[#0B0618]/90';
  let glowStyle = 'shadow-[#8A2BFF]/10';
  let titleColor = 'text-white';

  if (type === 'success') {
    icon = <CheckCircle className="h-5 w-5 text-[#38F8B0]" />;
    borderStyle = 'border-[#38F8B0]/30';
    glowStyle = 'shadow-[#38F8B0]/5';
    titleColor = 'text-[#38F8B0]';
  } else if (type === 'error') {
    icon = <AlertCircle className="h-5 w-5 text-[#FF4D6D]" />;
    borderStyle = 'border-[#FF4D6D]/30';
    glowStyle = 'shadow-[#FF4D6D]/5';
    titleColor = 'text-[#FF4D6D]';
  } else if (type === 'reward') {
    icon = <Coins className="h-5 w-5 text-[#FFD36A] animate-bounce" />;
    borderStyle = 'border-[#FFD36A]/30';
    glowStyle = 'shadow-[#FFD36A]/10';
    titleColor = 'text-[#FFD36A]';
  } else if (type === 'system') {
    icon = <ShieldAlert className="h-5 w-5 text-[#B066FF]" />;
    borderStyle = 'border-[#B066FF]/30';
    glowStyle = 'shadow-[#B066FF]/5';
    titleColor = 'text-[#B066FF]';
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`pointer-events-auto w-full glass border rounded-xl p-3.5 flex gap-3 shadow-xl ${borderStyle} ${bgStyle} ${glowStyle} backdrop-blur-md relative overflow-hidden group`}
    >
      {/* Decorative ambient background blur */}
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-[#8A2BFF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Left Icon Accent */}
      <div className="shrink-0 flex items-center justify-center p-1 rounded-lg bg-white/5">
        {icon}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${titleColor} flex items-center gap-1`}>
          {title}
          {type === 'reward' && <Sparkles className="h-3.5 w-3.5 text-[#FFD36A] inline" />}
        </h4>
        <p className="text-[11px] text-[#A9A3B8] leading-normal font-sans">
          {message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="shrink-0 h-6 w-6 rounded-md flex items-center justify-center text-[#A9A3B8] hover:text-white hover:bg-white/5 transition-all self-start cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
};
