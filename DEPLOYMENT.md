# Auction Site Deployment Guide

Complete guide for deploying this auction platform for a new client.

## Prerequisites

- Node.js 18+ installed
- Git installed
- GitHub account
- Supabase account
- Vercel account
- (Optional) Stripe account for payments
- (Optional) Resend account for emails

## Quick Start

```bash
# 1. Clone and setup
./setup-new-client.sh client-name

# 2. Follow the prompts
# 3. Complete manual steps below
```

---

## Manual Setup Steps

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name:** Client Name Auction
   - **Database Password:** (generate strong password)
   - **Region:** Choose closest to client
4. Wait for project to be ready (~2 minutes)

### 2. Run Database Migrations

1. In Supabase, go to **SQL Editor**
2. Create new query
3. Copy entire contents of `supabase/migrations/00000000000000_initial_schema.sql`
4. Paste and click **"Run"**
5. Verify success (should see all tables created)
6. Run `supabase/seed.sql` for default holiday templates

### 3. Get Supabase Credentials

1. In Supabase project, go to **Settings** → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 4. Configure Environment Variables

Create `.env.local` from template:

```bash
cp .env.template .env.local
```

Fill in all required values:

```bash
# Supabase (from step 3)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Generate JWT secret
openssl rand -base64 32
# Paste result into:
JWT_SECRET=your-generated-secret

# Set admin password
ADMIN_PASSWORD=YourSecurePassword123

# Resend (if using email notifications)
RESEND_API_KEY=re_xxx
EMAIL_FROM=auction@yourclient.com

# Stripe (if accepting payments)
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_CLIENT_ID=ca_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx (after webhook setup)

# Will update after Vercel deployment
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
```

### 5. Test Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Visit http://localhost:3000
```

**Test these features:**
- ✅ Home page loads
- ✅ Admin login at `/admin/login`
- ✅ Create auction (admin panel)
- ✅ Place bid (public page)

### 6. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? auction-client-name
# - Directory? ./
# - Override settings? No

# After successful deployment, add env vars:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add JWT_SECRET
vercel env add ADMIN_PASSWORD
# ... add all others from .env.local

# Deploy to production
vercel --prod
```

#### Option B: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework:** Next.js (auto-detected)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
5. Add **Environment Variables** (all from `.env.local`)
6. Click **"Deploy"**

### 7. Update Site URLs

After Vercel deployment:

1. Copy your production URL (e.g., `https://auction-client.vercel.app`)
2. Update in Vercel:
   ```
   NEXT_PUBLIC_SITE_URL=https://your-production-url.vercel.app
   SITE_URL=https://your-production-url.vercel.app
   ```
3. Redeploy: `vercel --prod`

### 8. Setup Stripe Webhook (If Using Payments)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter: `https://your-production-url.vercel.app/api/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy **Signing secret**
6. Add to Vercel env vars:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```
7. Redeploy

### 9. Setup Custom Domain (Optional)

1. In Vercel project → **Settings** → **Domains**
2. Add custom domain (e.g., `auction.clientdomain.com`)
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)
5. Update `SITE_URL` with custom domain

---

## Post-Deployment Checklist

- [ ] Auction homepage loads correctly
- [ ] Admin login works (`/admin/login`)
- [ ] Can create new auction
- [ ] Can place bids
- [ ] Realtime updates work
- [ ] Email notifications sent (if configured)
- [ ] Stripe payments work (if configured)
- [ ] Stripe Connect works (admin can link account)
- [ ] Mobile responsive design
- [ ] Custom domain configured (if applicable)

---

## Customization

### Branding

Update these files for client branding:

1. **Logo:** Replace `/public/bais-menachem-logo.png`
2. **Organization Name:** Search/replace "Bais Menachem" in:
   - `app/page.tsx`
   - `app/admin/login/page.tsx`
3. **Colors:** Update in `app/globals.css`:
   ```css
   /* Primary gold color */
   --primary: #C9A961; /* Change to client's brand color */
   ```
4. **Contact Info:** Update footer in `app/page.tsx`:
   - Address
   - Phone number
   - Social media links
5. **Email Sender:** Update `EMAIL_FROM` in environment variables
6. **Site Title:** Update in `app/layout.tsx`

### Default Holiday Templates

Edit `supabase/seed.sql` to add client-specific holidays:

```sql
INSERT INTO holiday_templates (name, services) VALUES
('Custom Holiday', ARRAY['Service 1', 'Service 2', 'Service 3'])
ON CONFLICT (name) DO NOTHING;
```

---

## Troubleshooting

### Supabase Connection Issues

**Problem:** "Failed to connect to Supabase"

**Solution:**
1. Verify `.env.local` has correct Supabase URL and keys
2. Check Supabase project is active (not paused)
3. Verify RLS policies are set (should be permissive for MVP)

### Admin Login Not Working

**Problem:** "Invalid password"

**Solution:**
1. Verify `ADMIN_PASSWORD` in environment variables
2. Check `JWT_SECRET` is set correctly
3. Clear cookies and try again
4. Verify admin auth route works: `/api/admin/auth`

### Stripe Payments Failing

**Problem:** "Stripe not connected"

**Solution:**
1. Admin must connect Stripe account via dashboard
2. Check `STRIPE_SECRET_KEY` and `STRIPE_CLIENT_ID` are correct
3. Verify webhook is configured with correct URL
4. Check Stripe account has payments enabled

### Email Notifications Not Sending

**Problem:** Outbid emails not received

**Solution:**
1. Verify `RESEND_API_KEY` is valid
2. Check `EMAIL_FROM` domain is verified in Resend
3. Look for errors in Vercel logs
4. Check `email_log` table in Supabase for failures

### Realtime Updates Not Working

**Problem:** Bids don't update in real-time

**Solution:**
1. Check browser console for Supabase realtime errors
2. Verify Supabase project has realtime enabled
3. Check if multiple browser tabs are open (can cause issues)
4. Refresh page

---

## Maintenance

### Viewing Logs

**Vercel Logs:**
```bash
vercel logs --follow
```

**Supabase Logs:**
- Dashboard → Logs → Select log type

### Database Backups

Supabase automatically backs up daily. Manual backup:

1. Supabase Dashboard → Database → Backups
2. Click "Create backup"
3. Download SQL dump if needed

### Updating Code

```bash
# Pull latest from template
cd auction-client-name
git remote add template https://github.com/Zrodkin/Wilkesbid
git fetch template
git merge template/main

# Resolve conflicts if any
# Test locally
npm run dev

# Deploy
vercel --prod
```

---

## Security Notes

⚠️ **Never commit sensitive data:**
- `.env.local` is in `.gitignore` - keep it that way
- Never share `SUPABASE_SERVICE_ROLE_KEY` publicly
- Use strong `ADMIN_PASSWORD` and `JWT_SECRET`
- Use Stripe **test keys** for development
- Enable Stripe **live mode** only when ready for production

---

## Support

**Issues with this template:**
- Check existing issues: [GitHub Issues](https://github.com/Zrodkin/Wilkesbid/issues)
- Create new issue with detailed description

**Supabase Issues:**
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Support](https://supabase.com/support)

**Vercel Issues:**
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)

**Stripe Issues:**
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

---

## Quick Reference

### Common Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# View logs
vercel logs --follow

# Add environment variable
vercel env add VARIABLE_NAME

# Generate JWT secret
openssl rand -base64 32
```

### Important URLs

- **Admin Login:** `https://your-site.com/admin/login`
- **Admin Dashboard:** `https://your-site.com/admin`
- **Public Auction:** `https://your-site.com`
- **Supabase Dashboard:** `https://supabase.com/dashboard/project/YOUR-PROJECT`
- **Vercel Dashboard:** `https://vercel.com/your-account/auction-project`

---

## Next Steps After Deployment

1. ✅ Test complete auction flow
2. ✅ Add custom domain (if applicable)
3. ✅ Customize branding (logo, colors, text)
4. ✅ Setup email templates (if needed)
5. ✅ Configure Stripe Connect for payments
6. ✅ Train client on admin dashboard
7. ✅ Create user documentation
8. ✅ Schedule regular backups
9. ✅ Monitor error logs
10. ✅ Plan for high-traffic events

---

## Architecture Overview

```
┌─────────────────┐
│   Vercel        │
│   (Next.js)     │
│                 │
│   - Frontend    │
│   - API Routes  │
│   - SSR         │
└────────┬────────┘
         │
         ├─────────► Supabase (Database + Auth + Realtime)
         │
         ├─────────► Stripe (Payments via Connect)
         │
         └─────────► Resend (Email Notifications)
```

**Key Technologies:**
- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Realtime:** Supabase Realtime
- **Payments:** Stripe + Stripe Connect
- **Email:** Resend
- **Hosting:** Vercel
- **Styling:** Tailwind CSS + shadcn/ui

---

## License

This template is proprietary. Each deployment is licensed per client.