import type { Seeder } from './_types';

export const EntranceExamSeeder: Seeder = {
  name: 'Entrance Exams',
  async run(prisma) {
    await prisma.entrance_exam.createMany({
      data: [
        { id: 1, name: 'SRMJEEE' },
        { id: 2, name: 'JEE Main' },
        { id: 3, name: 'JEE Advanced' },
        { id: 4, name: 'NEET' },
        { id: 5, name: 'CLAT' },
        { id: 6, name: 'LSAT' },
        { id: 7, name: 'CAT' },
        { id: 8, name: 'GMAT' },
      ],
      skipDuplicates: true,
    });
  },
};
