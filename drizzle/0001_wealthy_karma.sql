CREATE TABLE "missao_progresso" (
	"user_id" text NOT NULL,
	"missao_id" text NOT NULL,
	"dia" text NOT NULL,
	"progresso" integer DEFAULT 0 NOT NULL,
	"concluida" boolean DEFAULT false NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "missao_progresso_user_id_missao_id_dia_pk" PRIMARY KEY("user_id","missao_id","dia")
);
--> statement-breakpoint
CREATE TABLE "quiz_tentativas" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"conceito_slug" text NOT NULL,
	"acertou" boolean NOT NULL,
	"formato" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "missao_progresso" ADD CONSTRAINT "missao_progresso_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_tentativas" ADD CONSTRAINT "quiz_tentativas_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quiz_tentativas_user_idx" ON "quiz_tentativas" USING btree ("user_id");