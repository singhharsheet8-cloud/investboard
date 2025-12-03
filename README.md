# InvestBoard - Investment Dashboard

A Groww-like investment dashboard built with Next.js 14, TypeScript, and OpenRouter (GPT-5 Nano/Mini) for data fetching.

## Features

- **4 Primary Pages**: Home, Stocks, Mutual Funds, IPOs
- **Customizable Watchlist**: Support for Stocks, Mutual Funds, and IPOs
- **LLM-Powered Data Fetching**: Uses OpenRouter with GPT-5 Nano (primary) and GPT-5 Mini (fallback)
- **Indefinite Caching**: Data cached until manual refresh
- **Interactive Charts**: Built with Recharts
- **Modern UI**: shadcn/ui components with Tailwind CSS
- **Responsive Design**: Mobile and desktop optimized

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **State Management**: Zustand + SWR
- **Database**: PostgreSQL (via Prisma)
- **LLM**: OpenRouter (GPT-5 Nano/Mini)

## Quick Start

### For Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local`:
   ```env
   OPENROUTER_API_KEY=your_key_here
   OPENROUTER_MODEL_NANO=openai/gpt-5-nano
   OPENROUTER_MODEL_MINI=openai/gpt-5-mini
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   DATABASE_URL=postgresql://user:password@localhost:5432/finance_db
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Set up database:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Run dev server:**
   ```bash
   npm run dev
   ```

### For Free Public Hosting

See [SETUP.md](./SETUP.md) for complete deployment guide to Vercel (free tier).

**TL;DR:**
1. Get OpenRouter API key (free to start)
2. Set up Neon/Supabase database (free)
3. Deploy to Vercel (free)
4. Add environment variables
5. Run `npx prisma db push`
6. Done! Your app is live and free to use

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    api/                  # API routes
    stocks/               # Stocks pages
    mutual-funds/         # Mutual Funds pages
    ipo/                  # IPO pages
  components/             # React components
    layout/               # Layout components
    charts/               # Chart components
    cards/                # Card components
    common/               # Common UI components
    filters/              # Filter components
    watchlist/            # Watchlist components
  lib/                    # Utilities and libraries
    db/                   # Database repositories
    openrouter-client.ts  # OpenRouter LLM client
    prompts.ts            # LLM prompts
    types.ts              # TypeScript types
    swr-fetchers.ts       # SWR hooks
    store.ts              # Zustand store
  data/                   # Static data files
    stocks.json           # Stock list for autocomplete
    mutual-funds.json     # MF list for autocomplete
```

## API Routes

All API routes support `?refresh=true` to force a new fetch from the LLM.

- `/api/market/snapshot` - Market snapshot (Nifty, Sensex, etc.)
- `/api/stocks/[symbol]` - Stock details
- `/api/stocks/search` - Stock search
- `/api/mutual-funds/[code]` - Mutual fund details
- `/api/mutual-funds/search` - Mutual fund search
- `/api/ipo/current` - Current IPOs
- `/api/ipo/upcoming` - Upcoming IPOs
- `/api/ipo/past` - Past IPOs
- `/api/ipo/[id]` - IPO details
- `/api/watchlist/items` - Watchlist CRUD
- `/api/watchlist/preferences` - Watchlist preferences

## Caching Strategy

- **Indefinite Caching**: All data is cached in the database until manually refreshed
- **Manual Refresh**: Use the refresh button or add `?refresh=true` to API calls
- **No TTL**: Data persists until explicitly refreshed

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
```

## Notes

- The app uses anonymous user mode with localStorage-backed UUIDs
- All LLM calls use GPT-5 Nano by default, with GPT-5 Mini as fallback
- Data is fetched on-demand when users click refresh
- The project structure follows the exact specification provided

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to Vercel with free hosting.

**Quick Deploy:**
1. Push to GitHub
2. Import to Vercel
3. Add environment variables (OpenRouter API key, database URL)
4. Deploy!

The app is designed to be **completely free** to host:
- ✅ Vercel free tier (hosting)
- ✅ Neon/Supabase free tier (database)
- ✅ OpenRouter pay-per-use (very cheap with GPT-5 Nano)

## License

ISC

