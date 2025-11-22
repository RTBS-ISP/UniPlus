import { inputBase, sectionCard } from "@/lib/create/styles";
import type { FormData } from "@/lib/create/types";

type Props = {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
};

export function ContactInfoSection({ data, onChange }: Props) {
  return (
    <section className={sectionCard}>
      <h2 className="text-lg font-semibold text-gray-900">
        Contact Information (Optional)
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Provide ways for attendees to reach you. Leave empty if not needed.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={data.eventEmail}
            onChange={(e) =>
              onChange({ eventEmail: e.target.value || "" })
            }
            placeholder="contact@example.com"
            className={inputBase}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            value={data.eventPhoneNumber}
            onChange={(e) =>
              onChange({ eventPhoneNumber: e.target.value || "" })
            }
            placeholder="+66 8x xxx xxxx"
            className={inputBase}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Website (Optional)
        </label>
        <input
          type="url"
          value={data.eventWebsiteUrl}
          onChange={(e) =>
            onChange({ eventWebsiteUrl: e.target.value || "" })
          }
          placeholder="https://example.com"
          className={inputBase}
        />
      </div>
    </section>
  );
}
