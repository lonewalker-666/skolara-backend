import type { Seeder } from './_types';

export const DegreeTypeSeeder: Seeder = {
  name: 'Degree Types',
  async run(prisma) {
    await prisma.degree_type.createMany({
      data: [
        { id: 1, name: 'Under Graduate', short_name: 'UG' },
        { id: 2, name: 'Post Graduate', short_name: 'PG' },
        { id: 3, name: 'Doctoral Programs', short_name: 'PhD' },
      ],
      skipDuplicates: true,
    });
  },
};
