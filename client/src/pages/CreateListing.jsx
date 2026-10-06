import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";
import { CATEGORIES, DURATIONS } from "../lib/constants";
import { apiError, fieldErrors, formatDuration } from "../lib/format";
import { Button, Field, Hours, Input, PageHeader, Panel, Select, Textarea } from "../components/ui";
import { FormError } from "../components/auth/AuthLayout";

const CreateListing = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", category: "Coding", duration: 60 });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (key, parse = (v) => v) => (e) => setForm({ ...form, [key]: parse(e.target.value) });
  const cost = form.duration / 60;

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError("");
    setSaving(true);
    try {
      await api.post("/api/listings", form);
      toast.success("Skill posted");
      navigate("/");
    } catch (error) {
      const byField = fieldErrors(error);
      setErrors(byField);
      if (!Object.keys(byField).length) setFormError(apiError(error, "Couldn't post the skill"));
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Teach" title="Post a skill" description="One listing per thing you can teach. Learners book it, you agree on a time, and you earn the hours when the session is done." />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form onSubmit={submit} className="space-y-5 max-w-2xl" noValidate>
          <FormError>{formError}</FormError>
          <Field label="Title" hint="What will they be able to do after? e.g. “Build your first React component”." error={errors.title} counter={`${form.title.length}/100`}>
            {(p) => <Input {...p} maxLength={100} value={form.title} onChange={update("title")} />}
          </Field>
          <Field label="Description" hint="What you'll cover, what they should know already, what to bring." error={errors.description} counter={`${form.description.length}/2000`}>
            {(p) => <Textarea {...p} rows={6} maxLength={2000} value={form.description} onChange={update("description")} />}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" error={errors.category}>
              {(p) => (
                <Select {...p} value={form.category} onChange={update("category")}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Length" error={errors.duration}>
              {(p) => (
                <Select {...p} value={form.duration} onChange={update("duration", Number)}>
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {formatDuration(d)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="primary" loading={saving}>
              Post skill
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>
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
          <p className="text-sm text-muted">Credits are held when someone books and released to you once they confirm the session happened.</p>
        </Panel>
      </div>
    </>
  );
};

export default CreateListing;
