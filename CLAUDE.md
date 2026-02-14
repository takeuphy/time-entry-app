# CLAUDE.md — time-entry-app

This file provides context for AI assistants working on this repository.

## Project Overview

**time-entry-app** is a mobile-first web application for corporate lawyers who bill on a time-charge basis. It allows:
- Voice-input of time entries (client, matter, time range, work description)
- Review/management of entries by the lawyer and their assistant
- Automatic daily email reports sent to the assistant via Vercel Cron

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma ORM (Vercel Postgres with connection pooling)
- **Styling**: Tailwind CSS 3
- **Email**: Nodemailer (SMTP)
- **Voice Input**: Web Speech API (`webkitSpeechRecognition`, Japanese `ja-JP`)
- **Deployment**: Vercel (standalone output, cron jobs) + PWA-ready

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

**Vercel build command** (from `vercel.json`):
```bash
prisma generate && prisma db push && next build
```

## Project Structure

```
time-entry-app/
├── CLAUDE.md                              # This file
├── package.json
├── tsconfig.json
├── next.config.mjs                        # Next.js config (standalone output)
├── tailwind.config.ts
├── postcss.config.mjs
├── .eslintrc.json                         # Extends next/core-web-vitals
├── .env.example                           # Environment variable template
├── vercel.json                            # Vercel build command + cron config
├── .devcontainer/
│   └── devcontainer.json                  # GitHub Codespaces / devcontainer setup
├── prisma/
│   └── schema.prisma                      # Database schema (TimeEntry model)
├── public/
│   └── manifest.json                      # PWA manifest (standalone, Japanese)
└── src/
    ├── types/
    │   └── speech.d.ts                    # Web Speech API type declarations
    ├── hooks/
    │   └── useSpeechRecognition.ts         # Speech recognition React hook (ja-JP)
    ├── lib/
    │   ├── prisma.ts                      # Prisma client singleton
    │   └── email.ts                       # Daily report email sender
    ├── components/
    │   ├── VoiceInput.tsx                 # Microphone button component
    │   ├── EntryForm.tsx                  # Time entry form with voice input
    │   └── EntryList.tsx                  # Entry list display with totals
    └── app/
        ├── layout.tsx                     # Root layout (PWA meta tags, lang="ja")
        ├── globals.css                    # Tailwind directives + mobile styles
        ├── page.tsx                       # Main page — entry form + today's list
        ├── entries/
        │   └── page.tsx                   # Review page — browse entries by date
        └── api/
            ├── entries/
            │   └── route.ts              # CRUD API: GET (by date), POST, DELETE
            └── send-daily-report/
                └── route.ts              # POST: sends daily email report
```

## Database

### Provider

PostgreSQL via Vercel Postgres. The Prisma schema uses two connection URLs:
- `POSTGRES_PRISMA_URL` — connection pooling URL (used by Prisma Client)
- `POSTGRES_URL_NON_POOLING` — direct connection URL (used for migrations)

### Schema

Single model — `TimeEntry`:

| Field       | Type     | Description                |
|-------------|----------|----------------------------|
| id          | Int (PK) | Auto-increment             |
| clientName  | String   | Client name                |
| matterName  | String   | Matter/case name           |
| date        | String   | YYYY-MM-DD (indexed)       |
| startTime   | String   | HH:MM (24-hour)            |
| endTime     | String   | HH:MM (24-hour)            |
| description | String   | Work description           |
| createdAt   | DateTime | Auto-set on creation       |
| updatedAt   | DateTime | Auto-updated               |

The `date` field has an `@@index` for query performance.

## API Endpoints

| Method | Path                         | Description                                        |
|--------|------------------------------|----------------------------------------------------|
| GET    | /api/entries?date=YYYY-MM-DD | Get entries for a specific date (ordered by startTime) |
| POST   | /api/entries                 | Create a new entry (JSON body with all fields)     |
| DELETE | /api/entries?id=N            | Delete an entry by ID                              |
| POST   | /api/send-daily-report       | Send email report (?date= optional, defaults to yesterday) |

## Pages

- `/` — **Main entry page** (mobile-optimized, `"use client"`). Voice-enabled form for recording time entries. Shows today's entries below the form with delete functionality.
- `/entries` — **Review page** for the assistant (`"use client"`, wrapped in `<Suspense>`). Date navigation with prev/next buttons. Supports `?date=YYYY-MM-DD` query parameter.

## Key Conventions

- **Language**: All UI text and messages are in Japanese
- **Time format**: 24-hour HH:MM; time pickers use 6-minute (360-second) increments for 0.1h billing units
- **Date handling**: Dates stored as `YYYY-MM-DD` strings for simple filtering
- **Client components**: Pages using voice/state are `"use client"`; `useSearchParams` must be wrapped in `<Suspense>`
- **Prisma client**: Singleton pattern in `src/lib/prisma.ts` to prevent connection leaks in dev
- **Voice input**: Each text field has its own `<VoiceInput>` button; recognition language is `ja-JP`
- **Japanese time parsing**: `EntryForm.tsx` converts spoken Japanese time expressions (e.g., "14時30分" → "14:30", "午後2時半" → "14:30")
- **Duration display**: Both decimal hours (e.g., "3.5h") and Japanese format (e.g., "3時間30分") in `EntryList.tsx`
- **Mobile accessibility**: Touch targets for time/date inputs have a minimum height of 44px (set in `globals.css`)

## Daily Email Report

Configured as a Vercel Cron job in `vercel.json`:
- **Schedule**: `0 0 * * *` (midnight UTC daily)
- **Endpoint**: `POST /api/send-daily-report`
- **Behavior**: Fetches previous day's entries, calculates totals, sends an HTML-formatted email with a styled table to the assistant

For local development or non-Vercel hosting, use a system cron:
```
0 0 * * * curl -X POST http://localhost:3000/api/send-daily-report
```

## Environment Variables

| Variable              | Required   | Description                                  |
|-----------------------|------------|----------------------------------------------|
| POSTGRES_PRISMA_URL   | Yes        | PostgreSQL connection URL with pooling       |
| POSTGRES_URL_NON_POOLING | Yes     | PostgreSQL direct connection URL             |
| SMTP_HOST             | For email  | SMTP server hostname (e.g., smtp.gmail.com)  |
| SMTP_PORT             | For email  | SMTP port (587 for TLS, 465 for SSL)         |
| SMTP_USER             | For email  | SMTP auth username                           |
| SMTP_PASS             | For email  | SMTP auth password (app password for Gmail)  |
| SMTP_FROM             | For email  | Sender email address                         |
| ASSISTANT_EMAIL       | For email  | Recipient (assistant) email address          |
| APP_URL               | Optional   | App base URL for email links (default: http://localhost:3000) |

## Development Environment

### Devcontainer (GitHub Codespaces)

The `.devcontainer/devcontainer.json` provides:
- **Image**: `mcr.microsoft.com/devcontainers/typescript-node:20`
- **Post-create**: Runs `npm install && npm run db:push`
- **Ports**: Forwards port 3000

### Vercel Deployment

The `vercel.json` configures:
- **Build**: `prisma generate && prisma db push && next build`
- **Cron**: Daily report at midnight UTC

### Testing

No test framework is currently configured. There are no test files in the project.

## Notes for AI Assistants

- Always read existing files before modifying them
- Run `npm run build` after changes to verify the build passes
- Run `npm run lint` to check for ESLint errors
- After modifying `prisma/schema.prisma`, run `npm run db:push` to sync the database
- Database requires `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` environment variables
- Do not commit `.env` or `prisma/*.db` files (already in `.gitignore`)
- Keep this CLAUDE.md updated when adding new pages, API routes, or dependencies
- The `next.config.mjs` uses `output: "standalone"` for containerized/Vercel deployment
- PWA icons (`icon-192.png`, `icon-512.png`) are referenced in `manifest.json` but not present in the repo
