import { useContext, useState } from "react";
import AuthContext from "../../context/AuthContext";
import { CATEGORIES, DURATIONS } from "../../lib/constants";
import { apiError, fieldErrors, formatDuration } from "../../lib/format";
import { Button, Field, Hours, Input, Panel, Select, SkillInput, SkillSuggestions, Textarea } from "../ui";
import { FormError } from "../auth/AuthLayout";

const EMPTY = { title: "", description: "", category: "Coding", duration: 60, tags: [] };

/**
 * Create and edit share this form. onSubmit(values) should throw the axios error on failure.
 */
export const ListingForm = ({ initial = EMPTY, submitLabel, onSubmit, onCancel, note }) => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key, parse = (v) => v) => (e) => set(key)(parse(e.target.value));
  const cost = form.duration / 60;

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError("");
    setSaving(true);
    try {
      await onSubmit({ title: form.title, description: form.description, category: form.category, duration: form.duration, tags: form.tags });
    } catch (error) {
      const byField = fieldErrors(error);
      setErrors(byField);
      if (!Object.keys(byField).length) setFormError(apiError(error, "Couldn't save"));
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <form onSubmit={submit} className="space-y-5 max-w-2xl" noValidate>
        <FormError>{formError}</FormError>
        <Field label="Title" hint="What will they be able to do after? e.g. “Build your first React component”." error={errors.title} counter={`${form.title.length}/100`}>
          {(p) => <Input {...p} maxLength={100} value={form.title} onChange={text("title")} />}
        </Field>
        <Field label="Description" hint="What you'll cover, what they should know already, what to bring." error={errors.description} counter={`${form.description.length}/2000`}>
          {(p) => <Textarea {...p} rows={7} maxLength={2000} value={form.description} onChange={text("description")} />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" error={errors.category}>
            {(p) => (
              <Select {...p} value={form.category} onChange={text("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Length" error={errors.duration}>
            {(p) => (
              <Select {...p} value={form.duration} onChange={text("duration", Number)}>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {formatDuration(d)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label="Tags" hint="Up to 8. Learners who want these skills see this listing as a suggestion." error={errors.tags}>
          {(p) => <SkillInput {...p} max={8} value={form.tags} onChange={set("tags")} placeholder="e.g. react" />}
        </Field>
        {user?.skillsOffered?.length > 0 && <SkillSuggestions suggestions={user.skillsOffered} value={form.tags} onChange={(v) => set("tags")(v.slice(0, 8))} />}
        <div className="flex gap-2 pt-2">
          <Button type="submit" variant="primary" loading={saving}>
            {submitLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>

      <Panel as="aside" className="p-4 h-fit space-y-3">
        <p className="label-mono">Per session</p>
        <div className="font-mono text-sm tabular space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted">learner pays</span>
            <Hours value={cost} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted">you earn</span>
            <Hours value={cost} signed tone="sign" />
          </div>
        </div>
        <p className="text-sm text-muted">{note || "Credits are held when someone books and released to you once they confirm the session happened."}</p>
      </Panel>
    </div>
  );
};
