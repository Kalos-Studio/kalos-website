import { unlockWork } from "./actions";

export const metadata = {
  title: "Work — Kalos",
  robots: { index: false, follow: false },
};

export default async function WorkLoginPage({ searchParams }) {
  const params = await searchParams;
  const next = typeof params?.next === "string" ? params.next : "/work";
  const hasError = params?.error === "1";

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
