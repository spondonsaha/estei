import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, Star, Handshake, Mail, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/dealers", label: "Dealer Applications", icon: Handshake },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/login?callbackUrl=/admin");

  return (
    <div className="flex min-h-[70vh]">
      <aside className="hidden w-60 shrink-0 border-r border-estei-gray-200 bg-estei-black p-4 md:block">
        <div className="mb-6 px-2 pt-2">
          <Logo dark size="sm" />
        </div>
        <nav className="space-y-1" aria-label="Admin">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-estei-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t border-white/10 pt-4">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-estei-gray-400 transition-colors hover:text-white">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="md:hidden border-b border-estei-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <span className="rounded-full bg-estei-red px-3 py-1 text-xs font-semibold text-white">Admin</span>
          </div>
          <nav className="mt-4 flex flex-wrap gap-2" aria-label="Admin mobile">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} className="rounded-full border border-estei-gray-200 px-3 py-1.5 text-xs font-medium text-estei-gray-600 hover:border-estei-red hover:text-estei-red">
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}