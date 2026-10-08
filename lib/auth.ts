import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export type Role = "admin" | "teacher";
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("id,full_name,email,role,avatar_url,active").eq("id", user.id).maybeSingle();
  return { user, profile };
}
export async function requireRole(role: Role) {
  const current = await getCurrentUser();
  if (!current?.user || !current.profile?.active) redirect("/login");
  if (current.profile.role !== role) redirect(current.profile.role === "admin" ? "/admin" : "/teacher");
  return current;
}
