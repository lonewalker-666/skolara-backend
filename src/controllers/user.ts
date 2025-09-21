import { prisma } from "../db/client";
import { FastifyReply, FastifyRequest } from "fastify";

export async function getUserProfile(req: FastifyRequest, reply: FastifyReply) {
  try {
    const user = req.user;
    if (!user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

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
      },
    });

    if (!profile) {
      return reply.code(404).send({ error: "User not found" });
    }

    return reply.send(profile);
  } catch (e: any) {
    const status = e?.statusCode ?? 400;
    return reply.code(status).send({ error: e?.message ?? "FAILED" });
  }
}
