import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types/database";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    console.log("[AUTH] No auth user");
    return null;
  }

  console.log("[AUTH] Auth email:", authUser.email);

  const { data: dbUser, error } = await supabase
    .from("users")
    .select("*")
    .ilike("email", authUser.email)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.log("[AUTH] Query error:", error.message);
    return null;
  }

  if (!dbUser) {
    console.log("[AUTH] User not found in DB:", authUser.email);
    return null;
  }

  console.log("[AUTH] User found:", dbUser.full_name, "role:", dbUser.role);
  return dbUser as User | null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
