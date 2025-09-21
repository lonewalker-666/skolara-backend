import { check } from "zod/v4";
import { prisma } from "../db/client";
import { FastifyReply, FastifyRequest } from "fastify";

export async function getColleges(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const colleges = await prisma.college.findMany();
  return reply.send(colleges);
}

export async function getCollegeById(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
  const college = await prisma.college.findUnique({
    where: { ref_id: id },
  });
  if (!college) {
    return reply.status(404).send({ message: "College not found" });
  }
  return reply.send(college);
}

export async function getCategory(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const colleges = await prisma.college_type.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    return reply.send(colleges);
  } catch (e: any) {
    return reply
      .status(400)
      .send({ message: e?.message || "Internal Server Error" });
  }
}

export async function saveCollege(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    console.log("saveCollege body --------- ", request.body);

    const dbUser = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: { id: true, ref_id: true },
    });

    if (!dbUser) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const { college_id } = request.body as { college_id: string };

    const college = await prisma.college.findUnique({
      where: { ref_id: college_id },
      select: { id: true, ref_id: true, name: true },
    });

    if (!college) {
      return reply.status(404).send({ error: "College not found" });
    }

    const existing = await prisma.saved_colleges.findFirst({
      where: {
        user_id: dbUser.id,
        college_id: college.id,
      },
    });

    if (existing) {
      await prisma.saved_colleges.update({
        where: { id: existing.id },
        data: { deleted_at: existing.deleted_at ? null : new Date() },
      });
      return reply.status(200).send({
        message: existing.deleted_at
          ? "College saved"
          : "College removed from saved",
        saved: !existing.deleted_at,
      });
    }

    await prisma.saved_colleges.create({
      data: {
        user_id: dbUser.id,
        college_id: college.id,
      },
    });
    return reply.status(201).send({
      message: "College saved",
      saved: true,
    });
  } catch (e: any) {
    return reply
      .status(400)
      .send({ message: e?.message || "Internal Server Error" });
  }
}
