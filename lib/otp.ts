import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueOtp(email: string): Promise<string> {
  const normalized = email.toLowerCase();
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000);

  await prisma.$transaction([
    prisma.otpCode.updateMany({
      where: { email: normalized, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.otpCode.create({
      data: { email: normalized, codeHash, expiresAt },
    }),
  ]);

  return code;
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "EXPIRED" | "TOO_MANY_ATTEMPTS" | "INVALID_CODE" };

export async function verifyOtp(email: string, code: string): Promise<VerifyOtpResult> {
  const normalized = email.toLowerCase();
  const record = await prisma.otpCode.findFirst({
    where: { email: normalized, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, reason: "NOT_FOUND" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "EXPIRED" };
  if (record.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "TOO_MANY_ATTEMPTS" };

  const matches = await bcrypt.compare(code, record.codeHash);
  if (!matches) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "INVALID_CODE" };
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true };
}