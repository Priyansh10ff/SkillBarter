# Security Policy

## Reporting a vulnerability

Please **don't open a public issue** for security problems. Email **priyansh10work@gmail.com** with:

- what you found and where (endpoint, page or socket event)
- steps to reproduce, or a proof of concept
- the impact you think it has

You'll get a reply within 3 days. Once a fix is out, you're welcome to publish the details, and you'll be credited if you want.

## Supported versions

Only the latest `main`, as deployed at [skillbarter-web.vercel.app](https://skillbarter-web.vercel.app), is supported.

## In scope

- Getting or moving credits you shouldn't (double release or refund, negative balances, bypassing holds)
- Reading or changing someone else's bookings, chats, reviews or room
- Joining a session room you aren't part of, or taking over a peer ID
- Authentication bypass, token forgery, or privilege escalation to admin
- Injection, XSS, or leaking emails or password hashes

## Out of scope

- Rate-limit tuning, missing headers with no demonstrated impact, and self-XSS
- Denial of service against the free hosting tiers
- Accounts created to collect the 2 signup credits (a known limitation, see [PRD risks](docs/PRD.md#10-risks-and-open-questions))

## Security model at a glance

| Area | Measure |
|---|---|
| Passwords | bcrypt (cost 10). Never returned by any endpoint |
| Sessions | JWT Bearer tokens, 7 days. Rejected after a password change |
| Access control | Server-side ownership and participant checks on every booking, chat, room and review |
| Credits | Transactions, conditional state changes, an append-only ledger, and no balance below 0 |
| Input | zod on every request. Unknown fields stripped. Search regex-escaped |
| Transport | CORS and sockets limited to the client origin in production. helmet headers. 100 kB body limit |
| Abuse | Rate limits (20 / 15 min on auth, 300 / 15 min on the API). Disposable email domains blocked |
| Rooms | Peer IDs signed with HMAC per booking and role. Access only inside the session window |
| Secrets | Environment variables only. `.env` git-ignored |

The details are in [TECHNICAL.md › Auth and security](docs/TECHNICAL.md#9-auth-and-security).
