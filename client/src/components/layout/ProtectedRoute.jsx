import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import { PageLoader } from "./PageLoader";

export const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
};
