# FinancePro — Financial Management Dashboard

A comprehensive full-stack financial management application built with Next.js 15, Drizzle ORM, PostgreSQL, and Better Auth. Manage expenses, income, assets, investments, and reports in one place.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Authentication | Better Auth |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Charts | Recharts |
| Containerization | Docker + Docker Compose |

---

## Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Docker Desktop** — [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) (required for the database)
- **npm** (comes with Node.js)

Verify your versions:

```bash
node -v    # should be 18+
npm -v
docker -v
```

---

## Option A — Local Development (Recommended)

This runs the Next.js app locally with a PostgreSQL database in Docker.

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy the example env file:

```bash
cp .env.example .env
```

The default `.env` values work out of the box with the dev Docker setup. No changes needed for local development:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/postgres
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

BETTER_AUTH_SECRET=your_secret_key_here   # change this to any random string
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

> **Note:** Generate a secure secret with: `openssl rand -base64 32`

### 3. Start the database

```bash
npm run db:dev
```

This starts a PostgreSQL container on port **5433** using Docker. The container is named `codeguide-starter-fullstack-postgres-dev`.

Verify it's running:

```bash
docker ps
```

### 4. Push the database schema

```bash
npm run db:push
```

This creates all tables in the database:
- `user`, `session`, `account`, `verification` (auth tables)
- `categories`, `transactions` (expense/income management)
- `assets` (asset catalog)
- `investments` (investment portfolio)

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create your account

Navigate to [http://localhost:3000/sign-up](http://localhost:3000/sign-up) and register. You will be redirected to the dashboard automatically.

---

## Option B — Full Docker (Production-like)

This runs both the Next.js app and database in Docker containers.

### 1. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and update:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/postgres
BETTER_AUTH_SECRET=your-strong-random-secret
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

> **Important:** Use `@postgres:5432` (not `localhost:5433`) as the hostname inside Docker.

### 2. Build and start all containers

```bash
npm run docker:up
```

This starts:
- `postgres` container on port 5432 (internal)
- `app` container on port 3000

### 3. Push the schema (first time only)

```bash
# Run inside the app container
docker exec -it codeguide-starter-fullstack-app npm run db:push
```

### 4. Open the app

[http://localhost:3000](http://localhost:3000)

### Useful Docker commands

```bash
npm run docker:logs    # follow container logs
npm run docker:down    # stop all containers
npm run docker:build   # rebuild the app image
```

---

## Application Pages

| URL | Description |
|---|---|
| `/` | Landing page |
| `/sign-up` | Create account |
| `/sign-in` | Log in |
| `/dashboard` | Overview: metrics, chart, recent transactions |
| `/dashboard/expenses` | Expense tracking with categories and pie chart |
| `/dashboard/income` | Income tracking with categories and bar chart |
| `/dashboard/assets` | Asset catalog with depreciation tracking |
| `/dashboard/investments` | Investment portfolio with ROI |
| `/dashboard/reports` | Monthly / quarterly / annual financial reports |

---

## Available Scripts

```bash
# Development
npm run dev              # start dev server with hot reload (port 3000)
npm run build            # production build
npm run start            # start production server
npm run lint             # run ESLint

# Database
npm run db:dev           # start dev PostgreSQL container (port 5433)
npm run db:dev-down      # stop dev PostgreSQL container
npm run db:push          # push schema to database (create/update tables)
npm run db:generate      # generate migration files
npm run db:migrate       # run migration files
npm run db:studio        # open Drizzle Studio (database GUI) at port 4983
npm run db:pull          # pull schema from existing database

# Docker (full stack)
npm run docker:up        # start all containers (app + db)
npm run docker:down      # stop all containers
npm run docker:build     # rebuild Docker image
npm run docker:logs      # tail container logs
```

---

## Database GUI

To browse and edit your data visually:

```bash
npm run db:studio
```

Opens Drizzle Studio at [https://local.drizzle.studio](https://local.drizzle.studio)

---

## Project Structure

```
finance-dashboard/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/     # Better Auth handler
│   │   ├── dashboard/         # GET summary stats
│   │   ├── transactions/      # CRUD transactions
│   │   ├── categories/        # CRUD categories
│   │   ├── assets/            # CRUD assets
│   │   └── investments/       # CRUD investments
│   ├── dashboard/
│   │   ├── page.tsx           # Overview
│   │   ├── expenses/
│   │   ├── income/
│   │   ├── assets/
│   │   ├── investments/
│   │   └── reports/
│   ├── sign-in/
│   └── sign-up/
├── components/
│   ├── finance/               # All finance-specific components
│   └── ui/                    # shadcn/ui primitives
├── db/
│   ├── index.ts               # Drizzle instance
│   └── schema/
│       ├── auth.ts            # Auth tables
│       ├── transactions.ts    # Categories + transactions
│       ├── assets.ts          # Assets
│       └── investments.ts     # Investments
├── lib/
│   ├── auth.ts                # Better Auth server config
│   └── auth-client.ts         # Better Auth client hooks
├── drizzle.config.ts
├── docker-compose.yaml
└── .env.example
```

---

## Troubleshooting

**Database connection error**
- Make sure Docker is running: `docker ps`
- Make sure the dev container is up: `npm run db:dev`
- Check your `DATABASE_URL` in `.env` matches the port (5433 for dev, 5432 for full Docker)

**Tables don't exist / "relation does not exist" error**
- Run `npm run db:push` to create all tables

**Port 3000 already in use**
```bash
# Find and kill the process using port 3000
npx kill-port 3000
```

**Auth redirect loop**
- Make sure `BETTER_AUTH_SECRET` is set in `.env`
- Make sure `BETTER_AUTH_URL` matches the URL you're accessing (e.g. `http://localhost:3000`)
