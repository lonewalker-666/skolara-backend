import type { Seeder } from "./_types";

export const HostelSharingTypeSeeder: Seeder = {
  name: "Hostel Sharing Types",
  async run(prisma) {
    await prisma.hostel_sharing_type.createMany({
      data: [{ name: "Single" }, { name: "Double" }, { name: "Triple" }],
      skipDuplicates: true,
    });
  },
};
