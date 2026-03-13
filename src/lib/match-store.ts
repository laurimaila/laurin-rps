import { db } from "@/db";
import { matches, players } from "@/db/schema";
import { GameResult } from "./types";
import { calculateWinner, fetchHistoryFromBadApi } from "./api";
import { sleep } from "./utils";

export async function storeMatches(results: GameResult[]): Promise<{
  totalMatches: number;
  newMatches: number;
  totalPlayers: number;
  newPlayers: number;
}> {
  if (results.length === 0) return { newMatches: 0, totalMatches: 0, newPlayers: 0, totalPlayers: 0 };

  try {
    // Only add unique players
    const uniquePlayers = [...new Set(results.flatMap(m => [m.playerA.name, m.playerB.name]))]
      .map(name => ({ id: name, name }));

    const playerResult = await db.insert(players)
      .values(uniquePlayers)
      .onConflictDoNothing()
      .returning({ id: players.id });

    const matchValues = results.map(m => {
      const winner = calculateWinner(m.playerA, m.playerB);
      const winnerId = winner === "A" ? m.playerA.name : winner === "B" ? m.playerB.name : null;

      return {
        id: m.gameId,
        playedAt: new Date(m.time),
        playerAId: m.playerA.name,
        playerBId: m.playerB.name,
        playerAHand: (m.playerA.played || "UNKNOWN").toUpperCase(),
        playerBHand: (m.playerB.played || "UNKNOWN").toUpperCase(),
        winnerId: winnerId
      };
    });

    const matchResult = await db.insert(matches)
      .values(matchValues)
      .onConflictDoNothing()
      .returning({ id: matches.id });

    return {
      newMatches: matchResult.length,
      totalMatches: results.length,
      newPlayers: playerResult.length,
      totalPlayers: uniquePlayers.length
    };
  } catch (err) {
    console.error(`Error storing matches to database:`, err);
    throw err;
  }
}

export async function crawlHistory(
  cursor?: string,
  totalLoaded = 0
) {
  let currentCursor: string | null | undefined = cursor;
  let currentTotal = totalLoaded;
  let emptyBatches = 0;
  const matchLimit = Number(process.env.MATCH_LIMIT ?? 500_000);

  while (true) {
    try {
      const res = await fetchHistoryFromBadApi(currentCursor ?? undefined);
      const stats = await storeMatches(res.data);
      currentTotal += res.data.length;

      console.log(
        `Found ${stats.totalMatches} matches (${stats.newMatches} new), ` +
        `${stats.totalPlayers} players (${stats.newPlayers} new). ` +
        `Total processed: ${currentTotal}`
      );

      if (stats.newMatches === 0 && res.data.length > 0) {
        emptyBatches++;
      } else {
        emptyBatches = 0;
      }

      // Stop if we hit 10 consecutive batches of old data
      if (emptyBatches >= 10) {
        console.log("Stopping sync: 10 consecutive batches returned no new matches.");
        break;
      }

      currentCursor = res.cursor;
      if (!currentCursor || currentTotal >= matchLimit) {
        break;
      }

      await sleep(2000);
    } catch (err) {
      console.error("Error during sync:", err);
      // Wait before retrying with same cursor
      await sleep(10000);
    }
  }

  console.log(`Sync completed. Total matches processed: ${currentTotal}`);
}
