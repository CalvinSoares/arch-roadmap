CREATE TABLE "jornada_estado" (
	"user_id" text NOT NULL,
	"no_id" text NOT NULL,
	"estrelas" integer DEFAULT 0 NOT NULL,
	"concluido_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jornada_estado_user_id_no_id_pk" PRIMARY KEY("user_id","no_id")
);
--> statement-breakpoint
ALTER TABLE "jornada_estado" ADD CONSTRAINT "jornada_estado_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;