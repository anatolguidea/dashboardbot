# Dashboard ↔ Python Bots Integration Tutorial

This guide shows **all steps** to connect the dashboard with your Python bot backend for:

- one bot
- multiple bots (per-bot + all-bots aggregate)

---

## 1. Prerequisites

1. Install Node dependencies in the dashboard project:
   ```bash
   npm install
   ```
2. Have your Python backend running (for example on `http://127.0.0.1:8000`).
3. Ensure your Python backend returns JSON responses.

---

## 2. Configure environment variables

Create a `.env.local` file in the dashboard root:

```bash
PYTHON_SERVER_URL=http://127.0.0.1:8000
PYTHON_SHARED_SECRET=your-shared-secret-optional
```

Notes:
- `PYTHON_SERVER_URL` is required.
- `PYTHON_SHARED_SECRET` is optional. If set, dashboard routes forward it as `x-python-shared-secret`.

---

## 3. Understand how the dashboard connects to Python

The dashboard does **not** call Python directly from the browser.
It calls Next.js route handlers, which proxy to Python:

- `GET /api/metrics` → Python `/api/bot-metrics`
- `GET /api/metrics` also reads events from Python:
  - `/api/new-user`
  - `/api/new-phonenumber`
- `GET /api/ai-insights` → Python `/api/ai-insights`
- `GET /api/bots` → Python `/api/bots`
- `POST /api/metrics` → Python `/api/bot-commands` (commands path)

This keeps backend URLs/secrets server-side and gives you one stable frontend API.

---

## 4. Python API contract you must implement

## 4.1 List bots

Endpoint:

```http
GET /api/bots
```

Response:

```json
[
  { "id": "bot_sales", "name": "Sales Bot" },
  { "id": "bot_support", "name": "Support Bot" }
]
```

Also accepted:

```json
{ "data": [ { "id": "...", "name": "..." } ] }
```

---

## 4.2 Metrics (single bot or all bots)

Endpoint:

```http
GET /api/bot-metrics?period=month|week|day&date=YYYY-MM-DD&botId=<id|all>
```

Required response shape:

```json
{
  "messagesThisMonth": 1200,
  "totalUsers": 430,
  "phoneNumbersCaptured": 97,
  "growth": {
    "messages": "+12%",
    "users": "+7%",
    "phones": "+4%"
  },
  "chartData": [
    {
      "date": "2026-04-01",
      "messages": 40,
      "users": 13,
      "platforms": {
        "facebook": 18,
        "instagram": 12,
        "whatsapp": 10
      }
    }
  ]
}
```

Also accepted:

```json
{ "data": { "...same fields..." } }
```

---

## 4.3 Event endpoints for recent activity

The dashboard now uses these endpoints for recent activity:

```http
GET /api/new-user?period=month|week|day&date=YYYY-MM-DD&botId=<id|all>
GET /api/new-phonenumber?period=month|week|day&date=YYYY-MM-DD&botId=<id|all>
```

Expected item format for both endpoints:

```json
{
  "time": "2026-04-07T08:30:00Z",
  "bot_id": "bot_support",
  "channel": "facebook",
  "sender_id": "123456789",
  "sender_name": "Иван Иванов"
}
```

Supported envelope forms:

```json
[ { "...item..." } ]
```

or

```json
{ "data": [ { "...item..." } ] }
```

The dashboard merges both endpoint results into `recentActivity`, tagged as:
- `new_user` (from `/api/new-user`)
- `new_phonenumber` (from `/api/new-phonenumber`)

---

## 4.4 AI insights (single bot or all bots)

Endpoint:

```http
GET /api/ai-insights?period=month|week|day&date=YYYY-MM-DD&botId=<id|all>
```

Required response shape:

```json
{
  "summary": "Support load increased due to campaign traffic.",
  "highlights": [
    {
      "title": "Peak hour spike",
      "detail": "19:00-21:00 has 38% more messages.",
      "severity": "medium"
    }
  ],
  "recommendations": [
    {
      "title": "Add quick replies",
      "detail": "Create canned replies for top 3 intents.",
      "severity": "low"
    }
  ],
  "lastUpdated": "2026-04-07T07:00:00Z"
}
```

Also accepted:

```json
{ "data": { "...same fields..." } }
```

---

## 4.5 Bot commands (optional in current scope)

Endpoint:

```http
POST /api/bot-commands
```

The dashboard already proxies command payloads through `POST /api/metrics`.

---

## 5. Query parameters used by dashboard

- `period`: `month`, `week`, or `day`
- `date`: `YYYY-MM-DD`
- `botId`:
  - specific bot id (example: `bot_support`)
  - `all` for aggregate stats

Validation notes:
- `botId` allows letters, numbers, `_`, `-`, and `all`.

---

## 6. Start both services

1. Start Python backend:
   ```bash
   # your command, example:
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
2. Start dashboard:
   ```bash
   npm run dev
   ```
3. Open:
   - Dashboard: `http://localhost:3000`

---

## 7. Test integration manually

Use these checks before opening UI:

1. Bots list:
   ```bash
   curl "http://127.0.0.1:8000/api/bots"
   ```
2. One bot metrics:
   ```bash
   curl "http://127.0.0.1:8000/api/bot-metrics?period=month&date=2026-04-07&botId=bot_support"
   ```
3. All bots metrics:
   ```bash
   curl "http://127.0.0.1:8000/api/bot-metrics?period=month&date=2026-04-07&botId=all"
   ```
4. AI insights:
   ```bash
    curl "http://127.0.0.1:8000/api/ai-insights?period=week&date=2026-04-07&botId=all"
    ```
5. New user events:
   ```bash
   curl "http://127.0.0.1:8000/api/new-user?period=week&date=2026-04-07&botId=all"
   ```
6. New phone events:
   ```bash
   curl "http://127.0.0.1:8000/api/new-phonenumber?period=week&date=2026-04-07&botId=all"
   ```

If these succeed, the dashboard should render without connection errors.

---

## 8. How to use in the dashboard UI

1. Open the dashboard.
2. Use the **Bot** selector:
   - choose a specific bot for per-bot stats
   - choose **All Bots** for aggregate stats
3. Change period/date filters.
4. Review:
   - KPI cards
   - charts
   - recent activity
   - AI insights panel

---

## 9. Troubleshooting

## 9.1 “Could not connect to Python backend”

Check:
1. Python backend is running.
2. `.env.local` has correct `PYTHON_SERVER_URL`.
3. URL is reachable from dashboard process.

## 9.2 “Invalid ... payload”

Your Python response does not match expected schema.
Fix field names/types exactly as documented above.

## 9.3 Bot list is empty

Check `/api/bots` returns valid bot objects:
- each bot must include `id` and `name` (both strings).

## 9.4 Shared secret mismatch

If using `PYTHON_SHARED_SECRET`, Python must read and validate header:
- `x-python-shared-secret`

---

## 10. Minimal Python endpoint skeleton (FastAPI example)

```python
from fastapi import FastAPI, Query

app = FastAPI()

@app.get("/api/bots")
def bots():
    return [
        {"id": "bot_support", "name": "Support Bot"},
        {"id": "bot_sales", "name": "Sales Bot"},
    ]

@app.get("/api/bot-metrics")
def bot_metrics(
    period: str = Query("month"),
    date: str = Query(...),
    botId: str = Query("all"),
):
    # Return real data for one bot or aggregate if botId == "all"
    return {
        "messagesThisMonth": 1200,
        "totalUsers": 430,
        "phoneNumbersCaptured": 97,
        "growth": {"messages": "+12%", "users": "+7%", "phones": "+4%"},
        "chartData": [],
    }

@app.get("/api/new-user")
def new_user_events(
    period: str = Query("month"),
    date: str = Query(...),
    botId: str = Query("all"),
):
    return [
        {
            "time": "2026-04-07T08:30:00Z",
            "bot_id": "bot_support",
            "channel": "facebook",
            "sender_id": "123456789",
            "sender_name": "Иван Иванов",
        }
    ]

@app.get("/api/new-phonenumber")
def new_phone_events(
    period: str = Query("month"),
    date: str = Query(...),
    botId: str = Query("all"),
):
    return [
        {
            "time": "2026-04-07T08:35:00Z",
            "bot_id": "bot_support",
            "channel": "instagram",
            "sender_id": "987654321",
            "sender_name": "Maria",
        }
    ]

@app.get("/api/ai-insights")
def ai_insights(
    period: str = Query("month"),
    date: str = Query(...),
    botId: str = Query("all"),
):
    return {
        "summary": "Example summary",
        "highlights": [],
        "recommendations": [],
    }
```

---

## 11. Production recommendations

1. Keep dashboard-to-python traffic private (internal network/VPN).
2. Use `PYTHON_SHARED_SECRET` (or stronger auth) for service-to-service calls.
3. Add structured logging on Python endpoints for `botId`, `period`, `date`.
4. Add rate limiting/throttling on Python API if traffic grows.
5. Version your Python API contract if payloads evolve.
