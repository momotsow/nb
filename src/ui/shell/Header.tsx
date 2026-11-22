import NextLink from "next/link";
import { ThemeToggle } from "./ThemeToggle";

/** Site header. Navigation lists only routes that exist; later specs extend it. */
export function Header() {
  return (
    <header className="border-b border-(--nb-border) bg-(--nb-bg)">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <NextLink
          href="/"
          className="inline-flex min-h-11 items-center font-serif text-2xl text-(--nb-text)"
        >
          Ndalo Bloom
        </NextLink>
        <nav aria-label="Primary">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
