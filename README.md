This dashboard is a [Next.js](https://nextjs.org) App Router project that proxies metrics to your Python bot backend.

## Python Bot Integration

Set the Python service URL in `.env.local` (project root):

```bash
PYTHON_SERVER_URL=http://127.0.0.1:8000
PYTHON_SHARED_SECRET=your-shared-secret-optional
```

Available dashboard backend routes:

- `GET /api/metrics?period=month|week|day&date=YYYY-MM-DD&botId=<id|all>`
  - Proxies to `${PYTHON_SERVER_URL}/api/bot-metrics` and enriches recent activity from:
    - `${PYTHON_SERVER_URL}/api/new-user`
    - `${PYTHON_SERVER_URL}/api/new-phonenumber`
  - Response shape: `{ status: "success", data: MetricsData }`
- `POST /api/metrics`
  - Proxies command payloads to `${PYTHON_SERVER_URL}/api/bot-commands`
- `GET /api/ai-insights?period=month|week|day&date=YYYY-MM-DD&botId=<id|all>`
  - Proxies to `${PYTHON_SERVER_URL}/api/ai-insights`
  - Response shape: `{ status: "success", data: AiInsightsData }`
- `GET /api/bots`
  - Proxies to `${PYTHON_SERVER_URL}/api/bots`
  - Response shape: `{ status: "success", data: Bot[] }`

Expected Python endpoints:

- `GET /api/bot-metrics`
- `GET /api/new-user`
- `GET /api/new-phonenumber`
- `POST /api/bot-commands`
- `GET /api/ai-insights`
- `GET /api/bots`

Python endpoint query expectations:

- `botId=all` should return aggregated stats for all bots.
- `botId=<bot-id>` should return stats for a specific bot.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.








