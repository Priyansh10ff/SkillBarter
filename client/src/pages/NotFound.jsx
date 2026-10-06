import { Button } from "../components/ui";

const NotFound = () => (
  <div className="max-w-md pt-6">
    <p className="label-mono">404</p>
    <h1 className="mt-2 text-3xl tracking-tightest">Nothing here.</h1>
    <p className="mt-2 text-muted">The page moved or never existed. Your hours are safe.</p>
    <div className="mt-6 flex gap-2">
      <Button variant="primary" to="/">
        Browse sessions
      </Button>
      <Button to="/bookings">Your bookings</Button>
    </div>
  </div>
);

export default NotFound;
