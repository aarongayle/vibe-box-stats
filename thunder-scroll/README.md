# Thunder Scroll

Live at **https://boxscore.gayle.dev**.

Vite + React dashboard for any NBA team's latest game: box score, play-by-play, and recent results. ESPN and NBA.com data is fetched through a Cloudflare Worker so the browser never calls those APIs directly (avoiding CORS issues).

## Available scripts

| Command | Description |
| --- | --- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Run the Vite dev server (UI only) |
| `pnpm build` | Create a production build in `dist/` |
| `pnpm run deploy` | Build and deploy to Cloudflare (needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`) |

## API proxy

`worker/index.js` answers `/api/*`; every other path is the static build in `dist/`, with unknown paths falling back to `index.html` for client-side routing (`wrangler.jsonc`).

- `GET /api/schedule?teamId=<id>` fetches a team's ESPN schedule.
- `GET /api/summary?gameId=<id>` fetches the ESPN box score and plays for one event.
- `GET /api/nba-game?date=<iso>&home=<tri>&away=<tri>` finds the NBA.com game id for an ESPN game.
- `GET /api/nba-pbp?gameId=<nba id>` fetches NBA.com play-by-play (used for replay links).

The ESPN and NBA.com payloads are forwarded verbatim so the client normalization logic in `src/utils/` works untouched.

### Local development workflow

1. Install dependencies with `pnpm install`.
2. Run `pnpm build && npx wrangler dev` to serve the Worker and the build locally on `http://localhost:8787`.
3. In a separate terminal run `pnpm dev`.
4. Open the Vite dev server URL (usually `http://localhost:5173`). The dev proxy forwards every `/api/*` request to `wrangler dev` on port `8787`.

If you prefer not to run `wrangler dev`, point the UI at the deployed proxy by setting `VITE_API_BASE=https://boxscore.gayle.dev/api` before starting `pnpm dev`.

### Environment variables

| Name | Default | Details |
| --- | --- | --- |
| `VITE_API_BASE` | `/api` | Relative or absolute base URL used by the browser when calling the proxy. Set it to an empty string to bypass the proxy entirely (useful for debugging) or to a fully-qualified URL to reuse the deployed proxy while developing locally. |
| `VITE_DEV_SERVERLESS_URL` | `http://localhost:8787` | Development-only helper that tells the Vite proxy where `wrangler dev` is running. |

> ⚠️ When `VITE_API_BASE` is empty the client will attempt to hit ESPN directly and CORS will block it unless you are developing through a proxy.

### Deployment

`pnpm run deploy` builds and runs `wrangler deploy`, which publishes the Worker named `thunder-scroll` on the `boxscore.gayle.dev` custom domain.
