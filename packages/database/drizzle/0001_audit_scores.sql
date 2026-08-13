CREATE TABLE IF NOT EXISTS "audit_scores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "audit_run_id" uuid NOT NULL UNIQUE REFERENCES "audit_runs"("id"),
  "overall" integer NOT NULL,
  "seo" integer NOT NULL,
  "performance" integer,
  "categories" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE "audit_runs"
  ADD COLUMN IF NOT EXISTS "crawl_id" uuid REFERENCES "crawls"("id"),
  ADD COLUMN IF NOT EXISTS "mode" text NOT NULL DEFAULT 'seo';
