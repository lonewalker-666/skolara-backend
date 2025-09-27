import type { Seeder } from "./_types";

export const EntranceExamSeeder: Seeder = {
  name: "Entrance Exams",
  async run(prisma) {
    await prisma.entrance_exam.createMany({
      data: [
        { name: "SRMJEEE" },
        { name: "JEE Main" },
        { name: "JEE Advanced" },
        { name: "NEET" },
        { name: "CLAT" },
        { name: "LSAT" },
        { name: "CAT" },
        { name: "GMAT" },
        { name: "VITEEE"}
      ],
      skipDuplicates: true,
    });
  },
};
