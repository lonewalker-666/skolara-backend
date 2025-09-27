import type { PrismaClient } from '@prisma/client'
import { sendSms } from './sns'
import { env } from '../config/env'
import { errorCodes } from '../utils/errors'

const OTP_TTL_SECONDS = Number(env.OTP_TTL_SECONDS ?? 300) // 5m
const OTP_MAX_VERIFY_ATTEMPTS = Number(env.OTP_MAX_VERIFY_ATTEMPTS ?? 5)
const OTP_MAX_PER_HOUR = Number(env.OTP_MAX_PER_HOUR ?? 5)

function genOtp (): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function sendOtp (prisma: PrismaClient, mobile: string) {
  const now = new Date()

  // Hourly cap (if you enable it again)
  // const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  // const recentCount = await prisma.otp_verification.count({
  //   where: { mobile, created_at: { gt: oneHourAgo } },
  // });
  // if (recentCount >= OTP_MAX_PER_HOUR) {
  //   throw new Error("MAX_OTP_LIMIT_REACHED");
  // }

  await prisma.otp_verification.updateMany({
    where: { mobile, is_active: true },
    data: { is_active: false }
  })

  const otp = genOtp()
  const expires = new Date(now.getTime() + OTP_TTL_SECONDS * 1000)

  const rec = await prisma.otp_verification.create({
    data: { mobile, otp, is_active: true, verified: false, expires_at: expires }
  })

  try {
    const response = await sendSms(
      mobile,
      // `Your Skolara OTP is ${otp}. It expires in ${Math.floor(
      //   OTP_TTL_SECONDS / 60
      // )} min.`
      `Use OTP ${otp} to log in to your Account. Never share your OTP with anyone . Support contact: Skolara - My Dreams`
    )
    console.log('SMS response:', response)
    return { verificationId: rec.id, expiresAt: rec.expires_at, response }
  } catch (err) {
    // Rollback OTP record if SMS failed
    await prisma.otp_verification.update({
      where: { id: rec.id },
      data: { is_active: false }
    })
    throw new Error(errorCodes.SMS_SEND_FAILED)
  }
}

export async function verifyOtp (
  prisma: PrismaClient,
  mobile: string,
  otp: string
) {
  const rec = await prisma.otp_verification.findFirst({
    where: { mobile, is_active: true },
    orderBy: { created_at: 'desc' }
  })

  if (!rec) throw new Error(errorCodes.INVALID_OTP)

  if (rec.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
    await prisma.otp_verification.update({
      where: { id: rec.id },
      data: { is_active: false }
    })
    throw new Error(errorCodes.OTP_ATTEMPTS_EXCEEDED)
  }

  if (new Date() > new Date(rec.expires_at)) {
    await prisma.otp_verification.update({
      where: { id: rec.id },
      data: { is_active: false }
    })
    throw new Error(errorCodes.OTP_EXPIRED)
  }

  if (rec.otp !== otp) {
    await prisma.otp_verification.update({
      where: { id: rec.id },
      data: { attempts: { increment: 1 } }
    })
    throw new Error(errorCodes.INVALID_OTP)
  }

  return prisma.otp_verification.update({
    where: { id: rec.id },
    data: { verified: true }
  })
}

export async function assertLoginWindow (
  prisma: PrismaClient,
  verificationId: string,
  mobile: string
) {
  const rec = await prisma.otp_verification.findUnique({
    where: { id: verificationId, mobile }
  })
  if (!rec || rec.mobile !== mobile || !rec.verified)
    throw new Error(errorCodes.UNAUTHORIZED)

  const secondsSinceVerify =
    (Date.now() - new Date(rec.updated_at).getTime()) / 1000
  if (secondsSinceVerify > 30) throw new Error(errorCodes.OTP_WINDOW_EXPIRED)
  return rec
}

export async function assertSignupWindow (
  prisma: PrismaClient,
  verificationId: string,
  mobile: string
) {
  const rec = await prisma.otp_verification.findUnique({
    where: { id: verificationId, mobile }
  })
  if (!rec || !rec.verified) throw new Error(errorCodes.UNAUTHORIZED)

  // const secondsSinceVerify = (Date.now() - new Date(rec.updated_at).getTime()) / 10000;
  // if (secondsSinceVerify > 8 * 60) throw new Error(errorCodes.OTP_WINDOW_EXPIRED);
  return rec
}
