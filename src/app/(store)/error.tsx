"use client";

import { Button } from "@/ui/primitives/Button";
import { Link } from "@/ui/primitives/Link";
import { ErrorState } from "@/ui/states/ErrorState";

// Never render error.message: it may contain internal or personal details.
export default function StoreError({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <ErrorState
        title="We could not load this page"
        description="Please try again. If the problem continues, come back a little later."
        action={
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button onClick={() => retry()}>Try again</Button>
            <Link href="/shop" display="standalone">
              Back to the shop
            </Link>
          </div>
        }
      />
    </div>
  );
}
