import { getChatsForCurrentUser } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { getVisibleUserIds } from "@/lib/hierarchy";
import { createClient } from "@/lib/supabase/server";
import { ChatList } from "@/components/dashboard/chat-list";
import { searchChatsAction } from "./actions";

export default async function ChatsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const chats = await getChatsForCurrentUser(200);

  // Ambil daftar agent yang visible (untuk dropdown filter)
  const supabase = await createClient();
  const visibleIds = await getVisibleUserIds(user);

  let agentsQuery = supabase
    .from("users")
    .select("id, full_name")
    .eq("role", "agent")
    .eq("is_active", true)
    .order("full_name");

  if (visibleIds.length > 0) {
    agentsQuery = agentsQuery.in("id", visibleIds);
  }

  const { data: agents } = await agentsQuery;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Chats
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1.5">
          {chats.length} percakapan dianalisis
        </p>
      </div>
      <ChatList
        chats={chats}
        searchFn={searchChatsAction}
        agents={agents ?? []}
      />
    </div>
  );
}