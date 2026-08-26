import Link from "next/link";

// Light surface and the landing page's column, like the case study pages it
// stands in for — this used to inherit the section's black ground and a grey
// `.work-back` link, both of which went with the template.
export default function WorkNotFound() {
  return (
    <div className="mx-auto w-full max-w-[120rem] px-5 sm:px-8 lg:px-12 xl:px-24">
      <div className="flex min-h-[70svh] flex-col items-start justify-center gap-5">
        <p className="text-display font-medium tracking-tight">
          Couldn&apos;t find that case study.
        </p>
        <Link
          href="/#work"
          className="inline-flex h-11 w-44 items-center justify-center rounded-button border border-current bg-transparent text-control tracking-tight text-black transition-colors duration-200 hover:bg-black hover:text-white lg:h-12 lg:w-48"
        >
          Back to work
        </Link>
      </div>
    </div>
  );
}
