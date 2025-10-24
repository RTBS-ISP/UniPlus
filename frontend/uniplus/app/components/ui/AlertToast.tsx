'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

type Variant = 'success' | 'error' | 'warning' | 'info';

export type AlertToastProps = {
  open: boolean;
  onClose: () => void;
  text: string;
  variant?: Variant;
  duration?: number;
  className?: string;
};

const ICONS: Record<Variant, React.ReactNode> = {
  success: <Check className="h-4 w-4 text-white" />,
  error: <X className="h-4 w-4 text-white" />,
  warning: <AlertTriangle className="h-4 w-4 text-white" />,
  info: <Info className="h-4 w-4 text-white" />,
};

const COLORS: Record<Variant, string> = {
  success: 'from-green-500 to-emerald-500',
  error: 'from-rose-500 to-red-500',
  warning: 'from-amber-500 to-yellow-500',
  info: 'from-indigo-500 to-sky-500',
};

const RING: Record<Variant, string> = {
  success: 'ring-green-400/70',
  error: 'ring-rose-400/70',
  warning: 'ring-amber-400/70',
  info: 'ring-sky-400/70',
};

export default function AlertToast({
  open,
  onClose,
  text,
  variant = 'success',
  duration = 2500,
  className = '',
}: AlertToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.6 }}
          role="status"
          aria-live="polite"
          className={[
            'fixed left-1/2 top-6 -translate-x-1/2 z-[1000]',
            className,
          ].join(' ')}
        >
          <div className="relative overflow-hidden rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-gray-200/80">
            {/* Content row */}
            <div className="flex items-center gap-3">
              {/* Icon + pulse */}
              <div className="relative">
                <div
                  className={`h-9 w-9 rounded-full bg-gradient-to-br ${COLORS[variant]} grid place-items-center shadow-sm`}
                >
                  {ICONS[variant]}
                </div>
                {/* subtle pulse ring */}
                <span
                  className={`pointer-events-none absolute inset-0 -z-10 rounded-full ring-2 ${RING[variant]} animate-ping`}
                />
              </div>

              {/* Text */}
              <p className="text-sm font-medium text-gray-800">{text}</p>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Dismiss"
                className="ml-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress bar */}
            <motion.span
              key={duration}
              initial={{ width: '100%' }}
              animate={{ width: 0 }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${COLORS[variant]}`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
