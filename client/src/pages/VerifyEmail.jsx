import { useContext, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import AuthContext from "../context/AuthContext";
import { apiError } from "../lib/format";
import { Button, Spinner } from "../components/ui";
import { AuthLayout, FormError } from "../components/auth/AuthLayout";

const VerifyEmail = () => {
  const { token } = useParams();
  const { loginWithToken } = useContext(AuthContext);
  const [state, setState] = useState({ status: "verifying" });
  const started = useRef(false); // links work once; StrictMode runs effects twice in dev

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    api
      .get(`/api/users/verify-email/${token}`)
      .then(({ data }) => {
        loginWithToken(data.token, data.user);
        setState({ status: "done" });
      })
      .catch((error) => setState({ status: "failed", message: apiError(error, "This link didn't work.") }));
  }, [token, loginWithToken]);

  if (state.status === "verifying") {
    return (
      <AuthLayout title="Verifying your email">
        <p className="flex items-center gap-2 text-muted">
          <Spinner /> One moment.
        </p>
      </AuthLayout>
    );
  }

  if (state.status === "failed") {
    return (
      <AuthLayout title="Link didn't work" footer={<Link to="/login" className="text-ink underline underline-offset-4">Back to log in</Link>}>
        <FormError>{state.message}</FormError>
        <p className="mt-4 text-sm text-muted">Links expire after 24 hours and can only be used once. If you already verified, just log in.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Email verified" description="You're logged in and your welcome credits are ready.">
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" to="/">
          Find something to learn
        </Button>
        <Button to="/create-listing">Post a skill</Button>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
