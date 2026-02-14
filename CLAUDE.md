# CLAUDE.md — time-entry-app

This file provides context for AI assistants working on this repository.

## Project Overview

**time-entry-app** is a mobile-first web application for corporate lawyers who bill on a time-charge basis. It allows:
- Voice-input of time entries (client, matter, time range, work description)
- Review/management of entries by the lawyer and their assistant
- Automatic daily email reports sent to the assistant via cron

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma ORM (Vercel Postgres in production)
- **Styling**: Tailwind CSS
- **Email**: Nodemailer (SMTP)
- **Voice Input**: Web Speech API (`webkitSpeechRecognition`, Japanese `ja-JP`)
- **Deployment**: Vercel with cron jobs; PWA-ready (manifest.json, standalone output)
- **Dev Container**: Node.js 20 (TypeScript) with auto-setup

## Commands

```bash
npm install          # Install dependencies (also runs prisma generate via postinstall)
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push Prisma schema to database (creates/updates tables)
npm run db:migrate   # Create a Prisma migration
npm run db:studio    # Open Prisma Studio (database GUI)
```

## Project Structure

```
time-entry-app/
├── CLAUDE.md                              # This file
├── package.json
├── tsconfig.json
├── next.config.mjs                        # Standalone output mode
├── tailwind.config.ts
├── postcss.config.mjs
├── .eslintrc.json                         # next/core-web-vitals rules
├── .env.example                           # Environment variable template
├── vercel.json                            # Vercel build command + daily cron job
├── .devcontainer/
│   └── devcontainer.json                  # Dev container (Node 20, auto npm install + db:push)
├── prisma/
│   └── schema.prisma                      # Database schema (TimeEntry model, PostgreSQL)
├── public/
│   └── manifest.json                      # PWA manifest (Japanese, standalone)
└── src/
    ├── types/
    │   └── speech.d.ts                    # Web Speech API type declarations
    ├── hooks/
    │   └── useSpeechRecognition.ts         # Speech recognition React hook (ja-JP, continuous)
    ├── lib/
    │   ├── prisma.ts                      # Prisma client singleton (prevents connection leaks)
    │   └── email.ts                       # Daily report email sender (HTML table, Japanese)
    ├── components/
    │   ├── VoiceInput.tsx                 # Microphone button component (pulse animation)
    │   ├── EntryForm.tsx                  # Time entry form with voice input + Japanese time parsing
    │   └── EntryList.tsx                  # Entry list display with duration totals
    └── app/
        ├── layout.tsx                     # Root layout (PWA meta tags, Japanese lang, no-zoom viewport)
        ├── globals.css                    # Tailwind directives + touch-friendly input styles
        ├── page.tsx                       # Main page — entry form + today's list + email send
        ├── entries/
        │   └── page.tsx                   # Review page — browse entries by date with navigation
        └── api/
            ├── entries/
            │   └── route.ts              # CRUD API: GET (by date), POST, DELETE
            └── send-daily-report/
                └── route.ts              # POST: sends daily email report
```

## Database Schema

**Provider**: PostgreSQL (`prisma/schema.prisma`)

Single model — `TimeEntry`:

| Field       | Type     | Constraints                 | Description                |
|-------------|----------|-----------------------------|----------------------------|
| id          | Int      | @id @default(autoincrement) | Primary key                |
| clientName  | String   | Required                    | Client name                |
| matterName  | String   | Required                    | Matter/case name           |
| date        | String   | Required, @@index([date])   | YYYY-MM-DD (indexed)       |
| startTime   | String   | Required                    | HH:MM                      |
| endTime     | String   | Required                    | HH:MM                      |
| description | String   | Required                    | Work description           |
| createdAt   | DateTime | @default(now())             | Auto-set on creation       |
| updatedAt   | DateTime | @updatedAt                  | Auto-updated               |

## API Endpoints

| Method | Path                         | Description                                          |
|--------|------------------------------|------------------------------------------------------|
| GET    | /api/entries?date=YYYY-MM-DD | Get entries for a date (ordered by startTime asc)    |
| POST   | /api/entries                 | Create entry (JSON body with all fields)             |
| DELETE | /api/entries?id=N            | Delete an entry by ID                                |
| POST   | /api/send-daily-report       | Send email report (optional: ?date=YYYY-MM-DD&email=addr) |

**POST /api/entries** body:
```json
{
  "clientName": "string",
  "matterName": "string",
  "date": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "description": "string"
}
```

**POST /api/send-daily-report** query parameters:
- `date` — optional, defaults to yesterday
- `email` — optional, defaults to `ASSISTANT_EMAIL` env var

## Pages

- `/` — **Main entry page** (mobile-optimized). Voice-enabled form for recording time entries. Shows today's entries below the form. Includes email send button for daily reports.
- `/entries` — **Review page** for the assistant. Date navigation (prev/next buttons + date picker) to browse entries. Supports `?date=YYYY-MM-DD` query parameter.

## Deployment (Vercel)

The `vercel.json` configures:

**Build command:**
```bash
export DATABASE_URL="${DATABASE_URL:-$POSTGRES_URL}" && prisma generate && prisma db push && next build
```
This falls back to Vercel's `POSTGRES_URL` if `DATABASE_URL` is not set.

**Cron job:**
```json
{ "path": "/api/send-daily-report", "schedule": "0 0 * * *" }
```
Runs daily at 00:00 UTC, sending the previous day's report.

## Dev Container

The `.devcontainer/devcontainer.json` configures:
- Base image: `mcr.microsoft.com/devcontainers/typescript-node:20`
- Post-create: `npm install && npm run db:push`
- Forwards port 3000

## Key Conventions

- **Language**: UI and messages are in Japanese
- **Time format**: 24-hour HH:MM; time pickers use 6-minute increments (0.1h billing units)
- **Date handling**: Dates stored as `YYYY-MM-DD` strings for simple filtering
- **Client components**: Pages using voice/state are `"use client"`; `useSearchParams` must be wrapped in `<Suspense>`
- **Prisma client**: Singleton pattern in `src/lib/prisma.ts` to prevent connection leaks in dev
- **Voice input**: Each text field has its own `<VoiceInput>` button; recognition language is `ja-JP`
- **Japanese time parsing**: `EntryForm.tsx` contains `parseJapaneseTime()` which handles expressions like "14時30分", "午後2時", "14時半", and full-width digits
- **Duration display**: Both Japanese format ("2時間30分") and decimal hours ("2.5h") shown throughout the app
- **PWA**: Standalone display, no-zoom viewport, 192px and 512px icons, apple-web-app-capable

## Environment Variables

| Variable              | Required   | Description                                    |
|-----------------------|------------|------------------------------------------------|
| DATABASE_URL          | Yes        | PostgreSQL connection URL                      |
| POSTGRES_PRISMA_URL   | Alt DB     | Vercel Postgres pooled connection URL          |
| POSTGRES_URL_NON_POOLING | Alt DB  | Vercel Postgres direct connection URL          |
| SMTP_HOST             | For email  | SMTP server hostname (e.g., smtp.gmail.com)    |
| SMTP_PORT             | For email  | SMTP port (587 for STARTTLS, 465 for TLS)     |
| SMTP_USER             | For email  | SMTP auth username                             |
| SMTP_PASS             | For email  | SMTP auth password (Gmail: app-specific)       |
| SMTP_FROM             | For email  | Sender email address                           |
| ASSISTANT_EMAIL       | For email  | Default recipient for daily reports            |
| APP_URL               | Optional   | App base URL for email links (default: http://localhost:3000) |

## Notes for AI Assistants

- Always read existing files before modifying them
- Run `npm run build` after changes to verify the build passes
- Run `npm run lint` to check for ESLint errors
- After modifying `prisma/schema.prisma`, run `npm run db:push` to sync the database
- The `.env` file may contain only `DATABASE_URL` — email settings require user configuration
- Do not commit `.env` or `prisma/*.db` files (already in `.gitignore`)
- Keep this CLAUDE.md updated when adding new pages, API routes, or dependencies
- The postinstall script runs `prisma generate` with a fallback DATABASE_URL to avoid CI failures
- TypeScript path alias: `@/*` maps to `./src/*`
- ESLint uses `next/core-web-vitals` configuration
