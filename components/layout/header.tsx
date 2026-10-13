"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, LogOut, Menu, Package, Search, ShoppingBag, User, Heart, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { CartPopover } from "@/components/cart/cart-popover";
import { useCart } from "@/components/cart/cart-context";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { count } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const signedIn = status === "authenticated";

  useEffect(() => {
    setSearchOpen(false);
    setCartOpen(false);
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-estei-gray-200 bg-white">
        <div className="container-estei flex h-16 items-center justify-between gap-4">
          <button
            className="lg:hidden rounded p-2 text-estei-gray-900 hover:bg-estei-gray-100"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link href="/" className="shrink-0" aria-label="ESTEI home">
            <Logo size="lg" />
          </Link>

          <nav className="hidden lg:flex items-center gap-6" aria-label="Primary">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-2 text-sm font-medium transition-colors hover:text-estei-red",
                  isActive(pathname, item.href)
                    ? "text-estei-red after:absolute after:inset-x-0 after:-bottom-[3px] after:h-0.5 after:bg-estei-red"
                    : "text-estei-gray-900"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/dealer"
              className={cn(
                "relative py-2 text-sm font-medium transition-colors hover:text-estei-red",
                isActive(pathname, "/dealer")
                  ? "text-estei-red after:absolute after:inset-x-0 after:-bottom-[3px] after:h-0.5 after:bg-estei-red"
                  : "text-estei-red"
              )}
            >
              Become a Seller
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded p-2 text-estei-gray-900 hover:bg-estei-gray-100"
              aria-label="Search products"
            >
              <Search className="h-5 w-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="hidden sm:flex rounded p-2 text-estei-gray-900 hover:bg-estei-gray-100 items-center gap-1"
                aria-label="Account"
                aria-expanded={accountOpen}
              >
                <User className="h-5 w-5" />
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-12 z-50 w-56 rounded-lg border border-estei-gray-200 bg-white p-2 shadow-card">
                  {signedIn ? (
                    <>
                      <p className="px-3 py-2 text-sm font-semibold text-estei-gray-900">
                        {session?.user?.name}
                      </p>
                      <p className="px-3 pb-2 text-xs text-estei-gray-400">{session?.user?.email}</p>
                      <div className="my-1 border-t border-estei-gray-100" />
                      {[
                        { href: "/account", label: "My Account", icon: User },
                        { href: "/account/orders", label: "My Orders", icon: Package },
                        { href: "/account/wishlist", label: "Wishlist", icon: Heart },
                      ].map(({ href, label, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-estei-gray-600 hover:bg-estei-gray-100 hover:text-estei-red"
                        >
                          <Icon className="h-4 w-4" /> {label}
                        </Link>
                      ))}
                      <button
                        onClick={() => {
                          setAccountOpen(false);
                          void signOut({ redirectTo: "/" });
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-estei-gray-600 hover:bg-estei-gray-100 hover:text-estei-red"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-md px-3 py-2 text-sm font-medium text-estei-gray-900 hover:bg-estei-gray-100"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-md px-3 py-2 text-sm font-medium text-estei-gray-600 hover:bg-estei-gray-100"
                      >
                        Create Account
                      </Link>
                      <div className="my-1 border-t border-estei-gray-100" />
                      <Link
                        href="/dealer"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-md px-3 py-2 text-sm font-medium text-estei-red hover:bg-estei-red-tint"
                      >
                        Become a Dealer!
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded p-2 text-estei-gray-900 hover:bg-estei-gray-100"
              aria-label={`Open cart, ${count} items`}
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-estei-red px-1 text-[10px] font-bold text-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 h-full w-full bg-estei-black/60"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <Logo size="lg" />
              <button onClick={() => setMobileOpen(false)} className="rounded p-2 hover:bg-estei-gray-100" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col" aria-label="Mobile">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "border-b border-estei-gray-100 py-3 text-sm font-medium",
                    isActive(pathname, item.href) ? "text-estei-red" : "text-estei-gray-900"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/dealer"
                onClick={() => setMobileOpen(false)}
                className="mt-3 block rounded-md bg-estei-red px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Become a Dealer!
              </Link>
              {!signedIn && (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="mt-3 block rounded-md border border-estei-gray-200 px-4 py-3 text-center text-sm font-semibold text-estei-gray-900"
                >
                  Login
                </Link>
              )}
              {signedIn && (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="mt-3 block rounded-md border border-estei-gray-200 px-4 py-3 text-center text-sm font-semibold text-estei-gray-900"
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      void signOut({ redirectTo: "/" });
                    }}
                    className="mt-3 block w-full rounded-md border border-estei-gray-200 px-4 py-3 text-center text-sm font-semibold text-estei-red"
                  >
                    Sign out
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartPopover open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}