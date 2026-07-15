-- CreateTable
CREATE TABLE "NutritionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "targetCalories" INTEGER NOT NULL,
    "proteinGoal" INTEGER NOT NULL,
    "carbsGoal" INTEGER NOT NULL,
    "fatGoal" INTEGER NOT NULL,
    "waterGoalMl" INTEGER NOT NULL,
    "planJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NutritionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "waterIntakeMl" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NutritionPlan_userId_idx" ON "NutritionPlan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionPlan_userId_weekNumber_key" ON "NutritionPlan"("userId", "weekNumber");

-- CreateIndex
CREATE INDEX "NutritionLog_userId_idx" ON "NutritionLog"("userId");

-- CreateIndex
CREATE INDEX "NutritionLog_date_idx" ON "NutritionLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionLog_userId_date_key" ON "NutritionLog"("userId", "date");
