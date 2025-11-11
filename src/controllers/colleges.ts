import { prisma } from "../db/client";
import { FastifyReply, FastifyRequest } from "fastify";
import toHttpError from "../utils/toHttpError";
import { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { getSignedUrl } from "../services/storageService";
import { pl, tr } from "zod/v4/locales";

export async function getColleges(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Accept both ?search= and ?name= as the search term (name is an alias)
    const { category, search, name } = request.query as {
      category?: string;
      search?: string;
      name?: string; // alias for search
    };

    const user = request.user;
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const checkUser = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: { id: true },
    });
    if (!checkUser) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    // prefer ?search= but fall back to ?name=
    const qRaw = (search ?? name ?? "").trim();
    const hasQ = qRaw.length > 0;

    // category validation
    const cat =
      typeof category !== "undefined" && category !== ""
        ? Number(category)
        : undefined;

    if (category !== undefined && !Number.isFinite(cat)) {
      return reply.status(400).send({ error: "Invalid 'category' value" });
    }

    const where: Prisma.collegeWhereInput = {
      ...(cat !== undefined ? { college_type_id: cat } : {}),
      ...(hasQ
        ? {
            OR: [
              { name: { startsWith: qRaw, mode: "insensitive" } },
              { short_name: { contains: qRaw, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const colleges = await prisma.college.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        ref_id: true,
        name: true,
        area: true,
        city: true,
        logo_url: true,
        applied_by: {
          where: { user_id: checkUser.id, is_active: true },
          select: { id: true },
        },
      },
    });

    const list = colleges.map((college) => ({
      id: college.ref_id,
      name: college.name,
      area: college.area,
      city: college.city,
      logo_url: college.logo_url,
      is_applied: college.applied_by.length > 0,
    }));

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
          criteria_type: true,
          criteria: true,
        },
        orderBy: { id: "asc" },
      },
      scholarships: {
        select: {
          id: true,
          schemes: true,
        },
        orderBy: { id: "asc" },
      },
      saved_by: {
        where: { user_id: checkUser.id, deleted_at: null },
      },
      applied_by: {
        where: { user_id: checkUser.id, is_active: true },
      },
      placement_cell: {
        select: {
          id: true,
          description: true,
        },
      },
      placement_stats:{
        take: 1,
        select: {
          id: true,
          year: true,
          min_package_lpa: true,
          highest_package_lpa: true,
          notes: true,
      },
      orderBy: {
        year: "desc",
      },
      },
      hostel_facilities: {
        select: {
          id: true,
          gender: true,
          sharing_type:{
            select: {
              id: true,
              name: true,
            }
          },
          room_fee: true,
          mess_fee: true,
          ac: true,
          billing_cycle: true,
          notes: true,
          currency: true,
        },
      },
      top_recruiters: {
        select: {
          id: true,
          company: true,
        },
      },
    },
  });
  if (!college) {
    return reply.status(404).send({ message: "College not found" });
  }
  console.log("getCollege BY ID --------- ", college);
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
    scholarships: college.scholarships,
    placement_cell: college.placement_cell[0].description || "",
    hostel_facilities: college.hostel_facilities,
    placement_stats: college.placement_stats[0] || null,
    top_recruiters: college.top_recruiters[0] || null,
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

export const getSavedColleges = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    console.log("getSavedColleges body --------- ", request.body);

    const dbUser = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: { id: true, ref_id: true },
    });

    if (!dbUser) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const savedColleges = await prisma.saved_colleges.findMany({
      where: {
        user_id: dbUser.id,
        deleted_at: null,
      },
      select: {
        college: {
          select: {
            ref_id: true,
            name: true,
            area: true,
            city: true,
            logo_url: true,
            applied_by: {
              select: {
                user_id: true,
                is_active: true,
              },
            },
          },
        },
      },
    });

    const list = savedColleges.map((college: any) => {
      return {
        id: college.college.ref_id,
        name: college.college.name,
        area: college.college.area,
        city: college.college.city,
        logo_url: college.college.logo_url,
        is_applied: college.college.applied_by.length > 0,
      };
    });

    return reply.status(200).send(list);
  } catch (e: any) {
    console.log("getSavedColleges error --------- ", e);
    const { status, payload } = toHttpError(e);
    return reply.status(status).send(payload);
  }
};

export const getAppliedColleges = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    console.log("getAppliedColleges body --------- ", request.body);

    const dbUser = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: { id: true, ref_id: true },
    });

    if (!dbUser) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const appliedColleges = await prisma.applied_colleges.findMany({
      where: {
        user_id: dbUser.id,
        is_active: true,
      },
      select: {
        ref_id: true,
        applied_at: true,
        ready_to_pay: true,
        documents_verified_at: true,
        reviewed_at: true,
        submitted_at: true,
        accepted_at: true,
        paid_at: true,
        paid: true,
        is_active: true,
        amount: true,
        application_status_id: true,
        status: {
          select: { name: true },
        },
        hsc_path: true,
        sslc_path: true,
        // order: {
        //   select: {
        //     id: true,
        //     provider_order_id: true,
        //     amount: true,
        //     currency: true,
        //     status: true,
        //     created_at: true,
        //   },
        // },
        college: {
          select: {
            ref_id: true,
            name: true,
            area: true,
            city: true,
            logo_url: true,
          },
        },
        
      },
    });

    const list = await Promise.all( appliedColleges.map(async (application: any) => {
      const hscSignedUrl = application.hsc_path
        ? await getSignedUrl(
            request.server,
            env.SUPABASE_BUCKET,
            application.hsc_path,
            60 * 60 
          )
        : null;
      const sslcSignedUrl = application.sslc_path
        ? await getSignedUrl(
            request.server,
            env.SUPABASE_BUCKET,
            application.sslc_path,
            60 * 60 
          )
        : null;

      return {
        id: application.ref_id,
        applied_at: application.applied_at,
        ready_to_pay: application.ready_to_pay,
        documents_verified_at: application.documents_verified_at,
        reviewed_at: application.reviewed_at,
        submitted_at: application.submitted_at,
        accepted_at: application.accepted_at,
        paid_at: application.paid_at,
        paid: application.paid,
        is_active: application.is_active,
        amount: application.amount,
        application_status_id: application.application_status_id,
        status: application.status.name,
        hsc_path: application.hsc_path,
        hsc_signed_url: hscSignedUrl,
        sslc_path: application.sslc_path,
        sslc_signed_url: sslcSignedUrl,
        college: {
          id: application.college.ref_id,
          name: application.college.name,
          area: application.college.area,
          city: application.college.city,
          logo_url: application.college.logo_url,
        },
      };
    }));

    return reply.status(200).send(list);
  } catch (e: any) {
    console.log("getAppliedColleges error --------- ", e);
    const { status, payload } = toHttpError(e);
    return reply.status(status).send(payload);
  }
};

export const applyCollege = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    console.log("applyCollege body --------- ", request.body);

    const dbUser = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: { id: true, ref_id: true },
    });

    if (!dbUser) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const {
      college_id,
      hsc_path = null,
      sslc_path,
    } = request.body as {
      college_id: string;
      hsc_path?: string;
      sslc_path: string;
    };

    const college = await prisma.college.findUnique({
      where: { ref_id: college_id },
      select: { id: true, ref_id: true, name: true },
    });

    if (!college) {
      return reply.status(404).send({ error: "College not found" });
    }

    const existing = await prisma.applied_colleges.findFirst({
      where: {
        user_id: dbUser.id,
        college_id: college.id,
        is_active: true,
      },
    });

    if (existing) {
      return reply.status(400).send({
        message: "You have already applied for this college",
      });
    }

    const application = await prisma.applied_colleges.create({
      data: {
        user_id: dbUser.id,
        college_id: college.id,
        is_active: true,
        hsc_path: hsc_path,
        sslc_path: sslc_path,
      },
    });

    return reply.status(201).send({
      message: "College applied",
      applicationId: application.ref_id,
    });
  } catch (e: any) {
    console.log("applyCollege error --------- ", e);
    const { status, payload } = toHttpError(e);
    return reply.status(status).send(payload);
  }
};
