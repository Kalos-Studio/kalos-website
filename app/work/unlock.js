"use server";

import { revalidatePath } from "next/cache";
import { caseStudies } from "./data";
import { clearKeys, grantKey, passwordFor } from "@/lib/work-lock";

// The one action behind PasswordGate.
//
// Its own module rather than defined inline in [slug]/page.js, because the form
// is a client component and a client component cannot be handed an action that
// closes over server-only values. `slug` travels in a hidden field instead, and
// is looked up here rather than trusted -- an unknown slug fails the same way a
// wrong password does.
//
// It does not redirect. `revalidatePath` on the study's own URL makes Next send
// a fresh render of this page back with the action's response, so the prose
// appears where the form was and the reader keeps their scroll position. A
// redirect to the same URL would work too and would put them back at the top of
// the page they were already on.
export async function unlockCaseStudy(_prevState, formData) {
  const slug = String(formData.get("slug") || "");
  const attempt = String(formData.get("password") || "");
  const cs = caseStudies.find((c) => c.slug === slug);

  if (!cs || attempt !== passwordFor(cs)) {
    return { error: "That password does not open this one." };
  }

  await grantKey(passwordFor(cs));
  revalidatePath(`/work/${slug}`);
  return { error: null };
}

// Relocking, for the debug menu only. Cheap to expose: the worst it can do to
// anyone is ask them for a password they already have.
export async function relockWork(slug) {
  await clearKeys();
  revalidatePath(`/work/${slug}`);
}
