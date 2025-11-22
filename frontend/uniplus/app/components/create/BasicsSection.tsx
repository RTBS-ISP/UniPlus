import { inputBase, sectionCard } from "@/lib/create/styles";
import type { FormData } from "@/lib/create/types";

type BasicsSectionProps = {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  categories: string[];
};

export function BasicsSection({ data, onChange, categories }: BasicsSectionProps) {
  return (
    <section className={sectionCard}>
      <h2 className="text-lg font-semibold text-gray-900">Basics</h2>
      <p className="mt-1 text-sm text-gray-600">
        Title, category, and description.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Event Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={data.eventTitle}
            onChange={(e) => onChange({ eventTitle: e.target.value })}
            placeholder="e.g., Tech Conference 2026"
            className={inputBase}
            required
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={data.category}
            onChange={(e) => onChange({ category: e.target.value })}
            className={`${inputBase} pr-8`}
            required
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="desc"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Event Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="desc"
          rows={5}
          value={data.eventDescription}
          onChange={(e) => onChange({ eventDescription: e.target.value })}
          placeholder="Describe your event, what attendees can expect, and the agenda."
          className={`${inputBase} resize-y`}
          required
        />
      </div>
    </section>
  );
}
