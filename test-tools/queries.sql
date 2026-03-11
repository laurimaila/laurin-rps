-- @block Winner of last match on March 9th
SELECT COALESCE(winner_id, 'TIE') as last_winner_march_9th
FROM matches
WHERE played_at >= '2026-03-09 00:00:00+00' AND played_at < '2026-03-10 00:00:00+00'
ORDER BY played_at DESC, id DESC
LIMIT 1;

-- @block Leaderboard for march 10th
SELECT p.name, COUNT(m.id) as wins
FROM players p
JOIN matches m ON m.winner_id = p.id
WHERE m.played_at >= '2026-03-10 00:00:00+00' AND m.played_at < '2026-03-11 00:00:00+00'
GROUP BY p.name
ORDER BY wins DESC, p.name ASC;

-- @block Top 10 players by wins until end of March 8th
SELECT p.name, COUNT(m.id) as wins
FROM players p
JOIN matches m ON m.winner_id = p.id
WHERE m.played_at < '2026-03-09 00:00:00+00'
GROUP BY p.name
ORDER BY wins DESC, p.name ASC
LIMIT 10;

-- @block Amara Chen's first 10 match results on 28.2.2026
SELECT
    CASE
        WHEN winner_id = 'Amara Chen' THEN 'WIN'
        WHEN winner_id IS NULL THEN 'TIE'
        ELSE 'LOSE'
    END as result
FROM matches
WHERE (player_a_id = 'Amara Chen' OR player_b_id = 'Amara Chen')
  AND played_at >= '2026-02-28 00:00:00+00' AND played_at < '2026-03-01 00:00:00+00'
ORDER BY played_at ASC, id ASC
LIMIT 10;
