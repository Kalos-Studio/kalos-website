import Link from "next/link";

export default function WorkNotFound() {
  return (
    <div className="work-shell">
      <p className="work-not-found">
        Couldn&apos;t find that case study.{" "}
        <Link href="/work" className="work-back" style={{ display: "inline" }}>
          ← Back to work
        </Link>
      </p>
    </div>
  );
}
