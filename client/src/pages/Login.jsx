import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { apiError } from "../lib/format";
import { Button, Field, Input } from "../components/ui";
import { AuthLayout, FormError } from "../components/auth/AuthLayout";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(location.state?.from || (user.onboardedAt ? "/" : "/welcome"), { replace: true });
    } catch (err) {
      setError(apiError(err, "Couldn't log in. Try again."));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      description="Use the email you signed up with."
      footer={
        <>
          No account yet?{" "}
          <Link to="/register" className="text-ink underline underline-offset-4 hover:text-accent">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError>{error}</FormError>
        <Field label="Email">
          {(p) => <Input {...p} type="email" autoComplete="email" required value={form.email} onChange={update("email")} />}
        </Field>
        <Field label="Password">
          {(p) => <Input {...p} type="password" autoComplete="current-password" required value={form.password} onChange={update("password")} />}
        </Field>
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
