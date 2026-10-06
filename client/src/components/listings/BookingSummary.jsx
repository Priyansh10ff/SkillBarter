import { formatDuration, formatHours } from "../../lib/format";

const Row = ({ label, value, strong }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-muted">{label}</dt>
    <dd className={strong ? "text-accent" : "text-ink"}>{value}</dd>
  </div>
);

// Ledger-style preview of what a booking does to the balance
export const BookingSummary = ({ listing, balance }) => {
  const after = balance - listing.creditCost;
  return (
    <div className="space-y-3">
      <dl className="font-mono text-sm tabular space-y-1.5 border border-line rounded bg-bg p-3">
        <Row label="teacher" value={listing.teacher?.name} />
        <Row label="length" value={formatDuration(listing.duration)} />
        <Row label="balance now" value={formatHours(balance)} />
        <Row label="held for this" value={formatHours(-listing.creditCost)} />
        <div className="border-t border-line pt-1.5">
          <Row label="after booking" value={formatHours(after)} strong />
        </div>
      </dl>
      <p className="text-sm">
        The credits are held, not paid. {listing.teacher?.name} gets them after you confirm the session. Cancel before it starts and
        they come straight back.
      </p>
    </div>
  );
};
