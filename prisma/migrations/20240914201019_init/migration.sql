-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
    "deviceNumber" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" SERIAL NOT NULL,
    "method" TEXT NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditOption" (
    "id" SERIAL NOT NULL,
    "option" TEXT NOT NULL,

    CONSTRAINT "CreditOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceNumber_key" ON "Device"("deviceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_method_key" ON "PaymentMethod"("method");

-- CreateIndex
CREATE UNIQUE INDEX "CreditOption_option_key" ON "CreditOption"("option");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
