-- AlterEnum: Add ACCESSIBILITY value to IssueType enum
-- Safe: only adds a new value, no existing data is modified or removed
ALTER TYPE "IssueType" ADD VALUE 'ACCESSIBILITY';
