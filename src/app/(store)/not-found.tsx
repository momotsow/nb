import type { Metadata } from "next";
import { Link } from "@/ui/primitives/Link";
import { EmptyState } from "@/ui/states/EmptyState";

export const metadata: Metadata = { title: "Not found" };

export default function StoreNotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <EmptyState
        title="We could not find that"
        description="It may have moved or is no longer available."
        action={
          <Link href="/shop" display="standalone">
            Browse the shop
          </Link>
        }
      />
    </div>
  );
}
