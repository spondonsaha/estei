import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VerifyEmailForm } from "@/components/account/verify-email-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Verify Email" };

export default async function VerifyEmailPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/verify-email");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, isVerified: true },
  });
  if (!user) redirect("/login");
  if (user.isVerified) redirect("/account");

  return (
    <div className="section-estei">
      <div className="container-estei max-w-md">
        <VerifyEmailForm email={user.email} />
      </div>
    </div>
  );
}