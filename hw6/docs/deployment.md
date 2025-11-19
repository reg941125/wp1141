# Deployment & Verification Guide

This project is designed to run on **Vercel** with the LINE Messaging API, Google Gemini, and MongoDB Atlas. Follow the steps below to deploy safely and keep the webhook responsive.

## 1. Prerequisites

- Vercel account linked to your Git provider.
- LINE Developers console access with Messaging API channel.
- MongoDB Atlas cluster (or equivalent MongoDB deployment).
- Google AI Studio / Vertex AI Gemini API key.

## 2. Environment Variables

Create `.env.local` for local work and replicate the same keys under **Vercel → Project → Settings → Environment Variables**:

| Key | Description |
| --- | --- |
| `LINE_CHANNEL_SECRET` | Messaging API Channel secret |
| `LINE_CHANNEL_ACCESS_TOKEN` | Messaging API Channel access token |
| `LINE_WEBHOOK_BASE_URL` | Public HTTPS base URL (e.g. `https://your-app.vercel.app`) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB_NAME` | Database name |
| `ADMIN_BASIC_AUTH_USER` / `ADMIN_BASIC_AUTH_PASS` | Credentials for `/admin` and `/api/admin/*` |
| `NEXT_PUBLIC_APP_NAME` | Branding shown on the marketing page |

> Vercel automatically injects these values during build and runtime.

## 3. Deploying to Vercel

1. **Import the repository** into Vercel (or use the CLI `vercel` command).
2. Select the Next.js framework. Build command stays `npm run build`.
3. Ensure Node.js 18+ runtime is available (default on Vercel).
4. Trigger a deploy; verify the build log includes `npm run test` locally before pushing.

### Runtime Notes

- API routes that interact with LINE/LLM are explicitly pinned to the Node.js runtime via `export const runtime = "nodejs"`.
- MongoDB connections use the native Vercel-friendly caching pattern to avoid cold-start penalties.

## 4. Configure the LINE Webhook

1. In LINE Developers console → **Messaging API**, set the webhook URL to:
   ```
   https://<your-vercel-domain>/api/line/webhook
   ```
2. Click **Verify** and ensure the server returns `LINE webhook is alive`.
3. Enable the webhook toggle and add your LINE official account as a friend to test.

### Friend & Follow Events

`follow`/`join` events trigger the `bootstrapReplies` flex template that promotes the admin dashboard. Text and button links automatically use the deployed Vercel domain.

## 5. MongoDB Atlas

- Create a database user with read/write permissions.
- Allow Vercel IP ranges or keep the cluster open to trusted IPs.
- Collections (`users`, `sessions`, `todos`, `messages`, `admin_logs`, `settings`) receive their indexes via `ensureDbIndexes()` at runtime. You can also run `npm run dev` locally once to bootstrap them.

## 6. Admin Dashboard Access

- Hosted at `/admin`.
- Protected by HTTP Basic Auth using `ADMIN_BASIC_AUTH_USER/PASS`.
- Includes real-time SSE feed, manual LLM retry, TODO management, analytics, error logs, and configuration panel.

## 7. Verification Checklist

1. `npm run lint` → no warnings introduced by your changes.
2. `npm run test` → Vitest suite covering intents, prompt builder, and inference rules.
3. Deploy to Vercel and confirm:
   - `/` marketing page renders.
   - `/admin` prompts for credentials and displays live data.
   - `POST /api/line/webhook` responds `200` to LINE verify request.
4. Send a LINE message and confirm:
   - Inbound/outbound logs appear under `/admin`.
   - MongoDB stores `users`, `sessions`, `messages`, and `todos`.

## 8. Operational Tips

- **Rate limit handling**: LLM quota exhaustion is cached for 60 seconds; fallback messages still show the latest todo snapshot.
- **Manual retry**: `/api/admin/sessions/:id/retry` replays the last inbound message through Gemini and pushes the response to the user.
- **Settings**: `/api/admin/settings` adjusts global defaults (priority & reminder lead time) without redeploying.
- **Monitoring**: `/api/admin/logs` aggregates LLM failures, manual actions, and configuration changes for quick triage.

You are now ready to ship updates confidently and verify them end-to-end with LINE and Vercel. 🎉

