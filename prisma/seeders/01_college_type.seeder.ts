import type { Seeder } from "./_types";

export const CollegeTypeSeeder: Seeder = {
  name: "College Types",
  async run(prisma) {
    await prisma.college_type.createMany({
      data: [
        { name: "Engineering" },
        { name: "Medical" },
        { name: "Law" },
        { name: "Arts & Science" },
      ],
      skipDuplicates: true,
    });
  },
};
