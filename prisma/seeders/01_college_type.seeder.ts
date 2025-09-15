import type { Seeder } from './_types';

export const CollegeTypeSeeder: Seeder = {
  name: 'College Types',
  async run(prisma) {
    await prisma.college_type.createMany({
      data: [
        { id: 1, name: 'Engineering' },
        { id: 2, name: 'Medical' },
        { id: 3, name: 'Law' },
        { id: 4, name: 'Arts & Science' },
      ],
      skipDuplicates: true,
    });
  },
};
