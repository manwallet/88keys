-- CreateTable
CREATE TABLE "DailyPracticeItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "pieceTitle" TEXT NOT NULL,
    "pieceComposer" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyPracticeItem_date_pieceId_key" ON "DailyPracticeItem"("date", "pieceId");
