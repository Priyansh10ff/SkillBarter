import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { apiError, fieldErrors } from "../lib/format";
import { Button, Field, Hours, Input } from "../components/ui";
import { AuthLayout, FormError } from "../components/auth/AuthLayout";

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", skills: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError("");
    setLoading(true);
    const skills = form.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await register(form.name, form.email, form.password, skills);
      navigate("/welcome", { replace: true });
    } catch (err) {
      const byField = fieldErrors(err);
      setErrors(byField);
      if (!Object.keys(byField).length) setFormError(apiError(err, "Couldn't create the account. Try again."));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      description={
        <>
          You start with <Hours value={2} />, enough for two one-hour sessions.
        </>
      }
      footer={
        <>
          Already have one?{" "}
          <Link to="/login" className="text-ink underline underline-offset-4 hover:text-accent">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError>{formError}</FormError>
        <Field label="Name" error={errors.name}>
          {(p) => <Input {...p} autoComplete="name" value={form.name} onChange={update("name")} />}
        </Field>
        <Field label="Email" error={errors.email}>
          {(p) => <Input {...p} type="email" autoComplete="email" value={form.email} onChange={update("email")} />}
        </Field>
        <Field label="Password" hint="At least 8 characters." error={errors.password}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={form.password} onChange={update("password")} />}
        </Field>
        <Field label="What can you teach?" hint="Optional. Separate with commas, e.g. react, guitar, spanish." error={errors.skills}>
          {(p) => <Input {...p} value={form.skills} onChange={update("skills")} />}
        </Field>
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Register;
