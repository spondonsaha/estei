import { auth } from "@/lib/auth";

export async function requireAdminApi(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}