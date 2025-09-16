import { FastifyInstance } from "fastify";
import { JwtService } from "../services/jwt";
import {
  sendOtp,
  verifyOtp,
  assertLoginWindow,
  assertSignupWindow,
} from "../services/otp";
import { prisma } from "../db/client";
import { errorCodes } from "../utils/errors";

export default async function authRoutes(app: FastifyInstance) {
  // Send OTP
  // Send OTP
  app.post(
    "/auth/otp/send",
    {
      schema: {
        body: {
          type: "object",
          required: ["mobile"],
          properties: { mobile: { type: "string", pattern: "^[0-9]{10}$" } },
        },
      },
      config: {
        rateLimit: {
          max: 1,
          timeWindow: "30 seconds",
          keyGenerator: (req: { body: any; ip: any }) => {
            try {
              const b = req.body as any;
              return b?.mobile ?? req.ip; // per-mobile throttle; fallback to IP
            } catch {
              return req.ip;
            }
          },
        },
      },
    },
    async (req, reply) => {
      const { mobile } = req.body as { mobile: string };
      try {
        const { verificationId, expiresAt } = await sendOtp(prisma, mobile);
        return reply.send({ verificationId, expiresAt, message: "OTP_SENT" });
      } catch (e: any) {
        const status = e?.statusCode ?? 400;
        return reply.code(status).send({ error: e?.message ?? "FAILED" });
      }
    }
  );

  // Verify OTP
  app.post(
    "/auth/otp/verify",
    {
      schema: {
        // tags: ['Authentication'],
        body: {
          type: "object",
          required: ["mobile", "otp"],
          properties: {
            mobile: { type: "string", pattern: "^[0-9]{10}$" },
            otp: { type: "string", pattern: "^[0-9]{6}$" },
          },
        },
        // response: {
        //   200: {
        //     type: 'object',
        //     properties: {
        //       success: { type: 'boolean' },
        //       message: { type: 'string' }
        //     }
        //   }
        // }
      },
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
          keyGenerator: (req: { body: any; ip: any }) => {
            const b = req.body as any;
            return `verify:${b?.mobile ?? "na"}:${req.ip}`;
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const { mobile, otp } = req.body as { mobile: string; otp: string };
        const rec = await verifyOtp(prisma, mobile, otp);
        return reply.send({
          verificationId: rec.id,
          verified: true,
          expiresAt: rec.expires_at,
        });
      } catch (e: any) {
        const code = e?.statusCode ?? 400;
        return reply.code(code).send({ error: e?.message ?? "INVALID_OTP" });
      }
    }
  );

  // Login (after verify, within 30s)
  app.post(
    "/auth/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["verificationId", "mobile"],
          properties: {
            verificationId: { type: "string", format: "uuid" },
            mobile: { type: "string", pattern: "^[0-9]{10}$" },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const { verificationId, mobile } = req.body as {
          verificationId: string;
          mobile: string;
        };

        await assertLoginWindow(prisma, verificationId, mobile);

        // find or create user by mobile (mobile is unique in model)
        let user = await prisma.users.findUnique({ where: { mobile } });
        if (!user) {
          throw new Error(errorCodes.USER_NOT_FOUND);
        }
        if (!user.mobile_verified) {
          await prisma.users.update({
            where: { id: user.id },
            data: { mobile_verified: true },
          });
        }

        const accessToken = JwtService.signAccess({
          sub: user.id,
          mobile: user.mobile,
          email: user.email,
        });
        const refreshToken = JwtService.signRefresh({
          sub: user.id,
          mobile: user.mobile,
          email: user.email,
        });

        return reply.send({
          accessToken,
          refreshToken,
          user: { id: user.id, mobile: user.mobile, email: user.email },
        });
      } catch (e: any) {
        const code = e?.message === "OTP_WINDOW_EXPIRED" ? 401 : 401;
        return reply.code(code).send({ error: e?.message || "UNAUTHORIZED" });
      }
    }
  );

  // Signup (within 8 minutes after verify)
  app.post(
    "/auth/signup",
    {
      schema: {
        body: {
          type: "object",
          required: [
            "verificationId",
            "first_name",
            "last_name",
            "email",
            "course_type_id",
          ],
          properties: {
            verificationId: { type: "string", format: "uuid" },
            first_name: { type: "string", minLength: 1 },
            last_name: { type: "string", minLength: 1 },
            email: { type: "string", format: "email" },
            course_type_id: { type: "integer" },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        const { verificationId, first_name, last_name, email, course_type_id } =
          req.body as {
            verificationId: string;
            first_name: string;
            last_name: string;
            email: string;
            course_type_id: number;
          };

        const rec = await assertSignupWindow(prisma, verificationId);

        // ensure user exists or create one, now with full info
        const checkUser = await prisma.users.findUnique({
          where: { mobile: rec.mobile },
        });

        if (checkUser) {
          return reply
            .code(401)
            .send({
              error:
                checkUser.is_active === false
                  ? "ACCOUNT_DISABLED"
                  : "MOBILE_ALREADY_EXISTS",
            });
        }

        const user = await prisma.users.create({
          data: {
            mobile: rec.mobile,
            email,
            first_name,
            last_name,
            prefered_course_type: course_type_id,
            ref_id: crypto.randomUUID(),
            mobile_verified: true,
            email_verified: false,
          },
        });

        const accessToken = JwtService.signAccess({
          sub: user.id,
          mobile: user.mobile,
          email: user.email,
        });
        const refreshToken = JwtService.signRefresh({
          sub: user.id,
          mobile: user.mobile,
          email: user.email,
        });

        return reply.send({
          accessToken,
          refreshToken,
          user: { id: user.id, email: user.email, mobile: user.mobile },
        });
      } catch (e: any) {
        const msg = e?.message || "SIGNUP_FAILED";
        return reply.code(400).send({ error: msg });
      }
    }
  );

  // Exchange refresh token for new access token
  app.post(
    "/auth/token",
    {
      schema: {
        body: {
          type: "object",
          required: ["refreshToken"],
          properties: { refreshToken: { type: "string" } },
        },
      },
    },
    async (req, reply) => {
      try {
        const { refreshToken } = req.body as { refreshToken: string };
        const payload = JwtService.verifyRefresh(refreshToken);
        if (payload.type !== "refresh") throw new Error("INVALID_TOKEN");

        // Optionally check user is still active
        const user = await prisma.users.findUnique({
          where: { id: Number(payload.sub) },
        });
        if (!user || !user.is_active)
          return reply.code(401).send({ error: "UNAUTHORIZED" });

        const accessToken = JwtService.signAccess({
          sub: user.id,
          mobile: user.mobile,
          email: user.email,
        });
        return reply.send({ accessToken });
      } catch {
        return reply.code(401).send({ error: "UNAUTHORIZED" });
      }
    }
  );
}
