import { Link } from "react-router-dom";
import { Avatar, Button } from "../ui";

const Leg = ({ label, skills, arrow }) => (
  <div className="grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-3">
    <dt className="text-faint uppercase tracking-wider text-2xs">{label}</dt>
    <dd className="text-ink truncate">{skills.join(", ")}</dd>
    <span aria-hidden="true" className="text-muted">
      {arrow}
    </span>
  </div>
);

// Two-way matches: they teach what you want and want what you teach
export const BarterMatches = ({ matches }) => (
  <section aria-labelledby="barter-title" className="mb-10">
    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
      <h2 id="barter-title" className="label-mono">
        Barter matches
      </h2>
      <p className="text-sm text-muted">They teach what you want, and want what you teach.</p>
    </div>
    <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {matches.map(({ user, theyTeach, theyWant }) => (
        <li key={user._id} className="border border-line rounded bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <Link to={`/u/${user._id}`} className="flex items-center gap-2 min-w-0 group">
              <Avatar name={user.name} size="sm" />
              <span className="truncate group-hover:underline underline-offset-4">{user.name}</span>
            </Link>
            <Button size="sm" to={`/u/${user._id}`}>
              See sessions
            </Button>
          </div>
          <dl className="mt-4 font-mono text-xs space-y-2 border-t border-line pt-3">
            <Leg label="You teach" skills={theyWant} arrow="──→" />
            <Leg label="You learn" skills={theyTeach} arrow="←──" />
          </dl>
        </li>
      ))}
    </ul>
  </section>
);
