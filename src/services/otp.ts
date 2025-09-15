import type { PrismaClient } from '@prisma/client';
import { sendSms } from './sns';
import { env } from '../config/env';

const OTP_TTL_SECONDS = Number(env.OTP_TTL_SECONDS ?? 300); // 5m
const OTP_MAX_VERIFY_ATTEMPTS = Number(env.OTP_MAX_VERIFY_ATTEMPTS ?? 5);
const OTP_MAX_PER_HOUR = Number(env.OTP_MAX_PER_HOUR ?? 5);


// 6-digit random OTP
function genOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

export async function sendOtp(prisma: PrismaClient, mobile: string) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // DB-backed hourly cap
  const recentCount = await prisma.otp_verification.count({
    where: { mobile, created_at: { gt: oneHourAgo } },
  });
  if (recentCount >= OTP_MAX_PER_HOUR) {
    const e: any = new Error('RATE_LIMITED_HOURLY');
    e.statusCode = 429;
    throw e;
  }

  // Deactivate existing actives
  await prisma.otp_verification.updateMany({
    where: { mobile, is_active: true },
    data: { is_active: false },
  });

  const otp = genOtp();
  const expires = new Date(now.getTime() + OTP_TTL_SECONDS * 1000);

  const rec = await prisma.otp_verification.create({
    data: { mobile, otp, is_active: true, verified: false, expires_at: expires },
  });

  await sendSms(mobile, `Your Skolara OTP is ${otp}. It expires in ${Math.floor(OTP_TTL_SECONDS/60)} min.`);

  return { verificationId: rec.id, expiresAt: rec.expires_at };
}

export async function verifyOtp(prisma: PrismaClient, mobile: string, otp: string) {
  // Latest active record for that mobile
  const rec = await prisma.otp_verification.findFirst({
    where: { mobile, is_active: true },
    orderBy: { created_at: 'desc' },
  });

  if (!rec) throw new Error('INVALID_OTP');

  // Lockout on attempts
  if (rec.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
    // deactivate to stop further brute force
    await prisma.otp_verification.update({ where: { id: rec.id }, data: { is_active: false } });
    const e: any = new Error('OTP_ATTEMPTS_EXCEEDED');
    e.statusCode = 429;
    throw e;
  }

  // Expiry check
  if (new Date() > new Date(rec.expires_at)) {
    await prisma.otp_verification.update({ where: { id: rec.id }, data: { is_active: false } });
    const e: any = new Error('OTP_EXPIRED');
    e.statusCode = 400;
    throw e;
  }

  if (rec.otp !== otp) {
    await prisma.otp_verification.update({
      where: { id: rec.id },
      data: { attempts: { increment: 1 } },
    });
    const e: any = new Error('INVALID_OTP');
    e.statusCode = 400;
    throw e;
  }

  // Success: mark verified and keep active (or deactivate—your call)
  const verified = await prisma.otp_verification.update({
    where: { id: rec.id },
    data: { verified: true },
  });

  return verified;
}

export async function assertLoginWindow(prisma: PrismaClient, verificationId: string, mobile: string) {
  const rec = await prisma.otp_verification.findUnique({ where: { id: verificationId } });
  if (!rec || rec.mobile !== mobile || !rec.verified) throw new Error('UNAUTHORIZED');

  const secondsSinceVerify = (Date.now() - new Date(rec.updated_at).getTime()) / 1000;
  if (secondsSinceVerify > 30) throw new Error('OTP_WINDOW_EXPIRED');
  return rec;
}

export async function assertSignupWindow(prisma: PrismaClient, verificationId: string) {
  const rec = await prisma.otp_verification.findUnique({ where: { id: verificationId } });
  if (!rec || !rec.verified) throw new Error('UNAUTHORIZED');

  const secondsSinceVerify = (Date.now() - new Date(rec.updated_at).getTime()) / 1000;
  if (secondsSinceVerify > 8 * 60) throw new Error('OTP_WINDOW_EXPIRED');
  return rec;
}
