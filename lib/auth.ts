import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types/database";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) return null;

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("email", authUser.email)
    .single();

  return dbUser as User | null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
