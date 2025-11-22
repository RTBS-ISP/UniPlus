import { sectionCard } from "@/lib/create/styles";
import type { Summary } from "@/lib/create/types";

type Props = {
  summary: Summary;
  category: string;
  registrationStartDate: string;
  registrationEndDate: string;
  imagePreview: string;
};

export function SummarySidebar({
  summary,
  category,
  registrationStartDate,
  registrationEndDate,
  imagePreview,
}: Props) {
  const hasRegWindow =
    registrationStartDate && registrationEndDate;

  let regText = "Not specified";
  if (hasRegWindow) {
    regText = `${new Date(registrationStartDate).toLocaleString()} — ${new Date(
      registrationEndDate
    ).toLocaleString()}`;
  }

  return (
    <div className={`${sectionCard} sticky top-30`}>
      <h3 className="text-base font-semibold text-gray-900">
        Live Summary
      </h3>

      <dl className="mt-4 space-y-4">
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            When
          </dt>
          <dd className="text-sm text-gray-900">
            {summary.when || "TBD"}
          </dd>
        </div>

        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            Where
          </dt>
          <dd className="text-sm text-gray-900">
            {summary.where || "Location TBD"}
          </dd>
          {summary.modeLabel && (
            <p className="text-xs text-gray-500">{summary.modeLabel}</p>
          )}
        </div>

        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            Category
          </dt>
          <dd className="text-sm text-gray-900">
            {category || "—"}
          </dd>
        </div>

        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            Capacity
          </dt>
          <dd className="text-sm text-gray-900">
            {summary.capacity || "Unlimited"}
          </dd>
        </div>

        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            Tags
          </dt>
          <dd className="text-sm text-gray-900">
            {summary.tags !== "—" ? summary.tags : "—"}
          </dd>
        </div>

        <hr className="border-gray-200" />

        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">
            Registration Period
          </dt>
          <dd className="text-sm text-gray-900">{regText}</dd>
        </div>

        {imagePreview && (
          <div className="pt-2">
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Event Image
            </dt>
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-2 h-24 w-full rounded-md object-cover border border-gray-200"
              onError={(e) =>
                console.error("Summary image load failed:", e)
              }
            />
          </div>
        )}
      </dl>
    </div>
  );
}
