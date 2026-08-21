-- CreateTable
CREATE TABLE "strava_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "athleteId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "scopes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stravaAccountId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sessions_stravaAccountId_fkey" FOREIGN KEY ("stravaAccountId") REFERENCES "strava_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "strava_accounts_athleteId_key" ON "strava_accounts"("athleteId");

-- CreateIndex
CREATE INDEX "sessions_stravaAccountId_idx" ON "sessions"("stravaAccountId");
