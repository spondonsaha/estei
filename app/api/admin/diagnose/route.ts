import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { v2 as cloudinary } from "cloudinary";
import "@/lib/cloudinary";

export const dynamic = "force-dynamic";

function envInfo(name: string) {
  const value = process.env[name];
  return { present: Boolean(value && value.length > 0), length: value?.length ?? 0 };
}

export async function GET() {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const report: Record<string, unknown> = {
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      maxBodyBytes: "Vercel serverless limit is ~4.5MB",
    },
    env: {
      CLOUDINARY_CLOUD_NAME: envInfo("CLOUDINARY_CLOUD_NAME"),
      CLOUDINARY_API_KEY: envInfo("CLOUDINARY_API_KEY"),
      CLOUDINARY_API_SECRET: envInfo("CLOUDINARY_API_SECRET"),
      DATABASE_URL: envInfo("DATABASE_URL"),
    },
  };

  try {
    const sharp = (await import("sharp")).default;
    const buffer = await sharp({
      create: { width: 2, height: 2, channels: 3, background: "#ffffff" },
    })
      .webp()
      .toBuffer();
    report.sharp = { ok: true, outputBytes: buffer.length };
  } catch (err) {
    report.sharp = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  try {
    const ping = await cloudinary.api.ping();
    report.cloudinary = { ok: true, ping };
  } catch (err) {
    report.cloudinary = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  return NextResponse.json({ ok: true, ...report });
}
