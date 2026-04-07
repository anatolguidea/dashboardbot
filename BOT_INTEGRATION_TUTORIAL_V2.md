# Bot Integration Tutorial v2 (Dashboard + Python)

This is the updated integration guide for the current dashboard API contract.

## 1. Dashboard environment setup

Create `.env.local` in dashboard root:

```bash
PYTHON_SERVER_URL=http://127.0.0.1:8000
PYTHON_SHARED_SECRET=optional-secret
```

- `PYTHON_SERVER_URL` is required.
- `PYTHON_SHARED_SECRET` is optional. If set, dashboard sends `x-python-shared-secret` header.

---

## 2. Endpoints Python must provide

You need these endpoints:

1. `GET /api/bots`
2. `GET /api/bot-metrics?period=month|week|day&date=YYYY-MM-DD&botId=<id|all>`
3. `GET /api/new-user?period=month|week|day&date=YYYY-MM-DD&botId=<id|all>`
4. `GET /api/new-phonenumber?period=month|week|day&date=YYYY-MM-DD&botId=<id|all>`
5. `GET /api/ai-insights?period=month|week|day&date=YYYY-MM-DD&botId=<id|all>`

---

## 3. Required response formats

## 3.1 `/api/bots`

```json
[
  { "id": "bot_support", "name": "Support Bot" },
  { "id": "bot_sales", "name": "Sales Bot" }
]
```

or:

```json
{ "data": [ { "id": "bot_support", "name": "Support Bot" } ] }
```

## 3.2 `/api/new-user` and `/api/new-phonenumber`

Each event item must include:

```json
{
  "time": "2026-04-07T08:30:00Z",
  "bot_id": "bot_support",
  "channel": "facebook",
  "sender_id": "123456789",
  "sender_name": "Иван Иванов"
}
```

Supported envelope:
- direct array `[...]`
- wrapped `{ "data": [...] }`

## 3.3 `/api/bot-metrics`

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
  "chartData": []
}
```

> `recentActivity` is now built from `/api/new-user` and `/api/new-phonenumber`.

## 3.4 `/api/ai-insights`

```json
{
  "summary": "Support load increased",
  "highlights": [],
  "recommendations": []
}
```

---

## 4. FastAPI implementation example

```python
from fastapi import FastAPI, Query, Header, HTTPException
from typing import Optional

app = FastAPI()
SECRET = "optional-secret"  # in production use env var

def check_secret(x_python_shared_secret: Optional[str]):
    if SECRET and x_python_shared_secret != SECRET:
        raise HTTPException(status_code=401, detail="Invalid shared secret")

@app.get("/api/bots")
def bots(x_python_shared_secret: Optional[str] = Header(None)):
    check_secret(x_python_shared_secret)
    return [
        {"id": "bot_support", "name": "Support Bot"},
        {"id": "bot_sales", "name": "Sales Bot"},
    ]

@app.get("/api/bot-metrics")
def bot_metrics(
    period: str = Query("month"),
    date: str = Query(...),
    botId: str = Query("all"),
    x_python_shared_secret: Optional[str] = Header(None),
):
    check_secret(x_python_shared_secret)
    return {
        "messagesThisMonth": 1200,
        "totalUsers": 430,
        "phoneNumbersCaptured": 97,
        "growth": {"messages": "+12%", "users": "+7%", "phones": "+4%"},
        "chartData": []
    }

@app.get("/api/new-user")
def new_user(
    period: str = Query("month"),
    date: str = Query(...),
    botId: str = Query("all"),
    x_python_shared_secret: Optional[str] = Header(None),
):
    check_secret(x_python_shared_secret)
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
def new_phone(
    period: str = Query("month"),
    date: str = Query(...),
    botId: str = Query("all"),
    x_python_shared_secret: Optional[str] = Header(None),
):
    check_secret(x_python_shared_secret)
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
    x_python_shared_secret: Optional[str] = Header(None),
):
    check_secret(x_python_shared_secret)
    return {
        "summary": "Support load increased due to campaign traffic.",
        "highlights": [],
        "recommendations": [],
    }
```

---

## 5. Run and verify

1. Start Python API (example):
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
2. Start dashboard:
   ```bash
   npm run dev
   ```
3. Validate quickly:
   ```bash
   curl "http://127.0.0.1:8000/api/bots"
   curl "http://127.0.0.1:8000/api/bot-metrics?period=month&date=2026-04-07&botId=all"
   curl "http://127.0.0.1:8000/api/new-user?period=month&date=2026-04-07&botId=all"
   curl "http://127.0.0.1:8000/api/new-phonenumber?period=month&date=2026-04-07&botId=all"
   curl "http://127.0.0.1:8000/api/ai-insights?period=month&date=2026-04-07&botId=all"
   ```

If these return valid JSON, dashboard integration is ready.
