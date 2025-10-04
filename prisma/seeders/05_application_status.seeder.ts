import type { Seeder } from "./_types";

export const ApplicationStatusSeeder: Seeder = {
  name: "Application Status",
  async run(prisma) {
    await prisma.application_status.createMany({
      data: [
        { name: "Applied" },
        { name: "Submitted" },
        { name: "Under Review" },
        { name: "Accepted" },
        { name: "Documents" },
      ],
      skipDuplicates: true,
    });
  },
};
