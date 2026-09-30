import { auth } from "@/lib/auth";

/**
 * Returns the session when the caller is an admin, otherwise null.
 *
 * Use this for every admin API guard. The session is returned rather than a
 * boolean so that routes needing `session.user.id` (e.g. for audit logging)
 * do not have to call `auth()` a second time.
 */
export async function requireAdminApiSession() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return null;
  return session;
}
