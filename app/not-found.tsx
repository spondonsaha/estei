import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="section-estei">
      <div className="container-estei flex flex-col items-center py-16 text-center">
        <p className="font-display text-6xl font-bold text-estei-red">404</p>
        <h1 className="mt-4 text-2xl font-bold text-estei-gray-900">Page not found</h1>
        <p className="mt-2 max-w-md text-sm text-estei-gray-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/category/sports">Browse the shop</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}