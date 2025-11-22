import { inputBase, sectionCard } from "@/lib/create/styles";
import type { FormData } from "@/lib/create/types";

type Props = {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
};

export function TermsSection({ data, onChange }: Props) {
  return (
    <section className={sectionCard}>
      <h2 className="text-lg font-semibold text-gray-900">Terms & Conditions</h2>
      <div className="mt-4">
        <textarea
          rows={7}
          value={data.termsAndConditions}
          onChange={(e) =>
            onChange({ termsAndConditions: e.target.value })
          }
          placeholder="Any rules or conditions for attendees..."
          className={inputBase}
        />
      </div>
    </section>
  );
}
