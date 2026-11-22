import type { Metadata } from "next";
import { Link } from "@/ui/primitives/Link";
import { EmptyState } from "@/ui/states/EmptyState";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <EmptyState
        title="We could not find that page"
        description="The page may have moved, or the link may be incorrect."
        action={
          <Link href="/" display="standalone">
            Back to the homepage
          </Link>
        }
      />
    </div>
  );
}
