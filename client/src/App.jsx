import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { PageLoader } from "./components/layout/PageLoader";

// Each page is its own chunk, loaded on first visit
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const CreateListing = lazy(() => import("./pages/CreateListing"));
const Bookings = lazy(() => import("./pages/Bookings"));
const Room = lazy(() => import("./pages/Room"));
const Profile = lazy(() => import("./pages/Profile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StyleGuide = import.meta.env.DEV ? lazy(() => import("./pages/StyleGuide")) : null;

const App = () => (
  <AuthProvider>
    <SocketProvider>
      <ConfirmProvider>
        <Router>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/create-listing" element={<CreateListing />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="/my-transactions" element={<Navigate to="/bookings" replace />} />
              {StyleGuide && <Route path="/dev/ui" element={<StyleGuide />} />}
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Full-screen, outside the app shell */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/room/:id"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Room />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </Router>
      </ConfirmProvider>
    </SocketProvider>
  </AuthProvider>
);

export default App;
