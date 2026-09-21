"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="section-estei">
      <div className="container-estei flex flex-col items-center py-16 text-center">
        <p className="font-display text-6xl font-bold text-estei-red">500</p>
        <h1 className="mt-4 text-2xl font-bold text-estei-gray-900">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-estei-gray-600">
          An unexpected error occurred. Please try again — if the problem persists, contact support@estei.com.bd.
        </p>
        <Button className="mt-6" onClick={() => reset()}>Try again</Button>
      </div>
    </div>
  );
}