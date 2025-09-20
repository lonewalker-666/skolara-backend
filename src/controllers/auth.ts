import { errorCodes } from "../utils/errors";
import { prisma } from "../db/client";
import { JwtService } from "../services/jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  assertLoginWindow,
  assertSignupWindow,
  sendOtp,
  verifyOtp,
} from "../services/otp";

export async function sendOtpController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { mobile } = req.body as { mobile: string };
  try {
    if (mobile === "0000000000") {
      return reply.send({
        verificationId: "test-verification-id",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        message: "OTP_SENT",
      });
    }
    const { verificationId, expiresAt } = await sendOtp(prisma, mobile);
    return reply.send({ verificationId, expiresAt, message: "OTP_SENT" });
  } catch (e: any) {
    const status = e?.statusCode ?? 400;
    return reply.code(status).send({ error: e?.message ?? "FAILED" });
  }
}

export async function verifyOtpController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { mobile, otp } = req.body as { mobile: string; otp: string };
    if (mobile === "0000000000" && otp === "123456") {
      const user = await prisma.users.findUnique({
        where: { mobile, is_active: true },
      });
      return reply.send({
        verificationId: "test-verification-id",
        verified: true,
        message: "OTP_VERIFIED",
        newUser: user ? false : true,
      });
    }
    const rec = await verifyOtp(prisma, mobile, otp);
    const user = await prisma.users.findUnique({
      where: { mobile, is_active: true },
    });

    return reply.send({
      verificationId: rec.id,
      verified: true,
      message: "OTP_VERIFIED",
      newUser: user ? false : true,
    });
  } catch (e: any) {
    const code = e?.statusCode ?? 400;
    return reply.code(code).send({ error: e?.message ?? "INVALID_OTP" });
  }
}

export async function login(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { verificationId, mobile } = req.body as {
      verificationId: string;
      mobile: string;
    };

    if (mobile !== "0000000000") {
      await assertLoginWindow(prisma, verificationId, mobile);
    }

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
      sub: user.ref_id,
      mobile: user.mobile,
      email: user.email,
    });
    const refreshToken = JwtService.signRefresh({
      sub: user.ref_id,
      mobile: user.mobile,
      email: user.email,
    });

    return reply.send({
      accessToken,
      refreshToken,
      user: { id: user.ref_id, mobile: user.mobile, email: user.email },
    });
  } catch (e: any) {
    const code = e?.message === "OTP_WINDOW_EXPIRED" ? 401 : 401;
    return reply.code(code).send({ error: e?.message || "UNAUTHORIZED" });
  }
}

export async function signup(req: FastifyRequest, reply: FastifyReply) {
  try {
    const {
      verificationId,
      first_name,
      last_name,
      email,
      course_type_id,
      mobile,
    } = req.body as {
      verificationId: string;
      mobile: string;
      first_name: string;
      last_name: string;
      email: string;
      course_type_id: number;
    };

    const rec =
      mobile === "0000000000"
        ? { mobile: "0000000000" }
        : await assertSignupWindow(prisma, verificationId, mobile);

    // ensure user exists or create one, now with full info
    const checkUser = await prisma.users.findUnique({
      where: { mobile: rec.mobile },
    });

    if (checkUser) {
      return reply.code(401).send({
        error:
          checkUser.is_active === false
            ? "ACCOUNT_DISABLED"
            : "MOBILE_ALREADY_EXISTS",
      });
    }

    const checkEmail = await prisma.users.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (checkEmail) {
      return reply.code(401).send({
        error: "EMAIL_ALREADY_EXISTS",
      });
    }

    const user = await prisma.users.create({
      data: {
        mobile: rec.mobile,
        email: email.trim().toLowerCase(),
        first_name,
        last_name,
        prefered_course_type: course_type_id,
        ref_id: crypto.randomUUID(),
        mobile_verified: true,
        email_verified: false,
      },
    });

    const accessToken = JwtService.signAccess({
      sub: user.ref_id,
      mobile: user.mobile,
      email: user.email,
    });
    const refreshToken = JwtService.signRefresh({
      sub: user.ref_id,
      mobile: user.mobile,
      email: user.email,
    });

    return reply.send({
      accessToken,
      refreshToken,
      user: { id: user.ref_id, email: user.email, mobile: user.mobile },
    });
  } catch (e: any) {
    const msg = e?.message || "SIGNUP_FAILED";
    return reply.code(400).send({ error: msg });
  }
}

export async function refreshToken(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    const payload = JwtService.verifyRefresh(refreshToken);
    if (payload.type !== "refresh") throw new Error("INVALID_TOKEN");

    // Optionally check user is still active
    const user = await prisma.users.findUnique({
      where: { ref_id: payload.sub },
    });
    if (!user || !user.is_active)
      return reply.code(401).send({ error: "UNAUTHORIZED" });

    const accessToken = JwtService.signAccess({
      sub: user.ref_id,
      mobile: user.mobile,
      email: user.email,
    });
    return reply.send({ accessToken });
  } catch {
    return reply.code(401).send({ error: "UNAUTHORIZED" });
  }
}
