"use server";

import { searchChats } from "@/lib/supabase/queries";

export async function searchChatsAction(query: string) {
  return await searchChats(query, 50);
}
