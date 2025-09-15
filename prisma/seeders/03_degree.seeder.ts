import type { Seeder } from './_types';

export const DegreeSeeder: Seeder = {
  name: 'Degrees',
  async run(prisma) {
    await prisma.degree.createMany({
      data: [
        { id: 1, name: 'B.Com', specialization: 'General', degree_type_id: 1 },
        { id: 2, name: 'M.Com', specialization: 'General', degree_type_id: 2 },
        { id: 3, name: 'PhD', specialization: 'General', degree_type_id: 3 },
        { id: 4, name: 'B.Sc', specialization: 'Computer Science', degree_type_id: 1 },
        { id: 5, name: 'M.Sc', specialization: 'Computer Science', degree_type_id: 2 },
        { id: 6, name: 'PhD', specialization: 'Computer Science', degree_type_id: 3 },
        { id: 7, name: 'B.Tech', specialization: 'Computer Science', degree_type_id: 1 },
        { id: 8, name: 'M.Tech', specialization: 'Computer Science', degree_type_id: 2 },
        { id: 9, name: 'PhD', specialization: 'Computer Science', degree_type_id: 3 },
        { id: 10, name: 'BBA', specialization: 'General', degree_type_id: 1 },
        { id: 11, name: 'MBA', specialization: 'General', degree_type_id: 2 },
        { id: 12, name: 'PhD', specialization: 'General', degree_type_id: 3 },
      ],
      skipDuplicates: true,
    });
  },
};
