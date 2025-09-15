import type { Seeder } from './_types';

export const ApplicationStatusSeeder: Seeder = {
  name: 'Application Status',
  async run(prisma) {
    await prisma.application_status.createMany({
      data: [
        { id: 1, name: 'Applied' },
        { id: 2, name: 'Ready To Pay' },
        { id: 3, name: 'Submitted' },
        { id: 4, name: 'Under Review' },
        { id: 5, name: 'Accepted' },
        { id: 6, name: 'Documents Verified' },
      ],
      skipDuplicates: true,
    });
  },
};
