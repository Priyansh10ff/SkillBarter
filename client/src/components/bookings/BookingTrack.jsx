import dayjs from "../../lib/date";
import { BOOKING_STATUS as S } from "../../lib/constants";
import { formatDateTime } from "../../lib/format";
import { cx } from "../ui";

// short enough to fit four across on a phone
const LABELS = ["Booked", "Time set", "Session", "Paid out"];

// Where each booking is: which steps are done, which is current, and whether it stopped early
const stepsFor = (b) => {
  const started = b.scheduledAt && dayjs(b.scheduledAt).isBefore(dayjs());
  const base = LABELS.map((label) => ({ label, state: "todo", note: null }));
  const mark = (upTo, state = "done") => base.forEach((s, i) => i <= upTo && (s.state = state));

  switch (b.status) {
    case S.PENDING:
      mark(0);
      base[1].state = "current";
      base[1].note = b.proposal?.date ? "proposed" : "needs a time";
      break;
    case S.SCHEDULED:
      mark(1);
      base[1].note = formatDateTime(b.scheduledAt);
      base[2].state = "current";
      base[2].note = started ? "in progress" : `in ${dayjs(b.scheduledAt).fromNow(true)}`;
      break;
    case S.COMPLETED:
      mark(3);
      base[3].note = b.completedAt ? formatDateTime(b.completedAt) : null;
      break;
    case S.DISPUTED:
      mark(2);
      base[3].state = "stopped";
      base[3].note = "frozen";
      break;
    case S.CANCELLED: {
      const at = b.scheduledAt ? 2 : 1;
      mark(at - 1);
      base[at].state = "stopped";
      base[at].note = b.dispute?.outcome === "refund" ? "refunded" : "cancelled";
      break;
    }
    default:
      break;
  }
  return base;
};

const BAR = { done: "bg-ink", current: "bg-ink/40", stopped: "bg-bad/60", todo: "bg-line" };
const TEXT = { done: "text-ink", current: "text-ink", stopped: "text-bad", todo: "text-faint" };

export const BookingTrack = ({ booking }) => (
  <ol className="grid grid-cols-4 gap-1" aria-label="Booking progress">
    {stepsFor(booking).map((step) => (
      <li key={step.label} className="min-w-0" aria-current={step.state === "current" ? "step" : undefined}>
        <span className={cx("block h-0.5", BAR[step.state])} aria-hidden="true" />
        <span className={cx("mt-2 block font-mono text-2xs uppercase tracking-wider truncate", TEXT[step.state])}>{step.label}</span>
        {step.note && <span className="block font-mono text-2xs text-faint truncate">{step.note}</span>}
        <span className="sr-only">{step.state === "todo" ? "not yet" : step.state}</span>
      </li>
    ))}
  </ol>
);
