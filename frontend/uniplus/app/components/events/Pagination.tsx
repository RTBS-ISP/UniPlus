"use client";

type Props = {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
};

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const goPrev = () => onChange(Math.max(1, page - 1));
  const goNext = () => onChange(Math.min(totalPages, page + 1));

  const pages = getPages(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-center gap-4 text-sm"
    >
      {/* Previous */}
      <button
        onClick={goPrev}
        disabled={page === 1}
        className="inline-flex items-center gap-1 text-gray-600 hover:underline hover:text-gray-900 disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
      >
        <span>←</span>
        <span>Previous</span>
      </button>

      {/* Numbers */}
      <div className="flex items-center gap-2">
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`dots-${i}`} className="px-1 text-gray-500">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              aria-current={p === page ? "page" : undefined}
              className={`min-w-8 rounded-md border px-3 py-1.5 text-sm
                ${
                  p === page
                    ? "border-gray-300 bg-white font-semibold text-gray-900"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      {/* Next */}
      <button
        onClick={goNext}
        disabled={page === totalPages}
        className="inline-flex items-center gap-1 text-gray-600 hover:underline hover:text-gray-900 disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
      >
        <span>Next</span>
        <span>→</span>
      </button>
    </nav>
  );
}

/** Build compact page list with ellipses, e.g. [1,2,3,'…',8,9] */
function getPages(page: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  // Near the start: 1 2 3 … (last-1) last
  if (page <= 3) {
    return [1, 2, 3, "…", total - 1, total];
  }

  // Near the end: 1 2 … (last-2) (last-1) last
  if (page >= total - 2) {
    return [1, 2, "…", total - 2, total - 1, total];
  }

  // Middle: 1 2 … (p-1) p (p+1) … last
  return [1, 2, "…", page - 1, page, page + 1, "…", total];
}
