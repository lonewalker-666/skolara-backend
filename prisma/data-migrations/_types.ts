import type { PrismaClient } from '@prisma/client';

export interface DataMigration {
  /** Unique name you’ll also record in app_data_migration.name */
  name: string;
  /** Apply changes (idempotent if possible) */
  up(prisma: PrismaClient): Promise<void>;
  /** Optional rollback */
  down?: (prisma: PrismaClient) => Promise<void>;
}