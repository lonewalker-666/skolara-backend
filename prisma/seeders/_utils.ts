import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const log = (msg: string) => {
  console.log(`🔹 ${msg}`);
};

export async function runInTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  // Note: Prisma recommends using `tx` variant: prisma.$transaction(async (tx) => { ... })
  // Here we pass the tx (any) as PrismaClient-like object for simplicity.
  return prisma.$transaction(async (tx: unknown) => fn(tx as unknown as PrismaClient));
}
