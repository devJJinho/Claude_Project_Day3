"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** T-016: 로그아웃. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
