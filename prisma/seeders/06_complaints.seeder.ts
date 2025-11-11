import type { Seeder } from "./_types";

export const ComplaintsSeeder: Seeder = {
  name: "Complaints",
  async run(prisma) {
    await prisma.complaints.createMany({
      data: [
        {
          question: "Facing issues while applying to a college",
          answer:
            "Please make sure all required details are filled correctly and your internet connection is stable. If the issue continues, contact Skolara Support at 📞 +91 XXX-XXX-XXXX.",
        },
        {
          question: "Payment not going through",
          answer:
            "Verify your payment details and ensure your method has sufficient balance. If payment was deducted but not updated, share your transaction ID with our team at 📞 +91 XXX-XXX-XXXX.",
        },
        {
          question: "Applied college but not showing",
          answer:
            "Sometimes it takes a few minutes for your application to reflect. Try refreshing or reopening the app. If it still doesn’t appear, contact us at 📞 +91 XXX-XXX-XXXX with your application ID.",
        },
        {
          question: "App not loading or crashing",
          answer:
            "Try clearing cache or updating the app to the latest version. If the issue continues, please reach out to 📞 +91 XXX-XXX-XXXX for technical assistance.",
        },
        {
          question: "Need help from a counsellor",
          answer:
            "You can request a call or chat session with our counsellor anytime. Call us directly at 📞 +91 XXX-XXX-XXXX for guidance.",
        },
      ],
      skipDuplicates: true,
    });
  },
};
