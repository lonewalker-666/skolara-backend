import type { Seeder } from "./_types";

export const DegreeTypeSeeder: Seeder = {
  name: "Degree Types",
  async run(prisma) {
    await prisma.degree_type.createMany({
      data: [
        { name: "Under Graduate", short_name: "UG" },
        { name: "Post Graduate", short_name: "PG" },
        { name: "Doctoral Programs", short_name: "PhD" },
      ],
      skipDuplicates: true,
    });
  },
};
