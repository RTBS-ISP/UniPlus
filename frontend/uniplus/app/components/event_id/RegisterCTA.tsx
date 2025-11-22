import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export function RegisterCTA({
  disabled,
  success,
  onClick,
  loading,
}: {
  disabled: boolean;
  success: boolean;
  onClick: () => void;
  loading: boolean;
}) {
  const reduce = useReducedMotion();
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [denied, setDenied] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (disabled && !success) {
      setDenied(true);
      setTimeout(() => setDenied(false), 450);
      return;
    }
    if (success || loading) return;

    const id = Date.now();
    setRipples((r) => [...r, { id, x, y }]);
    onClick();
    setTimeout(() => setRipples((r) => r.filter((it) => it.id !== id)), 600);
  };

  const base =
    "relative inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-center text-sm font-semibold outline-none group";
  const idle = "bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors";
  const disabledCls = "bg-[#C7CBE0] text-[#3A3F55] cursor-not-allowed";
  const successCls = "bg-emerald-500 text-white";

  const label = loading
    ? "Registering..."
    : disabled
    ? "Closed"
    : success
    ? "Registered"
    : "Register";

  return (
    <motion.button
      type="button"
      aria-disabled={disabled}
      onClick={handleClick}
      disabled={success || loading}
      className={[base, disabled ? disabledCls : success ? successCls : idle].join(" ")}
      initial={false}
      animate={
        disabled && !success && denied ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }
      }
      transition={{
        x:
          disabled && !success && denied
            ? { duration: 0.45, ease: "easeInOut", times: [0, 0.15, 0.35, 0.55, 0.8, 1] }
            : { type: "spring", stiffness: 280, damping: 22 },
      }}
    >
      {disabled && !success && (
        <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 transition group-hover:opacity-100">
          <div className="rounded-md bg-black/80 px-2 py-1 text-[11px] text-white shadow">
            Registration closed
          </div>
          <div className="mx-auto h-0 w-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-black/80" />
        </div>
      )}

      {!disabled &&
        ripples.map((r) => (
          <motion.span
            key={r.id}
            className="pointer-events-none absolute rounded-full bg-white/40"
            style={{
              left: r.x,
              top: r.y,
              width: 12,
              height: 12,
              transform: "translate(-50%, -50%)",
            }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 7, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}

      {success && (
        <>
          <motion.span
            className="absolute inset-0 rounded-lg"
            initial={{ boxShadow: "0 0 0px rgba(16,185,129,0)" }}
            animate={{ boxShadow: "0 0 28px rgba(16,185,129,.45)" }}
          />
          <motion.span
            className="mr-2 inline-flex"
            initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 16 }}
          >
            <Check className="h-5 w-5" />
          </motion.span>
        </>
      )}

      <span className="relative z-10 inline-flex items-center gap-2">
        {disabled && !success ? <Lock className="h-4 w-4" /> : null}
        {label}
      </span>
    </motion.button>
  );
}
