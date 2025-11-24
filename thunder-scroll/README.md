# Thunder Scroll

Vite + React dashboard showing the latest Oklahoma City Thunder game plus recent results. All ESPN data is fetched through Vercel Serverless Functions so the browser never calls the ESPN APIs directly (avoiding CORS issues and hiding your API access pattern).

## Available scripts

| Command | Description |
| --- | --- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Run the Vite dev server (UI only) |
| `pnpm build` | Create a production build in `dist/` |

## ESPN proxy endpoints

The `/api` directory contains two Vercel Serverless Functions:

- `GET /api/schedule` fetches the Thunder schedule from ESPN.
- `GET /api/summary?gameId=<id>` fetches the ESPN box score for a single event.

Both endpoints forward the ESPN JSON payload verbatim so the existing client normalization logic continues to work untouched.

### Local development workflow

1. Install dependencies with `pnpm install`.
2. Run `vercel dev` in the project root to spin up the serverless functions locally (defaults to `http://localhost:3000`).
3. In a separate terminal run `pnpm dev`.
4. Open the Vite dev server URL (usually `http://localhost:5173`). Thanks to the dev proxy, every `/api/*` request is automatically forwarded to `vercel dev` on port `3000`, so CORS is never triggered.

If you prefer not to run `vercel dev`, point the UI at any deployed proxy by setting `VITE_API_BASE=https://your-app.vercel.app/api` before starting `pnpm dev`.

### Environment variables

| Name | Default | Details |
| --- | --- | --- |
| `VITE_API_BASE` | `/api` | Relative or absolute base URL used by the browser when calling the proxy. Set it to an empty string to bypass the proxy entirely (useful for debugging) or to a fully-qualified URL if you want to reuse an existing deployment while developing locally. |
| `VITE_DEV_SERVERLESS_URL` | `http://localhost:3000` | Development-only helper that tells the Vite proxy where your local serverless instance lives. Override it if you run `vercel dev` on another port. |

> ⚠️ When `VITE_API_BASE` is empty the client will attempt to hit ESPN directly and CORS will block it unless you are developing through a proxy.

### Deployment

Deploy the repo to Vercel using the default **Static Site** preset. Vercel will output the static assets from `pnpm run build` and automatically expose the functions located in `/api`. No custom rewrites are required; the proxy endpoints are available at the same origin as the SPA.
