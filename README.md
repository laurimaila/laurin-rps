# Laurin RPS - Reaktor assignment

A Next.js web app for presenting Rock-Paper-Scissors matches fetched from Reaktor's Bad API. Stores matches in a Postgres database using Drizzle ORM.

The app is deployed to my k8s cluster found at [https://rps.laurimaila.com](https://rps.laurimaila.com).

## Tech Stack

- **Framework**: Next.js
- **Database**: Postgres with Drizzle ORM
- **Styling**: Shadcn & Tailwind

## Features

- **Recent Matches**: Shows a live updating list of RPS matches. Only the backend connects to the Reaktor API and forwards it to users.
- **Leaderboard**: Dynamic standings based on win counts, with support for custom date ranges. Shows leaderboard for current date by default.
- **Match History**: View complete RPS match history or filter by date and/or player name.

- **Infinite Scroll**: Match history and leaderboard use cursor based pagination, so data is only fetched when needed.
- **Smart Sync**: A background service crawls match history from the Reaktor API and stops when it detects that the database is up-to-date, accounting for the fact that the API may arrive out of sequence.


## Architecture

### 1. Match Service (`src/lib/match-service.ts`)
The core engine of the application. It acts as a singleton `EventTarget` that manages:
- **Historical Sync**: Crawls the Reaktor API history. It optimizes performance by checking for duplicate records and stopping once it catches up to the existing database state.
- **Live Connection**: Maintains a persistent connection to the Reaktor live stream and broadcasts new matches to the API layer.
- **Database Indexing**: Efficiently batches match and player data to minimize database overhead.

### 2. API Layer (`src/app/api/`)
- `/api/live`: An SSE endpoint that streams new matches from the `MatchService` directly to the frontend.
- `/api/history`: Handles paginated queries for match history with filtering.
- `/api/leaderboard`: Aggregates win/loss/tie statistics across the entire dataset or specific time windows.

## Docker Support

The project is containerized and can be started using Docker Compose:
```bash
docker compose up --build
```
