import { useContext, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { apiError, fieldErrors } from "../lib/format";
import { Button, Field, Input, PageHeader, Panel, PanelHeader, SkillInput, Textarea, TimezoneSelect } from "../components/ui";
import { FormError } from "../components/auth/AuthLayout";

const ProfileForm = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio || "",
    skillsOffered: user.skillsOffered || [],
    skillsRequested: user.skillsRequested || [],
    preferredHours: user.preferredHours || "",
    timezone: user.timezone || "UTC",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key) => (e) => set(key)(e.target.value);

  const save = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Profile saved");
    } catch (error) {
      setErrors(fieldErrors(error));
      toast.error(apiError(error, "Couldn't save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel as="section">
      <PanelHeader title="Profile" />
      <form onSubmit={save} className="p-4 md:p-5 space-y-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" error={errors.name}>{(p) => <Input {...p} maxLength={60} value={form.name} onChange={text("name")} />}</Field>
          <Field label="Timezone" error={errors.timezone}>{(p) => <TimezoneSelect {...p} value={form.timezone} onChange={text("timezone")} />}</Field>
        </div>
        <Field label="About you" error={errors.bio} counter={`${form.bio.length}/500`}>
          {(p) => <Textarea {...p} rows={3} maxLength={500} value={form.bio} onChange={text("bio")} />}
        </Field>
        <Field label="Skills you can teach" hint="Press Enter after each one." error={errors.skillsOffered}>
          {(p) => <SkillInput {...p} value={form.skillsOffered} onChange={set("skillsOffered")} placeholder="e.g. react" />}
        </Field>
        <Field label="Skills you want to learn" hint="Press Enter after each one." error={errors.skillsRequested}>
          {(p) => <SkillInput {...p} value={form.skillsRequested} onChange={set("skillsRequested")} placeholder="e.g. guitar" />}
        </Field>
        <Field label="Usually free" error={errors.preferredHours}>
          {(p) => <Input {...p} maxLength={100} value={form.preferredHours} onChange={text("preferredHours")} placeholder="e.g. Weekdays after 19:00" />}
        </Field>
        <Button type="submit" variant="primary" loading={saving}>
          Save profile
        </Button>
      </form>
    </Panel>
  );
};

const PasswordForm = () => {
  const { loginWithToken } = useContext(AuthContext);
  const empty = { currentPassword: "", newPassword: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError("");
    setSaving(true);
    try {
      const { data } = await api.put("/api/users/me/password", form);
      loginWithToken(data.token); // this session stays logged in
      setForm(empty);
      toast.success("Password changed. Other sessions were logged out.");
    } catch (error) {
      const byField = fieldErrors(error);
      setErrors(byField);
      if (!Object.keys(byField).length) setFormError(apiError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel as="section">
      <PanelHeader title="Password" />
      <form onSubmit={save} className="p-4 md:p-5 space-y-5" noValidate>
        <FormError>{formError}</FormError>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Current password" error={errors.currentPassword}>
            {(p) => <Input {...p} type="password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />}
          </Field>
          <Field label="New password" hint="At least 8 characters." error={errors.newPassword}>
            {(p) => <Input {...p} type="password" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />}
          </Field>
        </div>
        <Button type="submit" loading={saving} disabled={!form.currentPassword || !form.newPassword}>
          Change password
        </Button>
      </form>
    </Panel>
  );
};

const Settings = () => (
  <>
    <PageHeader eyebrow="Account" title="Settings" description="What others see on your profile, and how you log in." />
    <div className="max-w-3xl space-y-6">
      <ProfileForm />
      <PasswordForm />
    </div>
  </>
);

export default Settings;
