# Laurin RPS - Reaktor assignment

A Next.js web app for presenting Rock-Paper-Scissors matches fetched from Reaktor's Bad API. Stores matches in a Postgres database using Drizzle ORM.

The app is deployed to my k8s cluster found at [https://rps.laurimaila.com](https://rps.laurimaila.com).

## Tech Stack

- **Framework**: Next.js
- **Database**: Postgres with Drizzle ORM
- **Styling**: Shadcn & Tailwind

## Features

- **Recent Matches**: Shows a live updating list of RPS matches. A single backend service connects to Bad API and forwards new data to users. All times are shown in UTC.
- **Leaderboard**: Dynamic standings based on win counts, with support for custom date ranges. Shows leaderboard for current day by default.
- **Match History**: View the complete RPS match history or filter by date and/or player name.

- **Infinite Scroll**: Match history and leaderboard use cursor based pagination, so data is only fetched when needed.
- **Smart Sync**: A backend service crawls match history from Bad API and stops when it detects that the database is up-to-date, accounting for the fact that the API may arrive out of sequence.


## Architecture

### 1. Match Service (`src/lib/match-service.ts`)
A singleton `EventTarget` that manages:
- **Live Connection**: Maintains a persistent connection to Bad API and broadcasts new matches to the API layer.
- **Historical Sync**: Crawls the Bad API history and saves new player and match data to a Postgres database, stopping once it catches up to the existing database state.

### 2. API Layer (`src/app/api/`)
- `/api/live`: An SSE endpoint that streams new matches from the Match Service to users.
- `/api/history`: Handles paginated queries for match history with filtering.
- `/api/leaderboard`: Aggregates win/loss/tie statistics across the entire dataset or specific time windows.

## Docker Support

The project is containerized and can be started using Docker Compose:
```bash
docker compose up --build
```
