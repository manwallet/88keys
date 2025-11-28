-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teacher" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LessonItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lessonId" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonItem_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonItem_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Piece" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "composer" TEXT NOT NULL,
    "workNumber" TEXT,
    "genre" TEXT,
    "totalPages" INTEGER NOT NULL DEFAULT 0,
    "learnedPages" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "difficulty" TEXT,
    "assignedBy" TEXT,
    "notes" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Piece_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Piece" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Piece" ("assignedBy", "composer", "createdAt", "difficulty", "genre", "id", "learnedPages", "notes", "status", "title", "totalPages", "updatedAt", "workNumber") SELECT "assignedBy", "composer", "createdAt", "difficulty", "genre", "id", "learnedPages", "notes", "status", "title", "totalPages", "updatedAt", "workNumber" FROM "Piece";
DROP TABLE "Piece";
ALTER TABLE "new_Piece" RENAME TO "Piece";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
