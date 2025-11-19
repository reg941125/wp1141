# LINE Evaluation Playbook

Use this script to verify the bot end-to-end once the Vercel deployment is live and the webhook is enabled.

## 1. Onboarding & Templates

1. Add the official account.
2. Confirm the welcome text + Flex template + quick buttons arrive.
3. Tap **管理後台** to ensure `/admin` opens (Basic Auth protected).

## 2. Core Scenarios

| Test | Sample Message | Expected Behaviour |
| --- | --- | --- |
| Quick Add | `新增：下週三前安排年度體檢` | LLM infers due date (next Wednesday), priority `high`, and returns Markdown table + JSON. Mongo `todos` gains new entry. |
| Clarification | `幫我設定提醒` | Bot asks follow-up questions because time/target missing. |
| Listing | `查看代辦` | Scripted list response showing up to 5 tasks with bullet format and JSON snapshot. |
| Update | `把年度體檢標記完成` | Status changes to `completed`; response summarises mutation. |
| Decomposition | `下個月辦產品發表會` | LLM returns subtasks (場地、簡報、彩排…); stored in DB. |

## 3. Context & Fallbacks

- Send two related messages (`安排簡報` → `也幫我提醒主管`). Reply should reference prior context.
- Stress-test LLM quota by temporarily providing invalid `GEMINI_API_KEY`; verify fallback response includes todo snapshot and friendly apology.
- Observe `/admin` dashboard updating in near real-time.

## 4. Admin Interventions

- Log into `/admin`.
- Use **新增** form to push manual TODO and ensure it appears in LINE (ask user to `查看代辦`).
- Trigger **重試上一則 LLM**; confirm new assistant messages arrive via push.
- Add session notes and inspect `admin_logs` panel for the recorded action.

## 5. Failure Handling

- Send `完成某任務` when it does not exist → bot should prompt for clarification.
- Send unsupported attachment (sticker). Webhook should skip gracefully, and `/admin/logs` should remain clean.

## 6. Regression Checklist

- [ ] Webhook `POST /api/line/webhook` returns `200` for LINE verify payloads.
- [ ] Mongo collections populated: `users`, `sessions`, `messages`, `todos`, `admin_logs`, `settings`.
- [ ] `/admin/events` SSE stream stays open when browsing dashboard.
- [ ] `npm run test` passes locally before every deployment.

Following this playbook after each deploy keeps the LINE channel compliant and ensures all smart todo capabilities continue to work.

