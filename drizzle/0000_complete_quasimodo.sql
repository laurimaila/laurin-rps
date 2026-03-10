CREATE TYPE "public"."hand" AS ENUM('ROCK', 'PAPER', 'SCISSORS');--> statement-breakpoint
CREATE TABLE "matches" (
	"id" text PRIMARY KEY NOT NULL,
	"played_at" timestamp with time zone NOT NULL,
	"player_a_id" text NOT NULL,
	"player_b_id" text NOT NULL,
	"player_a_hand" "hand" NOT NULL,
	"player_b_hand" "hand" NOT NULL,
	"winner_id" text
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "players_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_a_id_players_id_fk" FOREIGN KEY ("player_a_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_b_id_players_id_fk" FOREIGN KEY ("player_b_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "played_at_idx" ON "matches" USING btree ("played_at");--> statement-breakpoint
CREATE INDEX "player_a_played_at_idx" ON "matches" USING btree ("player_a_id","played_at");--> statement-breakpoint
CREATE INDEX "player_b_played_at_idx" ON "matches" USING btree ("player_b_id","played_at");--> statement-breakpoint
CREATE INDEX "winner_played_at_idx" ON "matches" USING btree ("winner_id","played_at");