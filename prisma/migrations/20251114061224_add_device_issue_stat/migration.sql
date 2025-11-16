-- CreateTable
CREATE TABLE "DeviceIssueStat" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "conversationId" TEXT,
    "serviceType" TEXT,
    "deviceType" TEXT,
    "deviceBrand" TEXT,
    "deviceModel" TEXT,
    "problemDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceIssueStat_pkey" PRIMARY KEY ("id")
);
