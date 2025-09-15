// tests/auth.test.ts
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Adjust import paths to match your project
import { sendOtp, verifyOtp, assertLoginWindow, assertSignupWindow } from '../src/services/otp';

// Mock SNS so no real SMS is sent
vi.mock('../src/services/sns', () => ({
  sendSms: vi.fn().mockResolvedValue(undefined),
}));
import { sendSms } from '../src/services/sns';

// ---- helpers ----
const NOW = new Date('2025-01-01T10:00:00.000Z');

function basePrismaMock() {
  return {
    otp_verification: {
      count: vi.fn().mockResolvedValue(0),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      create: vi.fn().mockResolvedValue({
        id: 'test-id',
        expires_at: new Date(NOW.getTime() + 300_000), // +5m
      }),
      findFirst: vi.fn(),   // used by verifyOtp
      update: vi.fn(),      // used by verifyOtp
      findUnique: vi.fn(),  // used by assertLoginWindow/SignupWindow
    },
    users: {
      // not used in these service tests; here for completeness if you extend
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
  // Optional: set envs for deterministic behavior in tests
  process.env.OTP_TTL_SECONDS = '300';          // 5 min
  process.env.OTP_MAX_VERIFY_ATTEMPTS = '5';
  process.env.OTP_MAX_PER_HOUR = '5';
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------- sendOtp ----------------
describe('sendOtp', () => {
  test('creates record and sends SMS', async () => {
    const prisma = basePrismaMock();

    await sendOtp(prisma as any, '9876543210');

    expect(prisma.otp_verification.count).toHaveBeenCalledWith({
      where: { mobile: '9876543210', created_at: { gt: new Date(NOW.getTime() - 60 * 60 * 1000) } },
    });
    expect(prisma.otp_verification.updateMany).toHaveBeenCalledWith({
      where: { mobile: '9876543210', is_active: true },
      data: { is_active: false },
    });
    expect(prisma.otp_verification.create).toHaveBeenCalledWith({
      data: {
        mobile: '9876543210',
        otp: expect.any(String),
        is_active: true,
        verified: false,
        expires_at: expect.any(Date),
      },
    });
    expect(sendSms).toHaveBeenCalledWith('9876543210', expect.stringContaining('OTP'));
  });

  test('applies hourly rate limit (DB-backed)', async () => {
    const prisma = basePrismaMock();
    prisma.otp_verification.count.mockResolvedValue(5); // at cap

    await expect(sendOtp(prisma as any, '9876543210')).rejects.toMatchObject({
      message: 'RATE_LIMITED_HOURLY',
    });

    expect(prisma.otp_verification.create).not.toHaveBeenCalled();
    expect(sendSms).not.toHaveBeenCalled();
  });
});

// ---------------- verifyOtp ----------------
describe('verifyOtp', () => {
  test('verifies with correct OTP before expiry', async () => {
    const prisma = basePrismaMock();

    prisma.otp_verification.findFirst.mockResolvedValue({
      id: 'verif-1',
      mobile: '9876543210',
      otp: '123456',
      is_active: true,
      verified: false,
      attempts: 0,
      expires_at: new Date(NOW.getTime() + 60_000), // +1m
      created_at: NOW,
      updated_at: NOW,
    });

    prisma.otp_verification.update.mockResolvedValue({
      id: 'verif-1',
      verified: true,
      updated_at: NOW, // updatedAt after verify
      expires_at: new Date(NOW.getTime() + 60_000),
    });

    const rec = await verifyOtp(prisma as any, '9876543210', '123456');
    expect(rec.id).toBe('verif-1');
    expect(prisma.otp_verification.update).toHaveBeenCalledWith({
      where: { id: 'verif-1' },
      data: { verified: true },
    });
  });

  test('rejects invalid OTP and increments attempts', async () => {
    const prisma = basePrismaMock();

    prisma.otp_verification.findFirst.mockResolvedValue({
      id: 'verif-2',
      mobile: '9876543210',
      otp: '654321', // actual stored otp
      is_active: true,
      verified: false,
      attempts: 1,
      expires_at: new Date(NOW.getTime() + 60_000),
      created_at: NOW,
      updated_at: NOW,
    });

    await expect(verifyOtp(prisma as any, '9876543210', '000000')).rejects.toMatchObject({
      message: 'INVALID_OTP',
    });

    expect(prisma.otp_verification.update).toHaveBeenCalledWith({
      where: { id: 'verif-2' },
      data: { attempts: { increment: 1 } },
    });
  });

  test('rejects when attempts exceeded and deactivates', async () => {
    const prisma = basePrismaMock();
    process.env.OTP_MAX_VERIFY_ATTEMPTS = '2';

    prisma.otp_verification.findFirst.mockResolvedValue({
      id: 'verif-3',
      mobile: '9876543210',
      otp: '111111',
      is_active: true,
      verified: false,
      attempts: 5, // already at max
      expires_at: new Date(NOW.getTime() + 60_000),
      created_at: NOW,
      updated_at: NOW,
    });

    await expect(verifyOtp(prisma as any, '9876543210', '111111')).rejects.toMatchObject({
      message: 'OTP_ATTEMPTS_EXCEEDED',
    });

    // deactivated
    expect(prisma.otp_verification.update).toHaveBeenCalledWith({
      where: { id: 'verif-3' },
      data: { is_active: false },
    });
  });

  test('rejects expired OTP and deactivates', async () => {
    const prisma = basePrismaMock();

    prisma.otp_verification.findFirst.mockResolvedValue({
      id: 'verif-4',
      mobile: '9876543210',
      otp: '222222',
      is_active: true,
      verified: false,
      attempts: 0,
      expires_at: new Date(NOW.getTime() - 1_000), // already expired
      created_at: NOW,
      updated_at: NOW,
    });

    await expect(verifyOtp(prisma as any, '9876543210', '222222')).rejects.toMatchObject({
      message: 'OTP_EXPIRED',
    });

    expect(prisma.otp_verification.update).toHaveBeenCalledWith({
      where: { id: 'verif-4' },
      data: { is_active: false },
    });
  });

  test('rejects when no active OTP record exists', async () => {
    const prisma = basePrismaMock();
    prisma.otp_verification.findFirst.mockResolvedValue(null);

    await expect(verifyOtp(prisma as any, '9876543210', '123456')).rejects.toMatchObject({
      message: 'INVALID_OTP',
    });
  });
});

// ---------------- assertLoginWindow (30s) ----------------
describe('assertLoginWindow', () => {
  test('allows login within 30s of verify', async () => {
    const prisma = basePrismaMock();

    prisma.otp_verification.findUnique.mockResolvedValue({
      id: 'verif-5',
      mobile: '9876543210',
      verified: true,
      updated_at: new Date(NOW.getTime() - 25_000), // verified 25s ago
    });

    await expect(assertLoginWindow(prisma as any, 'verif-5', '9876543210')).resolves.toBeTruthy();
  });

  test('rejects login after 30s window', async () => {
    const prisma = basePrismaMock();

    prisma.otp_verification.findUnique.mockResolvedValue({
      id: 'verif-6',
      mobile: '9876543210',
      verified: true,
      updated_at: new Date(NOW.getTime() - 31_000), // 31s ago
    });

    await expect(assertLoginWindow(prisma as any, 'verif-6', '9876543210')).rejects.toMatchObject({
      message: 'OTP_WINDOW_EXPIRED',
    });
  });

  test('rejects when mobile mismatch or not verified', async () => {
    const prisma = basePrismaMock();

    prisma.otp_verification.findUnique.mockResolvedValue({
      id: 'verif-7',
      mobile: '1111111111', // mismatch
      verified: true,
      updated_at: NOW,
    });

    await expect(assertLoginWindow(prisma as any, 'verif-7', '9876543210')).rejects.toMatchObject({
      message: 'UNAUTHORIZED',
    });

    prisma.otp_verification.findUnique.mockResolvedValue({
      id: 'verif-8',
      mobile: '9876543210',
      verified: false, // not verified
      updated_at: NOW,
    });

    await expect(assertLoginWindow(prisma as any, 'verif-8', '9876543210')).rejects.toMatchObject({
      message: 'UNAUTHORIZED',
    });
  });
});

// ---------------- assertSignupWindow (8 min) ----------------
describe('assertSignupWindow', () => {
  test('allows signup within 8 min of verify', async () => {
    const prisma = basePrismaMock();

    prisma.otp_verification.findUnique.mockResolvedValue({
      id: 'verif-9',
      mobile: '9876543210',
      verified: true,
      updated_at: new Date(NOW.getTime() - 7 * 60_000), // 7 min ago
    });

    await expect(assertSignupWindow(prisma as any, 'verif-9')).resolves.toBeTruthy();
  });

  test('rejects signup after 8 min window', async () => {
    const prisma = basePrismaMock();

    prisma.otp_verification.findUnique.mockResolvedValue({
      id: 'verif-10',
      mobile: '9876543210',
      verified: true,
      updated_at: new Date(NOW.getTime() - 8 * 60_000 - 1_000), // 8m+1s
    });

    await expect(assertSignupWindow(prisma as any, 'verif-10')).rejects.toMatchObject({
      message: 'OTP_WINDOW_EXPIRED',
    });
  });

  test('rejects when verification not found or not verified', async () => {
    const prisma = basePrismaMock();

    prisma.otp_verification.findUnique.mockResolvedValue(null);
    await expect(assertSignupWindow(prisma as any, 'nope')).rejects.toMatchObject({
      message: 'UNAUTHORIZED',
    });

    prisma.otp_verification.findUnique.mockResolvedValue({
      id: 'verif-11',
      mobile: '9876543210',
      verified: false,
      updated_at: NOW,
    });
    await expect(assertSignupWindow(prisma as any, 'verif-11')).rejects.toMatchObject({
      message: 'UNAUTHORIZED',
    });
  });
});
