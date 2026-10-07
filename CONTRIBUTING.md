# Contributing to Skill Barter

Thanks for helping. This guide covers setup, how the code is organised, the conventions to follow and what a pull request needs.

## Setup

Follow [Getting started](README.md#getting-started). You need Node 22+ and a MongoDB replica set (a free Atlas M0 works). Run `npm run seed` in `server/` for demo data.

## Where things go

| Change | Place |
|---|---|
| A business rule (credits, booking states, rooms, reviews) | `server/services/` |
| Anything that changes a balance | `server/services/creditService.js` **only**, inside a transaction, with a ledger entry |
| Request validation | `server/validators/` (zod), attached in the route with `validate({ body, query, params })` |
| A new endpoint | route → controller (thin) → service. Add tests in `server/tests/` |
| Who gets notified about a booking change | `server/services/bookingEvents.js` |
| A UI primitive | `client/src/components/ui/`, exported from `ui/index.js`, shown on `/dev/ui` |
| A page | `client/src/pages/`, lazy-loaded in `App.jsx` |
| Constants shared with the client | `server/config/constants.js` and `client/src/lib/constants.js` (keep them in sync) |

## Rules that keep credits correct

1. Never write `timeCredits` directly. Go through `creditService`.
2. Every booking transition is a conditional update on the expected status (`findOneAndUpdate({ _id, status })`). If nothing matches, return `409`.
3. Multi-document changes run in `runInTransaction`.
4. New booking tests end with `await h.assertLedgerConsistent()`.

## Conventions

- **Server:** CommonJS, async/await. Express 5 forwards thrown errors, so throw `new AppError(status, message, details?)`. No try/catch in controllers unless you're adding behaviour.
- **Client:** function components and hooks. Tailwind utilities with the design tokens from [DESIGN.md](docs/DESIGN.md). Show credits with `<Hours>` and never hard-code amber.
- **Copy:** short, specific and in plain English. Errors say what to do next.
- **Accessibility:** labelled inputs, visible focus, AA contrast, keyboard-reachable controls.
- **Config:** everything comes from environment variables. Add new keys to `config/env.js` and the `.env.example` files, and document them in [TECHNICAL.md](docs/TECHNICAL.md#10-configuration).

## Checks before a PR

```bash
cd server && npm test
cd client && npm run lint && npm run build
```

All three must pass.

## Commits and branches

- Branch from `main`: `feat/…`, `fix/…`, `docs/…`, `chore/…`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) in one line, e.g. `fix(bookings): refuse accepting a proposal that has passed`.

## Pull request checklist

- [ ] Tests added or updated, and `npm test` passes
- [ ] Client lint and build pass
- [ ] Credit changes go through `creditService` and keep the ledger invariants
- [ ] New env vars are added to `env.js`, `.env.example` and the docs
- [ ] Docs updated where behaviour changed (API tables, PRD status)
- [ ] Screenshots for UI changes

## Reporting bugs

Open an issue with steps to reproduce, what you expected and what happened, plus the browser and any console or Render log lines. For security issues, see [SECURITY.md](SECURITY.md) instead.
