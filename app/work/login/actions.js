"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  WORK_AUTH_COOKIE,
  WORK_AUTH_MAX_AGE_SECONDS,
  WORK_AUTH_VALUE,
  WORK_PASSWORD,
} from "@/lib/work-auth";

export async function unlockWork(formData) {
  const password = formData.get("password") ?? "";
  const next = formData.get("next") || "/work";

  // Keep redirects within the site — a `next` value can come from a URL query
  // param, so don't let it point somewhere external.
  const safeNext = next.startsWith("/") ? next : "/work";

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
