import type { PrismaClient } from '@prisma/client';

export interface Seeder {
  name: string;
  /** Run seeder; should be idempotent */
  run(prisma: PrismaClient): Promise<void>;
}
