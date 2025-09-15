export function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-[120px] items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700 break-words [overflow-wrap:anywhere]">
      {label}
    </span>
  );
}

export function TagAccent({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-[120px] items-center rounded-full bg-red-200 px-2.5 py-0.5 text-xs font-medium text-red-700 break-words [overflow-wrap:anywhere]">
      {label}
    </span>
  );
}

export function TagCounter({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-300/70 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
      +{count}
    </span>
  );
}
