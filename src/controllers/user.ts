import { prisma } from "../db/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { updateUserProfileSchema } from "../schemas/user";

export async function getUserProfile(req: FastifyRequest, reply: FastifyReply) {
  try {
    const user = req.user;
    if (!user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    console.log("getUserProfile body --------- ", req.body);
    const profile = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: {
        ref_id: true,
        mobile: true,
        email: true,
        first_name: true,
        last_name: true,
        gender: true,
        dob: true,
        prefered_theme: true,
        allow_notifications: true,
      },
    });

    if (!profile) {
      return reply.code(404).send({ error: "User not found" });
    }
    const profileData = {
      user_id: profile.ref_id,
      mobile: profile.mobile,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      gender: profile.gender,
      dob: profile.dob,
      prefered_theme: profile.prefered_theme,
      allow_notifications: profile.allow_notifications,
    };
    return reply.send(profileData);
  } catch (e: any) {
    const status = e?.statusCode ?? 400;
    return reply.code(status).send({ error: e?.message ?? "FAILED" });
  }
}

export async function updateUserProfile(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = req.user;
    if (!user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    console.log("updateUserProfile body --------- ", req.body);
    const profile = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: {
        id: true,
      },
    });

    if (!profile) {
      return reply.code(404).send({ error: "User not found" });
    }

    const updateData = updateUserProfileSchema.parse(req.body);
    const { first_name, last_name, gender, dob } = updateData;
    await prisma.users.update({
      where: { id: profile.id },
      data: {
        first_name,
        last_name,
        gender,
        dob,
        email: updateData.email.toLowerCase(),
        mobile: updateData.mobile,
      },
    });

    return reply.send({ message: "Profile updated successfully" });
  } catch (e: any) {
    const status = e?.statusCode ?? 400;
    if (e?.message?.includes("Unique constraint failed")) {
      return reply.code(400).send({ error: "Email or Mobile already exists" });
    }
    return reply.code(status).send({ error: e?.message ?? "FAILED" });
  }
}
