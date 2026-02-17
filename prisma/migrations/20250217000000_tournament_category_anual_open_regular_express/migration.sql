-- AlterEnum: Migrate TournamentCategory from A/B/C/D to ANUAL/OPEN/REGULAR/EXPRESS
-- Table is mapped as "tournaments" in Prisma
CREATE TYPE "TournamentCategory_new" AS ENUM ('ANUAL', 'OPEN', 'REGULAR', 'EXPRESS');

ALTER TABLE "tournaments" ADD COLUMN "category_new" "TournamentCategory_new";

UPDATE "tournaments" SET "category_new" = CASE
  WHEN "category" = 'A' THEN 'ANUAL'::"TournamentCategory_new"
  WHEN "category" = 'B' THEN 'OPEN'::"TournamentCategory_new"
  WHEN "category" = 'C' THEN 'REGULAR'::"TournamentCategory_new"
  WHEN "category" = 'D' THEN 'EXPRESS'::"TournamentCategory_new"
  ELSE 'REGULAR'::"TournamentCategory_new"
END;

UPDATE "tournaments" SET "category_new" = 'REGULAR'::"TournamentCategory_new" WHERE "category_new" IS NULL;

ALTER TABLE "tournaments" DROP COLUMN "category";

ALTER TABLE "tournaments" RENAME COLUMN "category_new" TO "category";

ALTER TABLE "tournaments" ALTER COLUMN "category" SET NOT NULL;

DROP TYPE "TournamentCategory";

ALTER TYPE "TournamentCategory_new" RENAME TO "TournamentCategory";
