import { Hours, Panel, PanelHeader } from "../ui";

const STEPS = [
  ["01", "Post what you know", "A session is one thing you can teach in 30 minutes to 2 hours. Coding, music, a language, interview prep."],
  ["02", "Book what you want", "Every hour costs one credit. The credits are held, not paid, until the session happens."],
  ["03", "Meet, then confirm", "Video, screen share and a shared whiteboard in the room. Confirm afterwards and the hours move."],
];

const LEDGER = [
  ["welcome credits", 2],
  ["you teach react · 1 h", 1],
  ["you learn guitar · 1 h", -1],
  ["you learn figma · 30 min", -0.5],
];

export const HowItWorks = () => (
  <section aria-labelledby="how-title" className="border-b border-line pb-12 mb-10">
    <h2 id="how-title" className="label-mono mb-6">
      How it works
    </h2>
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <ol className="grid gap-6 sm:grid-cols-3">
        {STEPS.map(([n, title, body]) => (
          <li key={n} className="border-t border-line-strong pt-4">
            <p className="font-mono text-sm text-faint">{n}</p>
            <h3 className="mt-2 text-lg">{title}</h3>
            <p className="mt-2 text-muted">{body}</p>
          </li>
        ))}
      </ol>
      <Panel>
        <PanelHeader title="The maths" />
        <dl className="font-mono text-sm tabular p-4 space-y-2">
          {LEDGER.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-muted">{label}</dt>
              <dd>
                <Hours value={value} signed tone="sign" />
              </dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-line pt-2">
            <dt className="text-ink">balance</dt>
            <dd>
              <Hours value={LEDGER.reduce((sum, [, v]) => sum + v, 0)} />
            </dd>
          </div>
        </dl>
      </Panel>
    </div>
  </section>
);
