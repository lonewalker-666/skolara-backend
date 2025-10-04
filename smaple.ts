// src/routes/applications.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import multipart from "@fastify/multipart";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "../prisma";
import { supabase } from "../lib/supabase"; // createClient etc.
import { statusId } from "../status";

type JwtUser = { sub: string };

export async function applicationRoutes(app: FastifyInstance) {
  await app.register(multipart);

  /**
   * 1) UPLOAD PDF
   * POST /api/applications/:collegeRefId/upload?type=sslc|hsc
   * - keeps a draft application (is_active=false)
   * - deletes previous same-type file
   * - uploads new file and updates tracking
   */
  app.post(
    "/api/applications/:collegeRefId/upload",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user as JwtUser | undefined;
      if (!user) return reply.status(401).send({ error: "Unauthorized" });

      const { type } = (request.query ?? {}) as { type?: "sslc" | "hsc" };
      if (type !== "sslc" && type !== "hsc") {
        return reply.status(400).send({ error: "type must be 'sslc' or 'hsc'" });
      }

      const { collegeRefId } = request.params as { collegeRefId: string };

      // file
      const file = await (request as any).file();
      if (!file) return reply.status(400).send({ error: "No file uploaded" });
      if (file.mimetype !== "application/pdf") {
        return reply.status(400).send({ error: "Only PDF allowed" });
      }

      // user + college
      const dbUser = await prisma.users.findUnique({
        where: { ref_id: user.sub },
        select: { id: true },
      });
      if (!dbUser) return reply.status(401).send({ error: "Unauthorized" });

      const college = await prisma.college.findUnique({
        where: { ref_id: collegeRefId },
        select: { id: true },
      });
      if (!college) return reply.status(404).send({ error: "College not found" });

      // ensure draft application exists (is_active=false)
      let draft = await prisma.applied_colleges.findFirst({
        where: { user_id: dbUser.id, college_id: college.id, is_active: false },
        select: { id: true },
      });

      if (!draft) {
        // new draft starts in status "Applied"
        draft = await prisma.applied_colleges.create({
          data: {
            user_id: dbUser.id,
            college_id: college.id,
            is_active: false,
            degree: "", // filled at /apply
            application_status_id: await statusId("Applied"),
          },
          select: { id: true },
        });
      }

      // ensure tracking exists
      let tracking = await prisma.application_tracking.findFirst({
        where: { application_id: draft.id },
        select: { id: true, ssl_marksheet: true, hsc_marksheet: true },
      });
      if (!tracking) {
        tracking = await prisma.application_tracking.create({
          data: { application_id: draft.id },
          select: { id: true, ssl_marksheet: true, hsc_marksheet: true },
        });
      }

      // delete old file (if any)
      const oldPath = type === "sslc" ? tracking.ssl_marksheet : tracking.hsc_marksheet;
      if (oldPath) {
        await supabase.storage.from("applications").remove([oldPath]).catch(() => {});
      }

      // upload new
      const name = `${type}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.pdf`;
      const storagePath = path.posix.join(
        String(dbUser.id),
        String(college.id),
        name
      );

      const { error } = await supabase.storage
        .from("applications")
        .upload(storagePath, file.file, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (error) {
        return reply.status(500).send({ error: "Upload failed", details: error.message });
      }

      // update DB
      await prisma.application_tracking.update({
        where: { id: tracking.id },
        data: type === "sslc" ? { ssl_marksheet: storagePath } : { hsc_marksheet: storagePath },
      });

      return reply.send({ ok: true, path: storagePath, application_id: draft.id });
    }
  );

  /**
   * 2) APPLY
   * POST /api/applications/:collegeRefId/apply  body: { degree: string }
   * - must not have active application
   * - SSLC must be uploaded; HSC optional
   * - flips draft to active, sets status to "Submitted" and submitted_at timestamp
   */
  app.post(
    "/api/applications/:collegeRefId/apply",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user as JwtUser | undefined;
      if (!user) return reply.status(401).send({ error: "Unauthorized" });

      const { collegeRefId } = request.params as { collegeRefId: string };
      const { degree: degreeRaw } = (request.body ?? {}) as { degree?: string };
      const degree = (degreeRaw ?? "").trim();
      if (!degree) return reply.status(400).send({ error: "degree is required" });

      const dbUser = await prisma.users.findUnique({
        where: { ref_id: user.sub },
        select: { id: true },
      });
      if (!dbUser) return reply.status(401).send({ error: "Unauthorized" });

      const college = await prisma.college.findUnique({
        where: { ref_id: collegeRefId },
        select: { id: true },
      });
      if (!college) return reply.status(404).send({ error: "College not found" });

      // any active app already?
      const active = await prisma.applied_colleges.findFirst({
        where: { user_id: dbUser.id, college_id: college.id, is_active: true },
        select: { id: true },
      });
      if (active) {
        return reply.status(409).send({ error: "Active application already exists" });
      }

      // locate draft & tracking
      const draft = await prisma.applied_colleges.findFirst({
        where: { user_id: dbUser.id, college_id: college.id, is_active: false },
        select: { id: true },
      });
      if (!draft) {
        return reply.status(400).send({ error: "No draft found. Upload SSLC first." });
      }

      const tracking = await prisma.application_tracking.findFirst({
        where: { application_id: draft.id },
        select: { ssl_marksheet: true },
      });
      if (!tracking?.ssl_marksheet) {
        return reply.status(400).send({ error: "SSLC marksheet PDF is required" });
      }

      // flip to active and mark Submitted
      const now = new Date();
      const submittedId = await statusId("Submitted");

      const updated = await prisma.applied_colleges.update({
        where: { id: draft.id },
        data: {
          is_active: true,
          degree,
          application_status_id: submittedId,
          submitted_at: now,
          // leave other timestamps null; they’ll be set by your backoffice workflow
        },
        select: { id: true, application_status_id: true },
      });

      return reply.send({
        ok: true,
        application_id: updated.id,
        status_id: updated.application_status_id,
      });
    }
  );

  /**
   * 3) LIST APPLIED COLLEGES (active)
   * GET /api/applied-colleges
   * - user from JWT
   * - returns shape you provided + status_id
   */
  app.get(
    "/api/applied-colleges",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user as JwtUser | undefined;
      if (!user) return reply.status(401).send({ error: "Unauthorized" });

      const dbUser = await prisma.users.findUnique({
        where: { ref_id: user.sub },
        select: { id: true },
      });
      if (!dbUser) return reply.status(401).send({ error: "Unauthorized" });

      const rows = await prisma.applied_colleges.findMany({
        where: { user_id: dbUser.id, is_active: true },
        orderBy: { created_at: "desc" },
        select: {
          application_status_id: true,
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

      const list = rows.map((r) => ({
        id: r.college.ref_id,
        name: r.college.name,
        area: r.college.area,
        city: r.college.city,
        logo_url: r.college.logo_url,
        is_applied: true,
        status_id: r.application_status_id,
      }));

      return reply.send(list);
    }
  );
}
