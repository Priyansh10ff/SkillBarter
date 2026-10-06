// Dev-only reference for the design system: /dev/ui
import { useState } from "react";
import { useConfirm } from "../context/ConfirmContext";
import { BOOKING_STATUS } from "../lib/constants";
import {
  Avatar, Button, EmptyState, Field, Hours, Input, PageHeader, Panel, PanelHeader, Segmented, Select, SkeletonRows, Stamp, StatusTag, Textarea,
} from "../components/ui";

const SWATCHES = ["bg", "surface", "raised", "line", "line-strong", "ink", "muted", "faint", "accent", "ok", "bad", "warn"];

const Section = ({ title, children }) => (
  <section className="space-y-4 border-b border-line pb-10">
    <h2 className="label-mono">{title}</h2>
    {children}
  </section>
);

const StyleGuide = () => {
  const confirm = useConfirm();
  const [seg, setSeg] = useState("a");
  const [result, setResult] = useState("");

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Dev" title="Design system" description="Tokens and components. Amber is only for credits and time." actions={<Button variant="primary">Primary action</Button>} />

      <Section title="Colour">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SWATCHES.map((s) => (
            <div key={s} className="border border-line rounded overflow-hidden">
              <div className="h-12" style={{ background: `rgb(var(--${s}))` }} />
              <p className="px-2 py-1 font-mono text-2xs text-muted">{s}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <h1 className="text-[32px] tracking-tightest">Heading 32 · Instrument Sans</h1>
        <h2 className="text-2xl">Heading 24</h2>
        <h3 className="text-lg">Heading 18</h3>
        <p className="text-muted max-w-xl">Body 15. Plain and specific. “Book 1:00 h”, not “Unlock knowledge”.</p>
        <p className="font-mono tabular">JetBrains Mono · 0123456789 · 12:30 h</p>
        <p className="label-mono">Label mono</p>
      </Section>

      <Section title="Credits">
        <div className="flex flex-wrap gap-6 items-baseline">
          <Hours value={2} className="text-2xl" />
          <Hours value={1.5} />
          <Hours value={0.5} signed tone="sign" />
          <Hours value={-1} tone="sign" />
          <Hours value={3} tone="muted" />
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="primary">Primary</Button>
          <Button>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg" variant="primary">Large</Button>
        </div>
      </Section>

      <Section title="Status and stamps">
        <div className="flex flex-wrap gap-4 items-center">
          {Object.values(BOOKING_STATUS).map((s) => (
            <StatusTag key={s} status={s} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Stamp>react</Stamp>
          <Stamp>Taught ×10</Stamp>
          <Stamp tone="accent">Teacher Rookie</Stamp>
        </div>
        <div className="flex gap-2">
          {["Asha Rao", "Kabir Singh", "Mei Lin", "Omar Haddad"].map((n) => (
            <Avatar key={n} name={n} />
          ))}
        </div>
      </Section>

      <Section title="Forms">
        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
          <Field label="Title" hint="Helpful hint.">{(p) => <Input {...p} placeholder="Placeholder" />}</Field>
          <Field label="With error" error="Something is wrong here.">{(p) => <Input {...p} defaultValue="bad value" />}</Field>
          <Field label="Select">
            {(p) => (
              <Select {...p}>
                <option>Coding</option>
                <option>Music</option>
              </Select>
            )}
          </Field>
          <Field label="Filter">
            {() => <Segmented label="Demo" value={seg} onChange={setSeg} options={[{ value: "a", label: "All" }, { value: "b", label: "Learning" }, { value: "c", label: "Teaching" }]} />}
          </Field>
          <Field label="Textarea" counter="0/500" className="sm:col-span-2">{(p) => <Textarea {...p} />}</Field>
        </div>
      </Section>

      <Section title="Panels and states">
        <div className="grid gap-4 md:grid-cols-2">
          <Panel>
            <PanelHeader title="Panel" action={<Button size="sm" variant="ghost">Edit</Button>} />
            <p className="p-4 text-muted">Panel body.</p>
          </Panel>
          <EmptyState title="Nothing here yet." action={<Button>Do the next thing</Button>}>
            Empty states say what to do next.
          </EmptyState>
        </div>
        <SkeletonRows rows={2} />
      </Section>

      <Section title="Dialogs">
        <div className="flex flex-wrap gap-2 items-center">
          <Button onClick={async () => setResult(String(await confirm({ title: "Cancel booking?", body: "Credits go back to the learner.", tone: "danger", confirmLabel: "Cancel booking" })))}>
            Confirm
          </Button>
          <Button onClick={async () => setResult(String(await confirm({ title: "Report a problem", input: { label: "What went wrong?", minLength: 5 } })))}>
            Confirm with input
          </Button>
          <span className="font-mono text-sm text-muted">result: {result || "—"}</span>
        </div>
      </Section>
    </div>
  );
};

export default StyleGuide;
