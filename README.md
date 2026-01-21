# FitCSV

A focused strength training tracker that lets you import programs from CSV and track workouts without rigid app constraints.

## Quick Start

Want to run FitCSV locally? You have two options for the database: use Supabase (cloud, includes auth) or run PostgreSQL locally in Docker (simpler, no account needed).

### Prerequisites

- **Node.js 20+**
- **Database**: Choose one:
  - **Option A**: Supabase account (free tier) - [Sign up here](https://supabase.com)
  - **Option B**: Docker Desktop (for local PostgreSQL)

### 1. Set Up Your Database

#### Option A: Supabase (Includes Auth)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project
2. Wait for database to provision (~2 minutes)
3. Collect your credentials:
   - **Settings → Database**: Copy both connection strings
     - "Connection pooling" URL (port 6543) → `DATABASE_URL`
     - "Direct connection" URL (port 5432) → `DIRECT_URL`
   - **Settings → API**: Copy your credentials
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Option B: Local PostgreSQL (Docker)

```bash
# Start PostgreSQL in Docker (using port 5433 to avoid conflicts)
docker run -d \
  --name fitcsv-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fitcsv \
  -p 5433:5432 \
  postgres:15

# Your connection strings will be:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5433/fitcsv"
# DIRECT_URL="postgresql://postgres:postgres@localhost:5433/fitcsv"
```

**Note**: With local PostgreSQL, you still need Supabase Auth credentials for user authentication. The Docker database only stores your workout data locally.

### 2. Configure Environment Variables

Choose between Doppler (recommended) or a simple `.env` file:

#### Option A: Using Doppler (Recommended)

```bash
# Install Doppler CLI
brew install dopplerhq/cli/doppler  # macOS
# or visit: https://docs.doppler.com/docs/install-cli

# Login and setup
doppler login
doppler setup  # Create your own project + config

# For Supabase:
doppler secrets set DATABASE_URL="postgresql://postgres.xxxx:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
doppler secrets set DIRECT_URL="postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres"
doppler secrets set NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
doppler secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# For Local PostgreSQL:
doppler secrets set DATABASE_URL="postgresql://postgres:postgres@localhost:5433/fitcsv"
doppler secrets set DIRECT_URL="postgresql://postgres:postgres@localhost:5433/fitcsv"
doppler secrets set NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"  # Still needed for auth
doppler secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."  # Still needed for auth

# Common settings:
doppler secrets set NODE_ENV="development"
doppler secrets set NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Option B: Using .env File (Simpler)

**⚠️ Important: Check for existing `.env` files first!**

Next.js loads environment variables in this order (later files override earlier):
1. `.env`
2. `.env.local`
3. `.env.development`
4. `.env.development.local`

If you have existing `.env.local` or other env files, they will override `.env`. **You must update ALL existing env files** to point to the same database.

```bash
# Check for existing env files
ls -la .env*

# If you see .env.local, .env.development, etc., update them ALL
# or delete them to use only .env

# Copy the example file
cp .env.example .env

# Edit .env and configure for your database choice:
# - See comments in .env.example for Supabase vs Local PostgreSQL
# - Uncomment the option you're using
```

### 3. Install Dependencies & Setup Database

```bash
# Install packages
npm install

# With Doppler:
doppler run -- npx prisma generate
doppler run -- npx prisma migrate dev --name init

# With .env file:
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Start Development

```bash
# With Doppler:
doppler run -- npm run dev

# With .env file:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**First time?** Create an account at `/signup`, confirm your email, and start tracking workouts!

## Development Commands

Commands shown with Doppler prefix. If using `.env` file, omit `doppler run --`.

```bash
# Development
doppler run -- npm run dev              # Start dev server
doppler run -- npx prisma studio        # Database GUI (browse your data)

# Database Operations
doppler run -- npx prisma migrate dev --name feature_name   # Create migration
doppler run -- npx prisma db push                           # Quick prototype (no migration files)
doppler run -- npx prisma generate                          # Regenerate Prisma client
doppler run -- npx prisma db seed                           # Seed sample data

# Testing & Quality
doppler run -- npm test                 # Run tests
npm run lint                            # Run ESLint
npm run type-check                      # TypeScript check
npm run build                           # Production build test
```

## CSV Import Format

```csv
week,day,workout_name,exercise,set,reps,weight,rir,notes
1,1,Upper Power,Bench Press,1,5,135lbs,2,
1,1,Upper Power,Bench Press,2,5,135lbs,2,
1,1,Upper Power,Rows,1,8,95lbs,2,Pause at chest
```

**Required columns**: `week`, `day`, `workout_name`, `exercise`, `set`, `reps`, `weight`
**Optional columns**: `rir`, `rpe`, `notes` (auto-detected)

## Project Structure

```
/app                    # Next.js App Router
  /api                  # API routes
  /(auth)               # Auth pages
  /(app)                # Main app
/lib                    # Business logic
  /supabase/            # Supabase clients
  db.ts                 # Prisma client
/components             # React components
/prisma                 # Database schema & migrations
/docs                   # Architecture docs
```

## Deployment

Vercel deployment is configured via Doppler integration:

1. Connect Doppler to Vercel in Doppler dashboard
2. Link Doppler configs to Vercel environments:
   - `dev` → Vercel Preview
   - `production` → Vercel Production
3. Push to git - Vercel auto-deploys

All secrets sync automatically from Doppler to Vercel.

## Troubleshooting

### "Column does not exist in the current database"

This usually means your `.env.local` file is overriding your `.env` and pointing to a different database:

```bash
# Check which database URLs are set
cat .env
cat .env.local  # This overrides .env!

# Update .env.local to match, or delete it
rm .env.local

# Clear caches and regenerate Prisma client
rm -rf .next node_modules/.prisma
npx prisma generate

# Restart dev server
npm run dev
```

### "Cannot find module '.prisma/client/default'"

The Prisma client wasn't fully generated:

```bash
# Remove and regenerate
rm -rf node_modules/.prisma node_modules/@prisma/client
npx prisma generate
```

### Switching Between Databases

If you switch from one database to another (e.g., local PostgreSQL to Supabase):

```bash
# 1. Update ALL .env files to point to new database
vi .env
vi .env.local  # If it exists

# 2. Clear caches
rm -rf .next node_modules/.prisma

# 3. Regenerate Prisma client
npx prisma generate

# 4. Apply schema to new database
npx prisma db push

# 5. Restart dev server
npm run dev
```

## Contributing

Interested in contributing? Check out [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- How to submit pull requests
- Code standards and conventions
- Current project limitations
- Testing requirements

## Documentation

- [docs/STYLING.md](docs/STYLING.md) - DOOM theme color system
- [docs/features/CARDIO_DESIGN.md](docs/features/CARDIO_DESIGN.md) - Cardio tracking system design
- [docs/features/EXERCISE_PERFORMANCE_TRACKING.md](docs/features/EXERCISE_PERFORMANCE_TRACKING.md) - Exercise tracking features
- [CLAUDE.md](CLAUDE.md) - Guide for Claude Code sessions

## Tech Stack

- **Next.js 15** - React framework with App Router
- **Supabase** - PostgreSQL database + Auth + RLS
- **Prisma** - Type-safe ORM
- **Doppler** - Secrets management
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
- **Vercel** - Deployment

## License

MIT
