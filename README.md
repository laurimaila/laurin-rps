# Laurin RPS - Reaktor assignment

A Next.js web app for presenting Rock-Paper-Scissors matches fetched from Reaktor's Bad API. Stores matches in a Postgres database using Drizzle ORM.

The app is deployed to my k8s cluster found at [https://rps.laurimaila.com](https://rps.laurimaila.com).

## Tech Stack

- **Framework**: Next.js 16
- **Database**: Postgres with Drizzle ORM
- **Styling**: Shadcn & Tailwind

## Features

- **Live Recent Matches**: Next.js backend listens for new matches from Reaktor, saves them to the database and relays them to frontend. 
- **Match History**: Comprehensive search and filtering of past matches by player name or specific date.
- **Leaderboard**: dynamic standings based on win counts, with support for custom date ranges.
- **Infinite Scroll**: Effortlessly browse through thousands of matches with optimized pagination.
- **Smart Synchronization**: An intelligent background service that crawls history from the Reaktor API and stops automatically when it detects that the database is up-to-date.


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

### 3. Frontend (`src/components/`)
- **Dashboard**: The main hub using Radix UI Tabs to switch between Live, Standings, and History.
- **MatchTable**: A reusable component for displaying game results with winner highlighting.
- **Leaderboard**: Displays player statistics with a date-range picker for historical analysis.

## Docker Support

The project is containerized and can be started using Docker Compose:
```bash
docker compose up --build
```
