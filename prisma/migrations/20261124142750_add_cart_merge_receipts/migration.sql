-- CreateTable
CREATE TABLE "CartMergeReceipt" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "mergeId" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartMergeReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CartMergeReceipt_userId_mergeId_key" ON "CartMergeReceipt"("userId", "mergeId");

-- CreateIndex
CREATE INDEX "CartMergeReceipt_userId_createdAt_idx" ON "CartMergeReceipt"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "CartMergeReceipt" ADD CONSTRAINT "CartMergeReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
