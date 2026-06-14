# SEO Audit Tool — Frontend

Next.js 14 TypeScript frontend for the SEO Audit Tool.

## Local Setup

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local if your backend runs on a different port
npm run dev
# Visit http://localhost:3000
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL — `http://localhost:8000` locally, Railway URL in production |

## Deploy to Vercel

1. Push this repo to GitHub (`AI-CrescentGroup/seo-audit-tool-frontend`)
2. vercel.com → Import → select repo
3. Add env var: `NEXT_PUBLIC_API_URL` = your Railway backend URL
4. Deploy — zero extra config needed
