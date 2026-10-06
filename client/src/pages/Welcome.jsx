import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthContext from "../context/AuthContext";
import { SUGGESTED_SKILLS } from "../lib/constants";
import { apiError, browserTimezone } from "../lib/format";
import { Button, Field, Hours, Input, Panel, SkillInput, SkillSuggestions, Textarea, TimezoneSelect, cx } from "../components/ui";

const STEPS = [
  { title: "What can you teach?", body: "Anything you could explain to a friend in an hour counts. You'll post sessions for these next." },
  { title: "What do you want to learn?", body: "We use this to suggest sessions, and people who want what you teach." },
  { title: "When are you usually around?", body: "Helps people propose times that work. Shown on your public profile." },
];

const Progress = ({ step }) => (
  <div className="flex items-center gap-3 mb-8">
    <span className="label-mono whitespace-nowrap">
      Step {step + 1} of {STEPS.length}
    </span>
    <div className="flex flex-1 gap-1" aria-hidden="true">
      {STEPS.map((_, i) => (
        <span key={i} className={cx("h-0.5 flex-1", i <= step ? "bg-ink" : "bg-line")} />
      ))}
    </div>
  </div>
);

const Welcome = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    skillsOffered: user.skillsOffered || [],
    skillsRequested: user.skillsRequested || [],
    preferredHours: user.preferredHours || "",
    timezone: user.timezone && user.timezone !== "UTC" ? user.timezone : browserTimezone(),
    bio: user.bio || "",
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const firstName = user.name.split(" ")[0];

  const finish = async () => {
    setSaving(true);
    try {
      await updateProfile({ ...form, onboarded: true });
      setDone(true);
    } catch (error) {
      toast.error(apiError(error, "Couldn't save. Try again."));
    } finally {
      setSaving(false);
    }
  };

  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish());

  if (done) {
    return (
      <div className="mx-auto max-w-xl pt-6">
        <p className="label-mono mb-4">Set up</p>
        <h1 className="text-3xl tracking-tightest">You're set, {firstName}.</h1>
        <Panel className="mt-6 p-4 font-mono text-sm tabular flex justify-between">
          <span className="text-muted">balance</span>
          <Hours value={user.timeCredits} />
        </Panel>
        <p className="mt-4 text-muted">Spend it on a session, or post a skill so others can book you and you earn more.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="primary" to={form.skillsOffered.length ? "/create-listing" : "/"}>
            {form.skillsOffered.length ? "Post your first skill" : "Find something to learn"}
          </Button>
          <Button to={form.skillsOffered.length ? "/" : "/create-listing"}>{form.skillsOffered.length ? "Browse sessions" : "Post a skill"}</Button>
        </div>
      </div>
    );
  }

  const current = STEPS[step];

  return (
    <div className="mx-auto max-w-xl pt-6">
      <Progress step={step} />
      <h1 className="text-3xl tracking-tightest">{current.title}</h1>
      <p className="mt-2 text-muted">{current.body}</p>

      <div className="mt-8 space-y-4">
        {step === 0 && (
          <>
            <Field label="Skills you can teach" hint="Press Enter after each one.">
              {(p) => <SkillInput {...p} value={form.skillsOffered} onChange={set("skillsOffered")} placeholder="e.g. react" />}
            </Field>
            <SkillSuggestions suggestions={SUGGESTED_SKILLS} value={form.skillsOffered} onChange={set("skillsOffered")} />
          </>
        )}
        {step === 1 && (
          <>
            <Field label="Skills you want to learn" hint="Press Enter after each one.">
              {(p) => <SkillInput {...p} value={form.skillsRequested} onChange={set("skillsRequested")} placeholder="e.g. guitar" />}
            </Field>
            <SkillSuggestions suggestions={SUGGESTED_SKILLS} value={form.skillsRequested} onChange={set("skillsRequested")} />
          </>
        )}
        {step === 2 && (
          <>
            <Field label="Usually free" hint="Plain words are fine.">
              {(p) => <Input {...p} maxLength={100} value={form.preferredHours} onChange={(e) => set("preferredHours")(e.target.value)} placeholder="e.g. Weekdays after 19:00, weekend mornings" />}
            </Field>
            <Field label="Timezone">{(p) => <TimezoneSelect {...p} value={form.timezone} onChange={(e) => set("timezone")(e.target.value)} />}</Field>
            <Field label="A line about you" hint="Optional." counter={`${form.bio.length}/500`}>
              {(p) => <Textarea {...p} rows={3} maxLength={500} value={form.bio} onChange={(e) => set("bio")(e.target.value)} placeholder="e.g. Second-year CS student, into chess and backend work." />}
            </Field>
          </>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between gap-2 border-t border-line pt-5">
        <Button variant="ghost" onClick={() => (step ? setStep(step - 1) : navigate("/"))}>
          {step ? "Back" : "Do this later"}
        </Button>
        <Button variant="primary" loading={saving} onClick={next}>
          {step < STEPS.length - 1 ? "Continue" : "Finish"}
        </Button>
      </div>
    </div>
  );
};

export default Welcome;
