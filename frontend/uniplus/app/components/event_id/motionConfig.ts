export const pageVariants: any = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { when: "beforeChildren", duration: 0.25 } },
};

export const fadeUp: any = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 26 } },
};

export const staggerRow: any = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const cardHover: any = {
  whileHover: { y: -4, scale: 1.01 },
  whileTap: { scale: 0.99 },
};
