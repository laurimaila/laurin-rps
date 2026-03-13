import { db } from "@/db";
import { matches, players } from "@/db/schema";
import { GameResult } from "./types";
import { calculateWinner, fetchHistoryFromBadApi } from "./api";

const API_BASE = process.env.API_BASE;
const TOKEN = process.env.REAKTOR_TOKEN;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function storeMatches(results: GameResult[]): Promise<{
  newMatches: number;
  totalMatches: number;
  newPlayers: number;
  totalPlayers: number;
}> {
  if (results.length === 0) return { newMatches: 0, totalMatches: 0, newPlayers: 0, totalPlayers: 0 };

  try {
    // Add unique players to the database
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
    console.error(`Error storing batch:`, err);
    return { newMatches: 0, totalMatches: 0, newPlayers: 0, totalPlayers: 0 };
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

      await sleep(1000);
    } catch (err) {
      console.error("Sync Error:", err);
      // Wait before retrying with same cursor
      await sleep(10000);
    }
  }

  console.log(`Sync completed. Total matches processed: ${currentTotal}`);
}


export async function connectLiveStream(onMatch: (match: GameResult) => void) {
  try {
    const response = await fetch(`${API_BASE}/live`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: 'no-store'
    });
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data:")) {
          try {
            const data = JSON.parse(line.replace("data:", "").trim());
            if (data.type === "GAME_RESULT") {
              await storeMatches([data]);
              onMatch(data);
            }
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.error("Live Error:", err);
    setTimeout(() => connectLiveStream(onMatch), 5000);
  }
}
