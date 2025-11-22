import { sectionCard } from "@/lib/create/styles";
import EventScheduleDays, {
  DaySlot,
} from "../events/EventScheduleDays";

type ScheduleSectionProps = {
  scheduleDays: DaySlot[];
  onChange: (days: DaySlot[]) => void;
};

export function ScheduleSection({
  scheduleDays,
  onChange,
}: ScheduleSectionProps) {
  return (
    <section className={sectionCard}>
      <h2 className="text-lg font-semibold text-gray-900">Schedule & Location</h2>
      <p className="mt-1 text-sm text-gray-600">
        Add one or more days. Each has start/end times and its own location.
      </p>
      <div className="mt-4">
        <EventScheduleDays value={scheduleDays} onChange={onChange} />
      </div>
    </section>
  );
}
