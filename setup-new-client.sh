#!/bin/bash

# Setup New Auction Client
# Usage: ./setup-new-client.sh client-name

set -e

CLIENT_NAME=$1

if [ -z "$CLIENT_NAME" ]; then
    echo "❌ Error: Please provide a client name"
    echo "Usage: ./setup-new-client.sh client-name"
    exit 1
fi

echo "🚀 Setting up auction site for: $CLIENT_NAME"
echo "================================================"

# Step 1: Clone repository
echo ""
echo "📦 Step 1: Cloning repository..."
git clone --depth 1 https://github.com/Zrodkin/Wilkesbid auction-$CLIENT_NAME
cd auction-$CLIENT_NAME
rm -rf .git

# Step 2: Initialize new git repo
echo ""
echo "🔧 Step 2: Initializing new repository..."
git init
git add .
git commit -m "Initial commit for $CLIENT_NAME"

# Step 3: Create GitHub repo (optional - requires gh CLI)
echo ""
read -p "Create GitHub repository? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating GitHub repo..."
    gh repo create auction-$CLIENT_NAME --private --source=. --remote=origin --push
fi

# Step 4: Setup environment file
echo ""
echo "📝 Step 3: Creating environment file..."
cp .env.template .env.local

echo ""
echo "✅ Repository setup complete!"
echo ""
echo "================================================"
echo "NEXT STEPS:"
echo "================================================"
echo ""
echo "1️⃣  CREATE SUPABASE PROJECT"
echo "   → Go to: https://supabase.com/dashboard"
echo "   → Create new project for: $CLIENT_NAME"
echo "   → Copy the URL and keys"
echo ""
echo "2️⃣  RUN DATABASE MIGRATIONS"
echo "   → In Supabase SQL Editor, run: supabase/migrations/00000000000000_initial_schema.sql"
echo "   → Then run: supabase/seed.sql"
echo ""
echo "3️⃣  CONFIGURE ENVIRONMENT VARIABLES"
echo "   → Edit .env.local with your Supabase credentials"
echo "   → Generate new JWT_SECRET: openssl rand -base64 32"
echo "   → Set ADMIN_PASSWORD"
echo "   → Add Stripe keys (optional)"
echo "   → Add Resend API key (optional)"
echo ""
echo "4️⃣  TEST LOCALLY"
echo "   → npm install"
echo "   → npm run dev"
echo "   → Visit: http://localhost:3000"
echo ""
echo "5️⃣  DEPLOY TO VERCEL"
echo "   → vercel"
echo "   → Add environment variables in Vercel dashboard"
echo "   → vercel --prod"
echo ""
echo "================================================"
echo "📚 For detailed instructions, see: DEPLOYMENT.md"
echo "================================================"