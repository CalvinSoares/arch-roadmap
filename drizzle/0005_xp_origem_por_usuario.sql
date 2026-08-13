-- Idempotência de XP por usuário: o mesmo nó/baú/missão pode pagar
-- para cada conta. Antes o índice global que bloqueava o 2º usuário.
DROP INDEX IF EXISTS "xp_events_origem_ref_uq";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "xp_events_user_origem_uq" ON "xp_events" USING btree ("user_id","origem_ref");
