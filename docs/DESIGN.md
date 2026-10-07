# Skill Barter: Design System

The interface is dark, dense and quiet, closer to a terminal or a trading board than a marketing site. Everything is neutral except **time**: credits, durations and countdowns are amber, so the one thing the product is about is always the thing your eye lands on.

Live reference: run the client in development and open `/dev/ui` (`pages/StyleGuide.jsx`), which renders every primitive.

Related: [PRODUCT.md](./PRODUCT.md) · [TECHNICAL.md](./TECHNICAL.md)

---

## 1. Principles

- **Amber means time.** `accent` is for credits, hours, durations and countdowns. The only other places it appears are the single primary action on a screen and the focus ring. No decorative amber.
- **Flat and ruled.** Hairline borders (`line`) separate things, not shadows or gradients. The corner radius is 4 px everywhere.
- **Numbers are mono and tabular.** Balances, hours, stats and timestamps use JetBrains Mono with `tabular-nums`, so columns line up and values don't jitter when they change.
- **Labels whisper.** Section labels are small uppercase mono (`label-mono`). Content is the loudest thing on the page.
- **Accessible by default.** Every text colour passes WCAG AA (4.5:1) on every surface. Focus is always visible. Motion is minimal and switched off under `prefers-reduced-motion`.
- **No filler.** No stock illustrations, no gradients, no emoji. Empty states say what to do next.

## 2. Colour tokens

Defined as RGB triplets in `client/src/index.css` and mapped to Tailwind colours in `tailwind.config.js`, so opacity utilities work (`bg-accent/10`). A second theme only needs a new set of variables.

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0F0F0D` | Page background |
| `surface` | `#171715` | Panels, cards, dialogs |
| `raised` | `#1E1E1B` | Hover, inputs, pressed states |
| `line` | `#2A2A26` | Borders and dividers |
| `line-strong` | `#3A3A35` | Hovered borders, scrollbar |
| `ink` | `#ECEAE3` | Primary text |
| `muted` | `#A8A59C` | Secondary text (≥ 6.5:1 on every surface) |
| `faint` | `#87857F` | Meta text, placeholders (≥ 4.5:1 on every surface) |
| `accent` | `#FFB020` | Credits and time, the primary action, focus |
| `accent-ink` | `#1A1200` | Text on amber |
| `ok` | `#5FB37A` | Completed, positive ledger amounts |
| `bad` | `#E0604A` | Errors, disputes, negative amounts, destructive actions |
| `warn` | `#D6A84C` | Pending states |

Whiteboard pens use their own fixed palette: `#ECEAE3`, `#E0604A`, `#5FB37A`, `#6EA8FE`, `#D6A84C`. The server accepts only these colours.

## 3. Type

| Role | Font | Notes |
|---|---|---|
| UI and body | Instrument Sans 400 / 500 / 600 | 15 px base, relaxed line height |
| Numbers, labels, status | JetBrains Mono 400 / 500 | `tabular`, `label-mono` (11 px, uppercase, wide tracking) |
| Display | Instrument Sans 600 | Landing headline 44 px to 60 px, `tracking-tightest` (−0.03em) |

Both fonts are self-hosted through `@fontsource`. There are no requests to Google Fonts.

## 4. Layout

- Content width is capped at `max-w-page` (72 rem) with a 16 px gutter on mobile.
- Lists and boards use rows with hairline dividers rather than card grids. A listing is a row: title, teacher, category, length in amber.
- Page headers follow eyebrow (`label-mono`), then title, then one line of description.
- The session room is full screen and outside the app shell. The other person's video fills the stage with your own camera as a picture-in-picture in the corner. Opening the whiteboard moves both videos into a side column and fits a 4:3 board to the remaining space.

## 5. Components

All primitives live in `client/src/components/ui/` and are exported from `ui/index.js`.

| Component | Notes |
|---|---|
| `Button` | `primary` (amber, at most one per view), `secondary`, `ghost`, `danger`. Sizes `sm` / `md` / `lg`. `loading` shows a spinner and disables. `to` renders a router link |
| `Field` + `Input` / `Select` / `Textarea` | Label, hint and error wired with `aria-describedby`. Errors are in `bad` |
| `Panel`, `PanelHeader` | Surface with a hairline border. The header is a `label-mono` title with an optional action |
| `Hours` | The only way to render credits. Shows `1h 30m` style in mono. Tones: `accent`, `ink`, `muted`, or `sign` (green or red for ledger amounts) |
| `StatusTag` | `[ SCHEDULED ]` in mono, coloured per booking status |
| `Stamp` | Bordered mono badge, used for earned badges and tags |
| `Avatar` | Initials on a muted tone derived from the name. No uploaded photos |
| `Segmented` | Tab-like toggle (leaderboard sort, booking filters) |
| `SkillInput` | Tag input for skills: lowercase, deduplicated, up to 15 |
| `TimezoneSelect` | Every IANA timezone the browser knows, keeping a saved value even if it isn't listed |
| `Dialog` / `useConfirm()` | Native modal `<dialog>` (`showModal()`), so focus containment, Esc and the backdrop come from the browser |
| `Skeleton`, `Spinner`, `EmptyState` | Loading and empty states that say what to do next |

## 6. States and feedback

| State | Treatment |
|---|---|
| Loading | Skeleton rows the shape of the content. Buttons show an inline spinner |
| Empty | One line of what's missing and one action, e.g. "No sessions posted yet." → **Post the first skill** |
| Error (form) | `FormError` banner with `role="alert"` and field errors under each input |
| Error (page) | The error boundary shows a reload screen |
| Success | Toast at the bottom right, styled as a `surface` panel |
| Live change | New rows on the landing board fade in (`animate-row-in`). Balance updates in place |

## 7. Writing

- Plain, short and specific: "You can confirm once the session has started", not "Action not permitted".
- Time is said as time: "1 hour", "30m". Credits are shown as hours in the interface.
- Errors say what happened and what to do next. Server messages are written to be shown to users as they are.
