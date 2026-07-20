# Vedastra — Premium AI Astrology

> Discover the story written in the stars. A luxury, cosmic AI astrology experience built on a **real** birth-chart engine.

Vedastra is a full-stack Next.js application that computes an accurate Vedic birth chart from your exact time and place of birth, presents it in an immersive, animated dashboard, and lets you chat with an AI astrologer grounded in your actual placements.

**It runs with zero configuration** — a rich, chart-aware mock astrologer and a bundled offline city database mean no API keys are required to try everything. Add keys to upgrade to live services.

---

## ✨ Highlights

- **Real astrology engine** (`src/lib/astrology`) — Julian day, geocentric planetary positions (Schlyter's method + perturbations), Lahiri ayanāṁśa, ascendant, whole-sign houses, nakshatras & padas, dignities & strength, retrogrades, Navāṁśa (D9), Vimśottari daśā/antardaśā, and yoga/dosha detection. Pluggable via the `AstrologyEngine` interface.
- **AI Astrologer** (`src/lib/ai`) — streaming chat grounded in the computed chart. Provider-agnostic: **OpenAI** (`OPENAI_API_KEY` / `LLM_API_KEY`) or **Claude** (`ANTHROPIC_API_KEY`); falls back to a deterministic **chart-aware mock** when no key is set.
- **Accounts & saved charts** — email/password auth (JWT httpOnly cookie + bcrypt), **Prisma** on **SQLite** (Postgres-ready), with save / load / delete scoped to your account.
- **PDF report export** — a typeset, multi-page report generated server-side (`pdfkit`) and downloaded from the dashboard.
- **Cosmic UI** — animated starfield canvas, aurora nebulae, meteors, an interactive zodiac wheel, glassmorphism, premium dark & light themes, and 60fps micro-interactions (Framer Motion).
- **Interactive birth chart** — zoom, rotate, hover-highlight houses, planet tooltips, D1 (Rāśi) and D9 (Navāṁśa) views.
- **Immersive dashboard** — chart, planet table, daśā timeline, yogas & doshas, lucky factors, and multi-timeframe horoscopes.

## 🧱 Architecture

```
src/
  app/                 # Routes: landing, onboarding, dashboard, chat + API routes
    api/{chart,chat,places}/route.ts
  components/
    ui/                # Reusable primitives (button, card, tabs, tooltip, …)
    cosmic/            # Starfield, aurora, meteors, zodiac wheel
    landing/ onboarding/ loading/ dashboard/ chat/
  lib/
    astrology/         # The calculation engine (provider-pluggable)
    ai/                # AI provider abstraction (Claude + mock)
    geo/               # Geocoding (bundled cities + Google/Mapbox)
    store/ hooks/ utils/  config.ts  validation.ts
```

The layers are decoupled: the UI depends only on the `BirthChart` type, so the calculation backend (local math engine → Swiss Ephemeris service/API) and the AI backend can be swapped without touching components.

## 🚀 Getting started

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Then open the app and click **Begin Your Cosmic Journey**.

### Environment (all optional)

Copy `.env.example` to `.env.local`. Everything runs without any of these:

| Variable | Purpose |
| --- | --- |
| `LLM_PROVIDER` / `AI_PROVIDER` | `openai` \| `claude` \| `mock` (auto-detects from whichever key is set). |
| `LLM_API_KEY` / `OPENAI_API_KEY` | OpenAI key. Enables the real astrologer. `OPENAI_MODEL` overrides the model (default `gpt-4o-mini`). |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Use Claude instead (default model `claude-opus-4-8`). |
| `DATABASE_URL` | Enables accounts + saved charts. `file:./dev.db` (SQLite) works out of the box; use a Postgres URL for production. |
| `JWT_SECRET` | Signing secret for session cookies (set a long random value in production). |
| `GEOCODER` | `local` (default) \| `google` \| `mapbox`. |
| `GOOGLE_PLACES_API_KEY` / `MAPBOX_TOKEN` | Live birthplace autocomplete. |

Database setup (only if `DATABASE_URL` is set):

```bash
pnpm exec prisma generate     # generate the client
pnpm exec prisma db push      # create the schema (SQLite file or your Postgres DB)
```

## 📜 Scripts

- `pnpm dev` — start the dev server
- `pnpm build` / `pnpm start` — production build & serve
- `pnpm typecheck` — strict TypeScript check
- `pnpm lint` — Next.js lint

## ⚠️ Disclaimer

Vedastra is for insight, reflection and entertainment. Its readings describe tendencies and possibilities, not guaranteed outcomes, and are not a substitute for professional medical, legal, or financial advice.

## 🔭 Accuracy note

The bundled engine uses well-documented low-precision astronomy (≈ arc-minute accuracy over 1900–2100) — ample for sign, nakshatra, house and daśā determination. For sub-arc-second work, implement `AstrologyEngine` against a Swiss-Ephemeris-grade backend; no UI changes are required.
