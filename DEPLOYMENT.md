# Deployment Guide - Free Hosting Setup

This guide will help you deploy InvestBoard to Vercel (free tier) with a free PostgreSQL database.

## Prerequisites

- GitHub account (for Vercel deployment)
- OpenRouter API key (get one at https://openrouter.ai)

## Step 1: Set Up Free PostgreSQL Database

### Option A: Neon (Recommended)

1. Go to [Neon](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (it will look like: `postgresql://user:password@host/dbname`)
4. Save this for Step 3

### Option B: Supabase

1. Go to [Supabase](https://supabase.com) and sign up
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string under "Connection string" > "URI"
5. Save this for Step 3

## Step 2: Deploy to Vercel

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. Go to [Vercel](https://vercel.com) and sign up/login with GitHub

3. Click "New Project" and import your GitHub repository

4. Vercel will auto-detect Next.js - click "Deploy"

5. **Before deployment completes**, go to Project Settings > Environment Variables and add:

   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL_NANO=openai/gpt-5-nano
   OPENROUTER_MODEL_MINI=openai/gpt-5-mini
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   DATABASE_URL=your_neon_or_supabase_connection_string
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

6. After adding environment variables, go to Deployments tab and redeploy the latest deployment

## Step 3: Set Up Database Schema

After your first deployment:

1. Go to your Vercel project dashboard
2. Open the deployment logs or use Vercel CLI:

   ```bash
   npm install -g vercel
   vercel login
   vercel link
   ```

3. Run database migrations:

   ```bash
   # This will use the DATABASE_URL from Vercel environment variables
   npx prisma db push
   ```

   Or use Vercel's built-in terminal or connect via SSH to run:
   ```bash
   npm run db:push
   ```

## Step 4: Verify Deployment

1. Visit your Vercel deployment URL
2. Test the market snapshot refresh
3. Try searching for stocks/mutual funds
4. Verify data is being cached

## Free Tier Limits

### Vercel Free Tier:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless functions (generous limits)
- ✅ Automatic HTTPS
- ✅ Custom domains

### Neon Free Tier:
- ✅ 0.5 GB storage
- ✅ Unlimited projects
- ✅ Auto-suspend after 5 min inactivity (auto-resumes)

### Supabase Free Tier:
- ✅ 500 MB database
- ✅ 2 GB bandwidth
- ✅ Unlimited API requests

### OpenRouter:
- Pay-per-use (very cheap with GPT-5 Nano)
- No monthly fees
- ~$0.0001 per request with Nano

## Cost Estimate

**Monthly cost: ~$0-5**
- Vercel: Free
- Database: Free (Neon/Supabase)
- OpenRouter: ~$0.01-5/month depending on usage (Nano is very cheap)

## Troubleshooting

### Database Connection Issues

If you see database connection errors:
1. Check your `DATABASE_URL` in Vercel environment variables
2. Ensure your database allows connections from Vercel IPs (Neon/Supabase do this automatically)
3. Check database is not paused (Neon auto-pauses after inactivity)

### API Route Errors

If LLM calls fail:
1. Verify `OPENROUTER_API_KEY` is set correctly
2. Check OpenRouter dashboard for API usage/limits
3. Ensure model IDs are correct (`openai/gpt-5-nano`, `openai/gpt-5-mini`)

### Build Errors

If build fails:
1. Check that all dependencies are in `package.json`
2. Ensure Prisma client is generated: `npm run db:generate`
3. Check build logs in Vercel dashboard

## Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` environment variable

## Monitoring

- Vercel Analytics: Built-in (free tier available)
- Database: Use Neon/Supabase dashboards
- OpenRouter: Check usage dashboard

## Updates

To update the app:
1. Push changes to GitHub
2. Vercel automatically deploys
3. If schema changes, run `npx prisma db push` via Vercel CLI or terminal

