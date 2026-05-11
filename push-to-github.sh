#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  LUMINARY — One-Shot GitHub Push & Deploy Guide
#  Run this file to push your project to GitHub
# ═══════════════════════════════════════════════════════════

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   LUMINARY — GitHub Push & Deploy Guide  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── STEP 1: Initialize git ─────────────────────────────────
echo "▸ Step 1: Initialize Git repository"
git init
git add .
git commit -m "feat: initial commit — LUMINARY Urban Intelligence Platform

- Full Next.js 14 App Router structure
- PostgreSQL schema with 8 models (City, District, Zone, MobilityEvent, AirQualityLog, Anomaly, SentimentLog, RiskSnapshot)
- Prisma ORM with realistic seed data (100k+ records)
- Advanced SQL: window functions, CTEs, triggers, stored procedures
- REST API: /api/analytics, /api/zones, /api/mobility, /api/anomalies
- Landing page with Framer Motion animations
- Analytics dashboard with live data refresh
- Soft-luxury design system with glassmorphism
- Editorial 3-font stack: Cormorant Garamond + Syne + DM Mono"

echo "✅ Git initialized and first commit created"
echo ""

# ── STEP 2: Create GitHub repo ─────────────────────────────
echo "▸ Step 2: Create GitHub repository"
echo "   → Go to: https://github.com/new"
echo "   → Repo name: luminary"
echo "   → Description: 🏙️ Full-stack Urban Intelligence Platform — Next.js 14, PostgreSQL (CTEs, triggers, window functions), Prisma, Framer Motion, GSAP"
echo "   → Visibility: Public"
echo "   → DO NOT check 'Initialize repository' (you already have one)"
echo ""
read -p "   Press ENTER once you've created the empty GitHub repo..."
echo ""

# ── STEP 3: Connect and push ───────────────────────────────
echo "▸ Step 3: Connect remote and push"
echo ""
read -p "   Enter your GitHub username: " GITHUB_USER
echo ""

git remote add origin "https://github.com/$GITHUB_USER/luminary.git"
git branch -M main
git push -u origin main

echo ""
echo "✅ Code pushed to: https://github.com/$GITHUB_USER/luminary"
echo ""

# ── STEP 4: Deploy to Vercel ───────────────────────────────
echo "▸ Step 4: Deploy to Vercel"
echo ""
echo "   Option A — Vercel Dashboard (recommended):"
echo "   1. Go to https://vercel.com/new"
echo "   2. Import your GitHub repo: $GITHUB_USER/luminary"
echo "   3. Add environment variables:"
echo "      DATABASE_URL     = your Neon/Supabase connection string"
echo "      NEXTAUTH_SECRET  = $(openssl rand -base64 32 2>/dev/null || echo 'run: openssl rand -base64 32')"
echo "      NEXTAUTH_URL     = https://your-project.vercel.app"
echo "      NEXT_PUBLIC_APP_URL = https://your-project.vercel.app"
echo "   4. Click Deploy!"
echo ""
echo "   Option B — Vercel CLI:"
echo "   npm install -g vercel"
echo "   vercel --prod"
echo ""

# ── STEP 5: GitHub repo polish ─────────────────────────────
echo "▸ Step 5: Polish your GitHub repo"
echo ""
echo "   Add these topics to your repo (Settings → Topics):"
echo "   nextjs postgresql data-analytics urban-intelligence framer-motion"
echo "   prisma typescript smart-city gsap tailwindcss analytics-dashboard"
echo "   window-functions cohort-analysis anomaly-detection portfolio"
echo ""
echo "   Add a social preview image (Settings → Social Preview):"
echo "   → Take a screenshot of the dashboard"
echo "   → Upload as the repo's social preview (1280×640px)"
echo ""

echo "╔══════════════════════════════════════════╗"
echo "║          🎉 ALL DONE! LUMINARY IS LIVE   ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  GitHub: https://github.com/$GITHUB_USER/luminary"
echo "  Vercel: https://luminary.vercel.app (after deploy)"
echo ""
echo "  → Pin this repo on your GitHub profile"
echo "  → Add to LinkedIn featured projects"
echo "  → Include in your resume portfolio section"
echo ""
