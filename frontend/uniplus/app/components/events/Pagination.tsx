"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Props = {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  siblingCount?: number;
  boundaryCount?: number;
};

const DOTS = "…";

export default function Pagination({
  page,
  totalPages,
  onChange,
  siblingCount = 1,
  boundaryCount = 1,
}: Props) {
  if (totalPages <= 1) return null;

  const shouldReduceMotion = useReducedMotion();

  const clamped = (n: number) => Math.min(totalPages, Math.max(1, n));

  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  /**
   * Build items like: [1] … [4,5,6] … [10]
   */
  const paginationItems = () => {
    const leftBoundary = range(1, Math.min(boundaryCount, totalPages));
    const rightBoundary = range(
      Math.max(totalPages - boundaryCount + 1, 1),
      totalPages
    );

    const leftSibling = Math.max(page - siblingCount, boundaryCount + 1);
    const rightSibling = Math.min(page + siblingCount, totalPages - boundaryCount);

    const shouldShowLeftDots = leftSibling > boundaryCount + 1;
    const shouldShowRightDots = rightSibling < totalPages - boundaryCount;

    const middle = range(leftSibling, rightSibling);

    const items: (number | typeof DOTS)[] = [];
    items.push(...leftBoundary);

    if (shouldShowLeftDots) {
      const jumpLeft = Math.max(page - (siblingCount + 1), boundaryCount + 1);
      if (jumpLeft > leftBoundary[leftBoundary.length - 1] + 1) items.push(DOTS);
    }

    items.push(...middle);

    if (shouldShowRightDots) {
      const jumpRight = Math.min(page + (siblingCount + 1), totalPages - boundaryCount);
      if (jumpRight < rightBoundary[0] - 1) items.push(DOTS);
    }

    for (const n of rightBoundary) {
      if (!items.includes(n)) items.push(n);
    }

    return items.filter((v, i, a) => a.indexOf(v) === i);
  };

  const items = paginationItems();

  // ----- Styles to match your SortPanel indigo scheme -----
  const baseBtn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm shadow-sm transition font-medium " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200";

  const numberBtnActive =
    "bg-[#6366F1] border border-[#6366F1] text-white hover:bg-[#4F46E5]";

  const numberBtnInactive =
    "border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50";

  const arrowBtn =
    "border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50";

  const arrowBtnDisabled =
    "border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed hover:bg-gray-50";

  // ----- Motion variants -----
  const itemVariants = {
    initial: (dir: number) =>
      shouldReduceMotion ? {} : { opacity: 0, y: dir > 0 ? 6 : -6, scale: 0.95 },
    animate: shouldReduceMotion ? {} : { opacity: 1, y: 0, scale: 1 },
    exit: (dir: number) =>
      shouldReduceMotion ? {} : { opacity: 0, y: dir > 0 ? -6 : 6, scale: 0.95 },
  } as const;

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 500, damping: 30, mass: 0.6 };

  // Direction helps dots/numbers slide subtly in the direction of navigation
  const dir = 0; // keep neutral; set to Math.sign(nextPage - page) if you track previous page in parent

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      {/* Prev */}
      <motion.button
        whileHover={page === 1 ? undefined : { scale: 1.02 }}
        whileTap={page === 1 ? undefined : { scale: 0.98 }}
        className={`${baseBtn} ${page === 1 ? arrowBtnDisabled : arrowBtn}`}
        onClick={() => onChange(clamped(page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        aria-disabled={page === 1}
      >
        ← Previous
      </motion.button>

      {/* Numbers + Dots */}
      <AnimatePresence initial={false} mode="popLayout" custom={dir}>
        {items.map((it, idx) =>
          it === DOTS ? (
            <motion.span
              key={`dots-${idx}`}
              layout
              custom={dir}
              variants={itemVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-indigo-400 select-none"
              aria-hidden
            >
              {DOTS}
            </motion.span>
          ) : (
            <motion.button
              key={`p-${it}`}
              layout
              custom={dir}
              variants={itemVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              aria-current={it === page ? "page" : undefined}
              aria-pressed={it === page}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              className={[
                baseBtn,
                it === page ? numberBtnActive : numberBtnInactive,
              ].join(" ")}
              onClick={() => onChange(it)}
            >
              {it}
            </motion.button>
          )
        )}
      </AnimatePresence>

      {/* Next */}
      <motion.button
        whileHover={page === totalPages ? undefined : { scale: 1.02 }}
        whileTap={page === totalPages ? undefined : { scale: 0.98 }}
        className={`${baseBtn} ${page === totalPages ? arrowBtnDisabled : arrowBtn}`}
        onClick={() => onChange(clamped(page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        aria-disabled={page === totalPages}
      >
        Next →
      </motion.button>
    </nav>
  );
}
