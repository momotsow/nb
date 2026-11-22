"use client";

import { Button } from "@/ui/primitives/Button";
import { ErrorState } from "@/ui/states/ErrorState";

// Never render error.message: it may contain internal or personal details.
export default function ErrorPage({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <ErrorState
        title="Something went wrong"
        description="Please try again. If the problem continues, come back a little later."
        action={<Button onClick={() => retry()}>Try again</Button>}
      />
    </div>
  );
}
