import { inputBase, sectionCard } from "@/lib/create/styles";
import type { FormData } from "@/lib/create/types";

type Props = {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
};

export function RegistrationWindowSection({ data, onChange }: Props) {
  return (
    <section className={sectionCard}>
      <h2 className="text-lg font-semibold text-gray-900">Registration Window</h2>
      <p className="mt-1 text-sm text-gray-600">
        Optional. Leave blank to keep registration open.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Opens
          </label>
          <input
            type="datetime-local"
            value={data.registrationStartDate}
            onChange={(e) =>
              onChange({ registrationStartDate: e.target.value })
            }
            className={inputBase}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Closes
          </label>
          <input
            type="datetime-local"
            value={data.registrationEndDate}
            onChange={(e) =>
              onChange({ registrationEndDate: e.target.value })
            }
            className={inputBase}
          />
        </div>
      </div>
    </section>
  );
}
