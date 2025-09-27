import { prisma } from "../db/client";
import { FastifyReply, FastifyRequest } from "fastify";
import  toHttpError from "../utils/toHttpError";

export async function getColleges(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { category } = request.query as { category: string };

    const user = request.user;
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    console.log("getColleges query --------- ", request.query);

    const checkUser = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: { id: true },
    });
    if (!checkUser) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const where = category ? { college_type_id: Number(category) } : undefined;
    const colleges = await prisma.college.findMany({
      where: where,
      orderBy: { name: "asc" },
      select: {
        ref_id: true,
        name: true,
        area: true,
        city: true,
        logo_url: true,
        applied_by: {
          where: { user_id: checkUser.id, is_active: true },
        },
      },
    });
    const list = colleges.map((college) => {
      return {
        id: college.ref_id,
        name: college.name,
        area: college.area,
        city: college.city,
        logo_url: college.logo_url,
        is_applied: college.applied_by.length > 0,
      };
    });
    return reply.send(list);
  } catch (e: any) {
    console.log("getColleges error --------- ", e);
    const { status, payload } = toHttpError(e);
    return reply.status(status).send(payload);
  }
}

export async function getCollegeById(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
      const user = request.user;
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    console.log("getCollege BY ID params --------- ", request.params);

    const checkUser = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: { id: true },
    });
    if (!checkUser) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

  const college = await prisma.college.findUnique({
    where: { ref_id: id },
    select: {
      ref_id: true,
      name: true,
      area: true,
      city: true,
      logo_url: true,
      cover_url: true,
      description: true,
      deadline: true,
      eligibility: {
      select: {
        id: true,
        criteria: true,
        min_percentage: true,
        max_percentage:true,
        degree: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
        entrance_exam: { select: { id: true, name: true } },
      },
      orderBy: { id: 'asc' },
    },
      saved_by: {
        where: { user_id: checkUser.id, deleted_at: null },
      },
      applied_by: {
        where: { user_id: checkUser.id, is_active: true },
      },
    },
  });
  if (!college) {
    return reply.status(404).send({ message: "College not found" });
  }
  return reply.send({
    id: college.ref_id,
    name: college.name,
    area: college.area,
    city: college.city,
    logo_url: college.logo_url,
    cover_url: college.cover_url,
    is_saved: college.saved_by.length > 0,
    is_applied: college.applied_by.length > 0,
    description: college.description,
    deadline: college.deadline,
    eligibility: college.eligibility,
  });
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
    console.log("getCategory error --------- ", e);
    const { status, payload } = toHttpError(e);
    return reply.status(status).send(payload);
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
        saved: existing.deleted_at ? true : false,
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
    console.log("saveCollege error --------- ", e);
    const { status, payload } = toHttpError(e);
    return reply.status(status).send(payload);
  }
}
