import { FastifyInstance } from "fastify";
import {
  sendOtpController as sendOtp,
  verifyOtpController as verifyOtp,
  login,
  signup,
  refreshToken,
} from "../controllers/auth";

export default async function authRoutes(app: FastifyInstance) {
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
    sendOtp
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
    verifyOtp
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
            verificationId: { type: "string"},
            mobile: { type: "string", pattern: "^[0-9]{10}$" },
          },
        },
      },
    },
    login
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
            "mobile",
            "first_name",
            "last_name",
            "email",
            "course_type_id",
          ],
          properties: {
            verificationId: { type: "string" },
            mobile: { type: "string", pattern: "^[0-9]{10}$" },
            first_name: { type: "string", minLength: 1 },
            last_name: { type: "string", minLength: 1 },
            email: { type: "string", format: "email" },
            course_type_id: { type: "integer" },
          },
        },
      },
    },
    signup
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
    refreshToken
  );
}
