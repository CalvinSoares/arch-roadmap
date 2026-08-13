ALTER TABLE "user" ADD COLUMN "banido" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "shadow_ban" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lembretes_email" boolean DEFAULT true NOT NULL;