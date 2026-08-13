CREATE TYPE "public"."nivel_liga" AS ENUM('bronze', 'prata', 'ouro', 'diamante', 'mestre');--> statement-breakpoint
CREATE TYPE "public"."status_amizade" AS ENUM('pending', 'accepted', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."status_denuncia" AS ENUM('aberta', 'resolvida', 'descartada');--> statement-breakpoint
CREATE TABLE "amizades" (
	"user_id" text NOT NULL,
	"amigo_id" text NOT NULL,
	"status" "status_amizade" DEFAULT 'pending' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "amizades_user_id_amigo_id_pk" PRIMARY KEY("user_id","amigo_id")
);
--> statement-breakpoint
CREATE TABLE "denuncias" (
	"id" text PRIMARY KEY NOT NULL,
	"alvo_user_id" text NOT NULL,
	"autor_id" text NOT NULL,
	"motivo" text NOT NULL,
	"status" "status_denuncia" DEFAULT 'aberta' NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liga_membros" (
	"temporada_id" text NOT NULL,
	"user_id" text NOT NULL,
	"nivel" "nivel_liga" DEFAULT 'bronze' NOT NULL,
	"xp_na_temporada" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "liga_membros_temporada_id_user_id_pk" PRIMARY KEY("temporada_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "temporadas" (
	"id" text PRIMARY KEY NOT NULL,
	"inicio" timestamp DEFAULT now() NOT NULL,
	"fim" timestamp,
	"ativa" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_conquistas" (
	"user_id" text NOT NULL,
	"conquista_chave" text NOT NULL,
	"ganho_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_conquistas_user_id_conquista_chave_pk" PRIMARY KEY("user_id","conquista_chave")
);
--> statement-breakpoint
ALTER TABLE "amizades" ADD CONSTRAINT "amizades_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amizades" ADD CONSTRAINT "amizades_amigo_id_user_id_fk" FOREIGN KEY ("amigo_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_alvo_user_id_user_id_fk" FOREIGN KEY ("alvo_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_autor_id_user_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liga_membros" ADD CONSTRAINT "liga_membros_temporada_id_temporadas_id_fk" FOREIGN KEY ("temporada_id") REFERENCES "public"."temporadas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liga_membros" ADD CONSTRAINT "liga_membros_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_conquistas" ADD CONSTRAINT "user_conquistas_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "amizades_amigo_idx" ON "amizades" USING btree ("amigo_id");--> statement-breakpoint
CREATE INDEX "liga_membros_rank_idx" ON "liga_membros" USING btree ("temporada_id","nivel");