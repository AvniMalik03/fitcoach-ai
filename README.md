# FitCoach AI — Personalised AI Fitness & Nutrition Coach

A production-ready AI Fitness & Nutrition Coach application built with Next.js 15, Auth.js v5, Prisma, and Tailwind CSS.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in secrets
cp .env.example .env

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Folder Structure

```
├── prisma/
│   └── schema.prisma          # Database schema (SQLite)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/         # /login — sign-in page
│   │   │   └── signup/        # /signup — registration page
│   │   ├── api/auth/          # Auth.js v5 route handler
│   │   ├── dashboard/         # Protected dashboard routes
│   │   │   ├── layout.tsx     # Dashboard shell (sidebar + navbar)
│   │   │   ├── page.tsx       # /dashboard — overview
│   │   │   ├── workout/       # /dashboard/workout
│   │   │   ├── nutrition/     # /dashboard/nutrition
│   │   │   ├── progress/      # /dashboard/progress
│   │   │   └── settings/      # /dashboard/settings
│   │   ├── privacy/           # /privacy
│   │   ├── terms/             # /terms
│   │   ├── globals.css        # Global styles + CSS variables
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # / — landing page
│   ├── components/
│   │   ├── auth/              # LoginForm, SignUpForm
│   │   ├── dashboard/         # Sidebar, DashboardNavbar
│   │   ├── navbar.tsx         # Marketing navbar
│   │   ├── providers.tsx      # SessionProvider
│   │   ├── theme-provider.tsx # next-themes wrapper
│   │   └── theme-toggle.tsx   # Light/dark toggle button
│   ├── lib/
│   │   ├── actions/auth.ts    # Server actions (register, login)
│   │   ├── validations/auth.ts # Zod schemas
│   │   ├── password.ts        # bcrypt utilities
│   │   ├── prisma.ts          # Prisma singleton
│   │   └── utils.ts           # cn() utility
│   ├── types/
│   │   └── next-auth.d.ts     # Auth.js type augmentation
│   ├── auth.ts                # Auth.js v5 configuration
│   └── middleware.ts          # Route protection middleware
├── personalised-ai-fitness-coach/   # 📚 Project documentation (untouched)
│   ├── day1-onboarding/
│   ├── day2-workout-engine/
│   ├── day3-nutrition-engine/
│   ├── day4-adaptive-loop/
│   ├── day5-dashboard/
│   ├── day6-injury-module/
│   ├── day7-final-report/
│   └── assets/
└── ...config files
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Auth.js v5 (NextAuth) |
| Database | Prisma + SQLite |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |
| Icons | Lucide React |
| Themes | next-themes |

## 🔐 Auth.js v5

This app uses **Auth.js v5** (NextAuth v5) with the Credentials provider. Route protection is handled via `src/middleware.ts`.

Key files:
- `src/auth.ts` — main config with providers and callbacks
- `src/middleware.ts` — protects `/dashboard/*` routes

## 🗄️ Database

SQLite via Prisma for development. To switch to PostgreSQL for production, update `DATABASE_URL` in `.env` and change `provider = "postgresql"` in `prisma/schema.prisma`.
