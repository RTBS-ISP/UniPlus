import { motion } from "framer-motion";

export function HostPill({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  let bg = "#E8EEFF";
  let color = "#1F2A44";

  if (normalized === "organizer") {
    bg = "#F3E8FF";
  } else if (normalized === "student") {
    bg = "#E0F2FE";
  } else if (normalized === "professor") {
    bg = "#C7D2FE";
  }

  return (
    <motion.span
      className="inline-flex items-center rounded-md border border-black/10 px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: bg, color }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {label}
    </motion.span>
  );
}
