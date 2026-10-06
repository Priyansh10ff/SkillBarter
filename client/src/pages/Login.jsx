import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { apiError } from "../lib/format";
import { Button, Field, Input } from "../components/ui";
import { AuthLayout, FormError } from "../components/auth/AuthLayout";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null); // { message, unverified }
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(location.state?.from || (user.onboardedAt ? "/" : "/welcome"), { replace: true });
    } catch (err) {
      setError({ message: apiError(err, "Couldn't log in. Try again."), unverified: err.response?.data?.code === "EMAIL_UNVERIFIED" });
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await api.post("/api/auth/resend-verification", { email: form.email });
      toast.success("New verification link sent. Check your email.");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setResending(false);
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
        {error && (
          <FormError>
            {error.message}
            {error.unverified && "."}
            {error.unverified && (
              <>
                {" "}
                <button type="button" onClick={resend} disabled={resending} className="underline underline-offset-4 hover:text-ink disabled:opacity-50">
                  {resending ? "Sending…" : "Send a new link"}
                </button>
              </>
            )}
          </FormError>
        )}
        <Field label="Email">
          {(p) => <Input {...p} type="email" autoComplete="email" required value={form.email} onChange={update("email")} />}
        </Field>
        <Field
          label="Password"
          aside={
            <Link to="/forgot-password" className="text-sm text-muted hover:text-ink">
              Forgot it?
            </Link>
          }
        >
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
