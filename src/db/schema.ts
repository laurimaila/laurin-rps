import { pgTable, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const handEnum = pgEnum('hand', ['ROCK', 'PAPER', 'SCISSORS']);

export const players = pgTable('players', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const matches = pgTable('matches', {
  id: text('id').primaryKey(),
  playedAt: timestamp('played_at', { withTimezone: true, mode: 'date' }).notNull(),

  playerAId: text('player_a_id').notNull().references(() => players.id),
  playerBId: text('player_b_id').notNull().references(() => players.id),

  playerAHand: handEnum('player_a_hand').notNull(),
  playerBHand: handEnum('player_b_hand').notNull(),

  winnerId: text('winner_id').references(() => players.id), // Nullable by default for ties
},
// New optimized composite indexes for high-performance joins and filtering
(table) => [
  index('played_at_idx').on(table.playedAt), 
  index('player_a_played_at_idx').on(table.playerAId, table.playedAt),
  index('player_b_played_at_idx').on(table.playerBId, table.playedAt),
  index('winner_played_at_idx').on(table.winnerId, table.playedAt),
]);

export const playersRelations = relations(players, ({ many }) => ({
  matchesAsA: many(matches, { relationName: 'playerA' }),
  matchesAsB: many(matches, { relationName: 'playerB' }),
  wonMatches: many(matches, { relationName: 'winner' }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  playerA: one(players, {
    fields: [matches.playerAId],
    references: [players.id],
    relationName: 'playerA',
  }),
  playerB: one(players, {
    fields: [matches.playerBId],
    references: [players.id],
    relationName: 'playerB',
  }),
  winner: one(players, {
    fields: [matches.winnerId],
    references: [players.id],
    relationName: 'winner',
  }),
}));
