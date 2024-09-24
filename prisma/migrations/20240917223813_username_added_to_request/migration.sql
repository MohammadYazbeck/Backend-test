/*
  Warnings:

  - Added the required column `username` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "username" TEXT NOT NULL;
