import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { apiError } from "../lib/format";
import { Spinner } from "../components/ui";
import { AuthLayout, FormError } from "../components/auth/AuthLayout";

const VerifyEmail = () => {
  const { token } = useParams();
  const { loginWithToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const started = useRef(false); // links work once; StrictMode runs effects twice in dev

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    api
      .get(`/api/auth/verify-email/${token}`)
      .then(({ data }) => {
        loginWithToken(data.token, data.user);
        navigate("/welcome", { replace: true });
      })
      .catch((err) => setError(apiError(err, "This link didn't work.")));
  }, [token, loginWithToken, navigate]);

  if (!error) {
    return (
      <AuthLayout title="Verifying your email">
        <p className="flex items-center gap-2 text-muted">
          <Spinner /> One moment.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Link didn't work"
      footer={
        <Link to="/login" className="text-ink underline underline-offset-4">
          Back to log in
        </Link>
      }
    >
      <FormError>{error}</FormError>
      <p className="mt-4 text-sm text-muted">
        Links expire after 24 hours and work once. If you already verified, just log in. Otherwise log in and use “Send a new link”.
      </p>
    </AuthLayout>
  );
};

export default VerifyEmail;
