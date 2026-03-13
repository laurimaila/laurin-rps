import { createParser, EventSourceMessage } from "eventsource-parser";
import { GameResult } from "./types";
import { storeMatches } from "./match-store";
import { sleep } from "./utils";

const API_BASE = process.env.API_BASE;
const TOKEN = process.env.REAKTOR_TOKEN;

export async function connectExternalStream(onMatch: (match: GameResult) => void) {
  while (true) {
    let lastDataAt = Date.now();
    let stalledCheck: ReturnType<typeof setInterval> | null = null;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined | null = undefined;
    const controller = new AbortController();

    try {
      console.log(`[Stream] Connecting to ${API_BASE}/live...`);
      const timeoutId = setTimeout(() => {
        console.warn("[Stream] Connection attempt timed out after 30s.");
        controller.abort();
      }, 30_000);

      const response = await fetch(`${API_BASE}/live`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      console.log("[Stream] Connected successfully. Listening for matches...");

      stalledCheck = setInterval(() => {
        if (Date.now() - lastDataAt > 600_000) {
          console.warn("[Stream] No data for 10 minutes, reconnecting...");
          controller.abort();
        }
      }, 30_000);

      const parser = createParser({
        onEvent: (event: EventSourceMessage) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "GAME_RESULT") {
              console.log(
                `[Stream] Match received: ${data.gameId} (${data.playerA.name} vs ${data.playerB.name})`
              );
              storeMatches([data]).catch(e => console.error("[Stream] Store error:", e));
              onMatch(data);
            }
          } catch (e) {
            console.error("[Stream] Error parsing JSON:", e, "Data:", event.data);
          }
        }
      });

      reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is null");

      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        lastDataAt = Date.now();
        parser.feed(decoder.decode(value, { stream: true }));
      }

      console.log("[Stream] Connection closed by server.");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.error("[Stream] Connection aborted/timed out.");
      } else {
        console.error(
          "[Stream] Error:",
          err instanceof Error ? err.message : String(err)
        );
      }
    } finally {
      if (stalledCheck) clearInterval(stalledCheck);
      if (reader) {
        try {
          await reader.cancel();
        } catch (e) {}
      }
      controller.abort();
    }

    console.log("[Stream] Reconnecting in 5s...");
    await sleep(5000);
  }
}
