import { auth } from "@/lib/auth";

export async function requireAdminApi(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function requireAdminApiSession() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return null;
  return session;
}