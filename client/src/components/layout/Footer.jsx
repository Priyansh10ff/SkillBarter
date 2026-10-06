import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="border-t border-line">
    <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6">
      <p className="font-mono text-2xs uppercase tracking-wider text-faint">Skill Barter · 1 credit = 1 hour · no money involved</p>
      <nav aria-label="Footer" className="flex gap-5 text-sm text-muted">
        <Link to="/" className="hover:text-ink">
          Browse
        </Link>
        <Link to="/leaderboard" className="hover:text-ink">
          Leaderboard
        </Link>
        <a href="https://github.com/Priyansh10ff/SkillBarter" target="_blank" rel="noreferrer" className="hover:text-ink">
          Source
        </a>
      </nav>
    </div>
  </footer>
);
