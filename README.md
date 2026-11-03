# Glass English

Mobile-first English writing coach. React + Framer Motion on Cloudflare Pages, AI feedback from Cloudflare Workers AI, sign-in with Google only.

- **Write** – type English, get a corrected version, score, per-fix explanations (Japanese) and Formal / Casual / Natural / Concise rewrites.
- **Cards** – today's study tasks. Flick right = 完了, left = スキップ, up = 復習 (buttons do the same).
- **Log** – every task with its status; tap the icon to cycle it.

White liquid-glass UI (backdrop blur, hairline borders, sheen), animated transitions throughout, and skeleton loaders for every async surface.

## Stack

| Layer | Tech |
| --- | --- |
| UI | Vite, React 18, TypeScript, Tailwind CSS, Framer Motion |
| API | Cloudflare Pages Functions (`functions/`) |
| AI | Workers AI `@cf/meta/llama-3.3-70b-instruct-fp8-fast` with JSON-schema output |
| Auth | Google OAuth 2.0 (authorization code flow) → HMAC-signed HttpOnly session cookie |
| Tests | Playwright, iPhone 14 (WebKit) |

## API

| Route | Description |
| --- | --- |
| `GET /api/auth/login` | Redirects to Google consent, sets CSRF `state` cookie |
| `GET /api/auth/callback` | Verifies state, exchanges code, sets session |
| `GET /api/auth/me` | Current user or 401 |
| `POST /api/auth/logout` | Clears session |
| `POST /api/correct` | `{ text, context? }` → correction (requires session) |
| `GET /api/tasks` | Today's study tasks |

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars   # fill in Google OAuth client + SESSION_SECRET
npm run pages:dev                # http://127.0.0.1:8788
```

Create an OAuth client (Web application) in Google Cloud Console and add
`http://127.0.0.1:8788/api/auth/callback` and `https://<your-project>.pages.dev/api/auth/callback`
as authorized redirect URIs. Workers AI in local dev runs against your Cloudflare account (`wrangler login`).

## Deploy

```bash
npx wrangler pages project create glass-english
npx wrangler pages secret put GOOGLE_CLIENT_ID
npx wrangler pages secret put GOOGLE_CLIENT_SECRET
npx wrangler pages secret put SESSION_SECRET
npm run deploy
```

The `AI` binding is declared in `wrangler.toml`.

## Tests

```bash
npx playwright install webkit
npm run test:e2e
```

The suite builds the app and runs it under `wrangler pages dev`, so OAuth redirect, state check, session verification and auth guards hit the real Functions. Workers AI responses are stubbed in the browser (with latency, to assert skeletons). Coverage: launch & focus, viewport fit, glass styling, tab transitions, skeletons, Google login flow, swipe right/left/up, snap-back, persistence, AI correction rendering & tone tabs, error/retry, expired session.
