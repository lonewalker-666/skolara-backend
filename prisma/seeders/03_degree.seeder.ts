import type { Seeder } from "./_types";

export const DegreeSeeder: Seeder = {
  name: "Degrees",
  async run(prisma) {
    await prisma.degree.createMany({
      data: [
        { name: "B.Com", specialization: "General", degree_type_id: 1 },
        { name: "M.Com", specialization: "General", degree_type_id: 2 },
        { name: "PhD", specialization: "General", degree_type_id: 3 },
        { name: "B.Sc", specialization: "Computer Science", degree_type_id: 1 },
        { name: "M.Sc", specialization: "Computer Science", degree_type_id: 2 },
        { name: "PhD", specialization: "Computer Science", degree_type_id: 3 },
        {
          name: "B.Tech",
          specialization: "Computer Science",
          degree_type_id: 1,
        },
        {
          name: "M.Tech",
          specialization: "Computer Science",
          degree_type_id: 2,
        },
        { name: "PhD", specialization: "Computer Science", degree_type_id: 3 },
        { name: "BBA", specialization: "General", degree_type_id: 1 },
        { name: "MBA", specialization: "General", degree_type_id: 2 },
        { name: "PhD", specialization: "General", degree_type_id: 3 },
      ],
      skipDuplicates: true,
    });
  },
};
