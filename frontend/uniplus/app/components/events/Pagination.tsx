// app/components/events/Pagination.tsx
"use client";

type Props = {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  /** how many numbers to show on each side of the current page (default 1) */
  siblingCount?: number;
  /** how many numbers to always show at the start & end (default 1) */
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

  const clamped = (n: number) => Math.min(totalPages, Math.max(1, n));

  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  /**
   * Build items like: [1] … [4,5,6] … [10]
   * Center window moves when you click a page (e.g. clicking 3 -> show 2 3 4).
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

    // left boundary
    items.push(...leftBoundary);

    // left dots
    if (shouldShowLeftDots) {
      // optional “jump” hint number (just a nicer UX)
      const jumpLeft = Math.max(page - (siblingCount + 1), boundaryCount + 1);
      if (jumpLeft > leftBoundary[leftBoundary.length - 1] + 1) items.push(DOTS);
    }

    // middle sliding window
    items.push(...middle);

    // right dots
    if (shouldShowRightDots) {
      const jumpRight = Math.min(page + (siblingCount + 1), totalPages - boundaryCount);
      if (jumpRight < rightBoundary[0] - 1) items.push(DOTS);
    }

    // right boundary
    // avoid duplicating numbers if windows touch
    for (const n of rightBoundary) {
      if (!items.includes(n)) items.push(n);
    }

    // de-dup possible overlaps
    return items.filter((v, i, a) => a.indexOf(v) === i);
  };

  const items = paginationItems();

  const baseBtn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm transition";
  const numberBtn =
    "bg-white hover:bg-gray-50 ring-1 ring-black/10 text-black";
  const activeBtn =
    "bg-black text-white ring-0 hover:bg-black";
  const arrowBtn =
    "text-gray-700 hover:text-black";

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        className={`${baseBtn} ${arrowBtn}`}
        onClick={() => onChange(clamped(page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ← Previous
      </button>

      {items.map((it, idx) =>
        it === DOTS ? (
          <span
            key={`dots-${idx}`}
            className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-gray-500"
            aria-hidden
          >
            {DOTS}
          </span>
        ) : (
          <button
            key={it}
            aria-current={it === page ? "page" : undefined}
            className={`${baseBtn} ${it === page ? activeBtn : numberBtn}`}
            onClick={() => onChange(it)}
          >
            {it}
          </button>
        )
      )}

      <button
        className={`${baseBtn} ${arrowBtn}`}
        onClick={() => onChange(clamped(page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}
