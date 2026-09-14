import { getChatsForCurrentUser } from "@/lib/supabase/queries";
import { ChatList } from "@/components/dashboard/chat-list";
import { searchChatsAction } from "./actions";

export default async function ChatsPage() {
  const chats = await getChatsForCurrentUser(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chats</h1>
        <p className="text-muted-foreground mt-1">
          {chats.length} percakapan dianalisis
        </p>
      </div>
      <ChatList chats={chats} searchFn={searchChatsAction} />
    </div>
  );
}
