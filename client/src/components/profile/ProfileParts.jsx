// Pieces shared by the own profile page and public profiles
import { timeIn } from "../../lib/format";
import { Panel, PanelHeader, Stamp } from "../ui";

export const Stat = ({ label, children }) => (
  <div className="bg-surface px-4 py-3">
    <p className="label-mono">{label}</p>
    <p className="mt-1 font-mono text-2xl tabular text-ink">{children}</p>
  </div>
);

const COLS = { 3: "grid-cols-1 sm:grid-cols-3", 4: "grid-cols-2 md:grid-cols-4" };

// gap-px on a line-coloured panel draws the dividers between stats
export const StatStrip = ({ children, cols = 4 }) => <Panel className={`grid ${COLS[cols]} gap-px bg-line overflow-hidden`}>{children}</Panel>;

export const SkillsPanel = ({ offered, requested, emptyText = "Nothing added yet." }) => (
  <Panel>
    <PanelHeader title="Skills" />
    <div className="p-4 space-y-4">
      {[
        ["Teaches", offered],
        ["Wants to learn", requested],
      ].map(([label, list]) => (
        <div key={label}>
          <p className="text-sm text-muted mb-2">{label}</p>
          {list?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {list.map((s) => (
                <Stamp key={s}>{s}</Stamp>
              ))}
            </div>
          ) : (
            <p className="text-sm text-faint">{emptyText}</p>
          )}
        </div>
      ))}
    </div>
  </Panel>
);

export const AvailabilityPanel = ({ preferredHours, timezone, action }) => {
  const now = timezone ? timeIn(timezone) : null;
  return (
    <Panel>
      <PanelHeader title="Usually free" action={action} />
      <div className="p-4 space-y-1">
        <p className={preferredHours ? "font-mono text-ink" : "text-muted"}>{preferredHours || "Not set."}</p>
        {timezone && (
          <p className="font-mono text-2xs uppercase tracking-wider text-faint">
            {timezone.replaceAll("_", " ")}
            {now && ` · ${now} there now`}
          </p>
        )}
      </div>
    </Panel>
  );
};
