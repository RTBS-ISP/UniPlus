import { motion } from "framer-motion";
import { HostPill } from "./HostPill";
import { getImageUrl } from "./utils";
import { fadeUp, cardHover } from "./motionConfig";

export type RelatedEvent = {
  id: number;
  title: string;
  host: string[];
  tags: string[];
  image: string | null;
  available: number;
  capacity: number;
};

export function RelatedCard({ item }: { item: RelatedEvent }) {
  const img = getImageUrl(item.image);

  const available = item.available ?? 0;
  const capacity = item.capacity ?? 100;

  const hostLabel = item.host?.[0];
  const tagLabel = (item.tags ?? [])[0];

  return (
    <motion.div
      className="block rounded-xl bg-white shadow-sm transition hover:shadow-md cursor-pointer"
      variants={fadeUp}
      {...cardHover}
    >
      <motion.img
        src={img}
        alt={item.title}
        className="h-40 w-full rounded-t-xl object-cover"
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
      />
      <div className="p-4">
        <h4 className="font-medium text-[#0B1220]">{item.title}</h4>
        <div className="mt-2">
          {hostLabel && <HostPill label={hostLabel} />}
          {!hostLabel && tagLabel && (
            <span className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-[#0B1220]">
              {tagLabel}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Available: {available}/{capacity}
        </p>
      </div>
    </motion.div>
  );
}
