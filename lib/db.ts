// Temporary mock for Prisma Client until schema is fixed
class MockPrismaClient {
  user = {
    findUnique: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  };
  
  course = {
    findUnique: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  };
  
  // Add other models as needed
  $disconnect = async () => {};
  $connect = async () => {};
}

let PrismaClient: any = MockPrismaClient;

try {
  // Try to import the real Prisma client
  const prismaModule = require("@prisma/client");
  if (prismaModule.PrismaClient) {
    PrismaClient = prismaModule.PrismaClient;
  }
} catch (error) {
  console.warn("Prisma Client not generated. Using mock client.");
}

declare global {
  var prisma: any | undefined;
}

export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db; 