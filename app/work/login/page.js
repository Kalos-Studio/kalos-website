import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  WORK_AUTH_COOKIE,
  WORK_AUTH_MAX_AGE_SECONDS,
  WORK_AUTH_VALUE,
  WORK_PASSWORD,
} from "@/lib/work-auth";
import { WORK_ROBOTS, workPageTitle } from "../data";

export const metadata = {
  title: workPageTitle("Work"),
  robots: WORK_ROBOTS,
};

export default async function WorkLoginPage({ searchParams }) {
  const params = await searchParams;
  const next = typeof params?.next === "string" ? params.next : "/work";
  const hasError = params?.error === "1";

  // Defined inline (rather than in its own actions.js) since this is its
  // only caller — a function-level "use server" directive is all a Server
  // Action needs when it doesn't need to be shared across files.
  async function unlockWork(formData) {
    "use server";

    const password = formData.get("password") ?? "";
    const nextValue = formData.get("next") || "/work";

    // Keep redirects within the site — a `next` value can come from a URL
    // query param, so don't let it point somewhere external.
    const safeNext = nextValue.startsWith("/") ? nextValue : "/work";

    if (password !== WORK_PASSWORD) {
      redirect(`/work/login?error=1&next=${encodeURIComponent(safeNext)}`);
    }

    const cookieStore = await cookies();
    cookieStore.set(WORK_AUTH_COOKIE, WORK_AUTH_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: WORK_AUTH_MAX_AGE_SECONDS,
    });

    redirect(safeNext);
  }

  return (
    <div className="work-login">
      <form className="work-login-card" action={unlockWork}>
        <p className="work-login-eyebrow">kalos / work</p>
        <h1>Enter password</h1>
        <input type="hidden" name="next" value={next} />
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          required
        />
        {hasError && <p className="work-login-error">Wrong password. Try again.</p>}
        <button type="submit">Enter</button>
      </form>
    </div>
  );
}
