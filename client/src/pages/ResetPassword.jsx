import { useContext, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { apiError, fieldErrors } from "../lib/format";
import { Button, Field, Input } from "../components/ui";
import { AuthLayout, FormError } from "../components/auth/AuthLayout";

const ResetPassword = () => {
  const { token } = useParams();
  const { loginWithToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError("");
    if (password !== confirmPassword) return setErrors({ confirm: "Passwords don't match" });

    setLoading(true);
    try {
      const { data } = await api.post(`/api/auth/reset-password/${token}`, { password });
      loginWithToken(data.token, data.user);
      toast.success("Password updated. Other sessions were logged out.");
      navigate("/", { replace: true });
    } catch (err) {
      const byField = fieldErrors(err);
      setErrors(byField);
      if (!byField.password) setFormError(apiError(err, "This link didn't work"));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      footer={
        <Link to="/forgot-password" className="text-ink underline underline-offset-4 hover:text-accent">
          Need a new link?
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError>{formError}</FormError>
        <Field label="New password" hint="At least 8 characters." error={errors.password}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        <Field label="Repeat it" error={errors.confirm}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />}
        </Field>
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
          Save password
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
