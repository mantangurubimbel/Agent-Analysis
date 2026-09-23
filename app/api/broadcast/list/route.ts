import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { canManageBroadcast, getBroadcastScope } from "@/lib/broadcast-access";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user || !canManageBroadcast(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const scope = await getBroadcastScope(supabase, user);

    let query = supabase
      .from("broadcasts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (scope.senderIds) {
      query =
        scope.senderIds.length > 0
          ? query.in("sent_by", scope.senderIds)
          : query.eq("sent_by", -1);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      broadcasts: data ?? [],
      count: data?.length ?? 0,
    });
  } catch (e) {
    console.error("List error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
