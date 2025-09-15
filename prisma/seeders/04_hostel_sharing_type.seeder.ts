import type { Seeder } from './_types';

export const HostelSharingTypeSeeder: Seeder = {
  name: 'Hostel Sharing Types',
  async run(prisma) {
    await prisma.hostel_sharing_type.createMany({
      data: [
        { id: 1, name: 'Single' },
        { id: 2, name: 'Double' },
        { id: 3, name: 'Triple' },
      ],
      skipDuplicates: true,
    });
  },
};
