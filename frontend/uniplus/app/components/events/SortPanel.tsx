"use client";

const Button = ({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full justify-between rounded-full border px-3 py-2 text-sm shadow-sm transition ${
      active
        ? "border-black bg-black text-white"
        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
    }`}
  >
    {children}
  </button>
);

export default function SortPanel({
  value,
  onChange,
}: {
  value: "recent" | "popular" | "upcoming";
  onChange: (v: any) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base text-black font-semibold">Sort</h3>
      <div className="mt-4 space-y-2">
        <Button
          active={value === "recent"}
          onClick={() => onChange("recent")}
        >
          Most Recent
        </Button>
        <Button
          active={value === "popular"}
          onClick={() => onChange("popular")}
        >
          Popular
        </Button>
        <Button
          active={value === "upcoming"}
          onClick={() => onChange("upcoming")}
        >
          Upcoming
        </Button>
      </div>
    </div>
  );
}