import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const players = pgTable('players', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const matches = pgTable('matches', {
  id: text('id').primaryKey(),
  playedAt: timestamp('played_at', { withTimezone: true, mode: 'date' }).notNull(),

  playerAId: text('player_a_id').notNull().references(() => players.id),
  playerBId: text('player_b_id').notNull().references(() => players.id),

  playerAHand: text('player_a_hand').notNull(),
  playerBHand: text('player_b_hand').notNull(),

  winnerId: text('winner_id').references(() => players.id), // Nullable by default for ties
},
// Indexes for efficient querying
(table) => [
  index('played_at_idx').on(table.playedAt),
  index('player_a_played_at_idx').on(table.playerAId, table.playedAt),
  index('player_b_played_at_idx').on(table.playerBId, table.playedAt),
  index('winner_played_at_idx').on(table.winnerId, table.playedAt),
]);

// Relation for easier querying with Drizzle
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
