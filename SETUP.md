# One-Time Setup Guide

This guide helps you set up InvestBoard for free public hosting.

## Quick Start (5 minutes)

### 1. Get OpenRouter API Key (Free to start)

1. Go to https://openrouter.ai
2. Sign up (free)
3. Get your API key from the dashboard
4. Add credits (minimum $5, but GPT-5 Nano is very cheap - ~$0.0001 per request)

### 2. Set Up Free Database

**Option A: Neon (Recommended - Easiest)**
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create new project
4. Copy the connection string (starts with `postgresql://`)

**Option B: Supabase**
1. Go to https://supabase.com
2. Sign up with GitHub
3. Create new project
4. Go to Settings > Database > Connection string (URI)

### 3. Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # Create a new repo on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Sign up with GitHub
   - Click "New Project"
   - Import your repository
   - Click "Deploy" (don't add env vars yet)

3. **Add Environment Variables:**
   - In Vercel project, go to Settings > Environment Variables
   - Add these:
     ```
     OPENROUTER_API_KEY=your_key_here
     OPENROUTER_MODEL_NANO=openai/gpt-5-nano
     OPENROUTER_MODEL_MINI=openai/gpt-5-mini
     OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
     DATABASE_URL=your_neon_or_supabase_connection_string
     NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
     ```
   - **Important:** Replace `NEXT_PUBLIC_APP_URL` with your actual Vercel URL after first deployment

4. **Set Up Database Schema:**
   - After first deployment, go to your Vercel project
   - Use Vercel CLI or connect via terminal:
     ```bash
     npm install -g vercel
     vercel login
     vercel link
     vercel env pull .env.local  # Pull env vars locally
     npx prisma db push
     ```

5. **Redeploy:**
   - Go to Deployments tab
   - Click "..." on latest deployment > "Redeploy"

### 4. Test Your Deployment

1. Visit your Vercel URL
2. Click "Refresh" on Market Snapshot
3. Try searching for a stock or mutual fund
4. Verify data loads correctly

## Cost Breakdown

**One-Time Setup:**
- OpenRouter: $5 minimum credit (lasts months with Nano)

**Monthly Costs:**
- Vercel: **$0** (free tier)
- Database: **$0** (Neon/Supabase free tier)
- OpenRouter: **~$0.01-5/month** (depends on usage, Nano is very cheap)

**Total: ~$0-5/month** (mostly free!)

## Security Notes

✅ **API keys are server-side only** - Users never see your OpenRouter key
✅ **Database is private** - Only your Vercel app can access it
✅ **No user authentication needed** - Uses anonymous localStorage IDs
✅ **Free tier limits are generous** - Should handle hundreds of users

## Troubleshooting

**"Database connection failed"**
- Check DATABASE_URL is correct
- Ensure database isn't paused (Neon auto-resumes)
- Check database allows connections from Vercel

**"OpenRouter API error"**
- Verify OPENROUTER_API_KEY is correct
- Check you have credits in OpenRouter dashboard
- Ensure model IDs are correct

**"Build failed"**
- Check all environment variables are set
- Ensure Prisma client generates: `npm run db:generate`
- Check build logs in Vercel dashboard

## Making It Public

Once deployed:
1. Share your Vercel URL with anyone
2. No sign-up required - works immediately
3. Each user gets anonymous ID (stored in their browser)
4. All data is cached server-side (shared across users)
5. Users can refresh to get latest data

## Custom Domain (Optional)

1. In Vercel: Settings > Domains
2. Add your domain
3. Follow DNS setup instructions
4. Update `NEXT_PUBLIC_APP_URL` environment variable

## Monitoring

- **Vercel:** Check deployment logs and analytics
- **Database:** Use Neon/Supabase dashboard
- **OpenRouter:** Monitor usage and costs in dashboard

## Updates

To update the app:
1. Make changes locally
2. Push to GitHub: `git push`
3. Vercel auto-deploys
4. If database schema changes, run `npx prisma db push` via Vercel CLI

