import { inputBase, sectionCard } from "@/lib/create/styles";
import type { FormData } from "@/lib/create/types";
import TagSelector from "../events/TagSelector";

type Props = {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
};

export function CapacityTagsSection({ data, onChange }: Props) {
  return (
    <section className={sectionCard}>
      <h2 className="text-lg font-semibold text-gray-900">Capacity & Tags</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Max Attendees <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={data.maxAttendee}
            onChange={(e) => onChange({ maxAttendee: e.target.value })}
            placeholder="e.g., 120"
            className={inputBase}
            required
          />
        </div>
        <div className="md:col-span-2">
          <TagSelector
            tags={data.tags}
            setTags={(tags) => onChange({ tags })}
          />
        </div>
      </div>
    </section>
  );
}
