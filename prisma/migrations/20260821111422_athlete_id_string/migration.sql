-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_strava_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "athleteId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "scopes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_strava_accounts" ("accessToken", "athleteId", "createdAt", "expiresAt", "id", "refreshToken", "scopes", "updatedAt") SELECT "accessToken", "athleteId", "createdAt", "expiresAt", "id", "refreshToken", "scopes", "updatedAt" FROM "strava_accounts";
DROP TABLE "strava_accounts";
ALTER TABLE "new_strava_accounts" RENAME TO "strava_accounts";
CREATE UNIQUE INDEX "strava_accounts_athleteId_key" ON "strava_accounts"("athleteId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
