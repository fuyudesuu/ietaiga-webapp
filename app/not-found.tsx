"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/encore-ui/ui";
import { recordFallbackPath, withBasePath } from "@/lib/encore/paths";

// Static hosting only exports pages for seeded records. A concert or trip
// created in this browser is shown through the pre-rendered fallback page.
export default function NotFound() {
  useEffect(() => {
    const fallback = recordFallbackPath(window.location.pathname);
    if (fallback)
      window.location.replace(withBasePath(fallback) + window.location.hash);
  }, []);

  return (
    <Empty
      title="Page not found"
      description="This page does not exist in the Encore demo."
      action={
        <Button asChild>
          <a href={withBasePath("/")}>Back to overview</a>
        </Button>
      }
    />
  );
}
