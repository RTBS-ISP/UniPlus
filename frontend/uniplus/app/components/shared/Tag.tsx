type TagProps = {
  label: string;
};

export function Tag({ label }: TagProps) {
  return (
    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 break-words max-w-[120px] truncate">
      {label}
    </span>
  );
}

export function TagAccent({ label }: TagProps) {
  const normalized = label.toLowerCase();

  let backgroundColor = "#38BDF8"; // default accent (blue)

  if (normalized === "organizer") backgroundColor = "#D87C70";
  if (normalized === "university") backgroundColor = "#C6D870";
  if (normalized === "student") backgroundColor = "#D8C070"; // example color, tweak if needed

  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium text-white break-words max-w-[120px] truncate"
      style={{ backgroundColor }}
    >
      {label}
    </span>
  );
}

export function TagCounter({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-gray-300 px-2 py-0.5 text-xs font-medium text-gray-700">
      +{count}
    </span>
  );
}
