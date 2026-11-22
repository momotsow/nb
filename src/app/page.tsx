// Placeholder homepage. Links to /collections and /gift-finder return when those routes exist (R8.4).
export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <p className="text-sm tracking-wide text-(--nb-muted)">Ndalo Bloom</p>
      <h1 className="max-w-3xl text-5xl leading-tight md:text-7xl">
        Make Room For A Little More Softness.
      </h1>
      <p className="max-w-xl text-lg text-(--nb-muted)">
        Thoughtfully created self-care experiences and beautiful gifts for the moments that matter.
      </p>
    </div>
  );
}
