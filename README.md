# Axiom — find the best AI model for any job

A live "best AI models for X" finder with a futuristic AI interface. It ranks 300+ LLMs by intelligence, coding, speed, latency, price and context, across 22 use-case rankings. It also has a sortable leaderboard, model profiles, side-by-side comparison, lab pages and a free JSON API.

Built with Next.js 15, React 19, TypeScript and Tailwind CSS 4.

## Data

| What | Source | Key needed? |
|---|---|---|
| Model list, prices, context, capabilities | OpenRouter public catalog | No |
| Intelligence / Coding / Math index, GPQA, speed, latency | Artificial Analysis API | Free key (optional) |

- **Without** the Artificial Analysis key, rankings use the transparent *Axiom Score* heuristic and the site shows a "Heuristic mode" notice.
- If OpenRouter can't be reached, the site falls back to clearly labelled **illustrative sample data** (`lib/sample.ts`). It retries the live catalog after 1 minute.
- Data refreshes hourly (ISR).

## Run locally

```bash
npm install
cp .env.example .env.local   # add your keys
npm run dev                  # http://localhost:3000
```

## Rebrand

Edit `lib/site.ts` (name, tagline, description). Colours live in `app/globals.css` under `@theme`. The logo is in `components/ui.tsx` and `app/icon.svg`.

## Add or change a ranking

Each ranking is one entry in `COLLECTIONS` in `lib/collections.ts`. An entry has a slug, a title, a filter and a metric. A new entry automatically gets its page at `/best-models-for/<slug>` plus per-lab pages, and is added to the sitemap and the API.

## Deploy to your domain (Vercel, recommended)

1. Push this repo to GitHub.
2. In Vercel, click **Add New… → Project** and import the repo. The framework is auto-detected as Next.js.
3. Under **Environment Variables**, add `NEXT_PUBLIC_SITE_URL` (your domain, e.g. `https://yourdomain.com`) and, optionally, `ARTIFICIAL_ANALYSIS_API_KEY`.
4. Click **Deploy**.
5. Go to **Project → Settings → Domains**, add your domain and set the DNS records Vercel shows at your registrar.

Any Node host also works: run `npm run build` and then `npm start`.

## Routes

- `/` — home, search and top 10
- `/best-models-for` and `/best-models-for/[use-case]/[lab?]`
- `/leaderboard` — every model, sortable and filterable
- `/models/[slug]` — model profile
- `/compare?m=a,b,c` — up to 4 models side by side
- `/makers` and `/makers/[lab]`
- `/methodology` and `/api-docs`
- `/api/v1/models`, `/api/v1/models/[slug]`, `/api/v1/rankings/[collection]?maker=`

## Attribution

Model data comes from OpenRouter, and benchmark data from Artificial Analysis. Keep the attribution in the footer and check each provider's terms before commercial use.
