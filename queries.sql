-- 1. Who won the last match on March 9th?
-- Includes winner's name or 'TIE'.
SELECT COALESCE(winner_id, 'TIE') as last_winner_march_9th
FROM matches
WHERE played_at >= '2026-03-09 00:00:00+00' AND played_at < '2026-03-10 00:00:00+00'
ORDER BY played_at DESC, id DESC
LIMIT 1;

-- 2. Today's leaderboard (March 10th, 2026) based on wins.
-- Note: Replace the date if 'today' is different.
SELECT p.name, COUNT(m.id) as wins
FROM players p
JOIN matches m ON m.winner_id = p.id
WHERE m.played_at >= '2026-03-10 00:00:00+00' AND m.played_at < '2026-03-11 00:00:00+00'
GROUP BY p.name
ORDER BY wins DESC, p.name ASC;

-- 3. Top 10 players by wins until end of March 8th.
-- Earliest valid match until 2026-03-08 23:59:59.
-- Sorted by wins (DESC) and name (ASC) for ties.
SELECT p.name, COUNT(m.id) as wins
FROM players p
JOIN matches m ON m.winner_id = p.id
WHERE m.played_at < '2026-03-09 00:00:00+00'
GROUP BY p.name
ORDER BY wins DESC, p.name ASC
LIMIT 10;

-- 4. Historical leaderboard between 2026-03-08 and 2026-03-09 (fully inclusive).
SELECT p.name, COUNT(m.id) as wins
FROM players p
JOIN matches m ON m.winner_id = p.id
WHERE m.played_at >= '2026-03-08 00:00:00+00' AND m.played_at < '2026-03-10 00:00:00+00'
GROUP BY p.name
ORDER BY wins DESC, p.name ASC;
