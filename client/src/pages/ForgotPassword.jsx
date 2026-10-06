import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { apiError } from "../lib/format";
import { Button, Field, Input, Panel } from "../components/ui";
import { AuthLayout, FormError } from "../components/auth/AuthLayout";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const back = (
    <Link to="/login" className="text-ink underline underline-offset-4 hover:text-accent">
      Back to log in
    </Link>
  );

  if (sent) {
    return (
      <AuthLayout title="Check your email" footer={back}>
        <Panel className="p-4 space-y-2">
          <p>
            If <span className="text-ink font-medium">{email}</span> has an account, a reset link is on its way.
          </p>
          <p className="text-sm text-muted">It expires in 1 hour. Running locally without email set up? The link is in the server terminal.</p>
        </Panel>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" description="We'll email you a link to choose a new one." footer={back}>
      <form onSubmit={submit} className="space-y-4">
        <FormError>{error}</FormError>
        <Field label="Email">{(p) => <Input {...p} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
