import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  canAccessBroadcastSender,
  canManageBroadcast,
  getBroadcastScope,
} from "@/lib/broadcast-access";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseBroadcastId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function authorizeBroadcastAccess() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!canManageBroadcast(user.role)) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
    };
  }

  return { user, response: null };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { user, response } = await authorizeBroadcastAccess();
    if (response) return response;

    const id = parseBroadcastId((await context.params).id);
    if (!id) {
      return NextResponse.json({ error: "ID broadcast tidak valid" }, { status: 400 });
    }

    const supabase = await createClient();
    const [{ data: broadcast, error: broadcastError }, { data: recipients, error: recipientError }] =
      await Promise.all([
        supabase
          .from("broadcasts")
          .select("id, message, failed_count, created_at, sent_by")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("broadcast_recipients")
          .select("id, user_id, telegram_id, error_message, sent_at")
          .eq("broadcast_id", id)
          .eq("status", "failed")
          .order("id", { ascending: true }),
      ]);

    if (broadcastError || recipientError) {
      console.error("Gagal mengambil detail broadcast gagal", {
        broadcastId: id,
        userId: user?.id,
        broadcastError: broadcastError?.message,
        recipientError: recipientError?.message,
      });
      return NextResponse.json(
        { error: broadcastError?.message || recipientError?.message || "Gagal mengambil data" },
        { status: 500 }
      );
    }

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast tidak ditemukan" }, { status: 404 });
    }

    const scope = await getBroadcastScope(supabase, user!);
    if (!canAccessBroadcastSender(scope, broadcast.sent_by)) {
      return NextResponse.json({ error: "Anda tidak dapat mengakses broadcast ini" }, { status: 403 });
    }

    const recipientRows = recipients ?? [];
    const userIds = [...new Set(recipientRows.map((recipient) => recipient.user_id))];
    const { data: users, error: usersError } = userIds.length
      ? await supabase
          .from("users")
          .select("id, full_name, username, telegram_id")
          .in("id", userIds)
      : { data: [], error: null };

    if (usersError) {
      console.error("Gagal mengambil akun penerima broadcast", {
        broadcastId: id,
        userId: user?.id,
        error: usersError.message,
      });
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const usersById = new Map((users ?? []).map((dbUser) => [dbUser.id, dbUser]));
    return NextResponse.json({
      broadcast,
      recipients: recipientRows.map((recipient) => {
        const dbUser = usersById.get(recipient.user_id);
        return {
          recipient_id: recipient.id,
          user_id: recipient.user_id,
          telegram_id: dbUser?.telegram_id ?? recipient.telegram_id,
          full_name: dbUser?.full_name ?? null,
          username: dbUser?.username ?? null,
          error_message: recipient.error_message,
          sent_at: recipient.sent_at,
        };
      }),
    });
  } catch (error) {
    console.error("Broadcast failed detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { user, response } = await authorizeBroadcastAccess();
    if (response) return response;

    const id = parseBroadcastId((await context.params).id);
    if (!id) {
      return NextResponse.json({ error: "ID broadcast tidak valid" }, { status: 400 });
    }

    const supabase = await createClient();
    const [{ data: broadcast, error: broadcastError }, { data: failedRecipients, error: recipientError }] =
      await Promise.all([
        supabase.from("broadcasts").select("message, sent_by").eq("id", id).maybeSingle(),
        supabase
          .from("broadcast_recipients")
          .select("user_id, telegram_id")
          .eq("broadcast_id", id)
          .eq("status", "failed"),
      ]);

    if (broadcastError || recipientError) {
      console.error("Gagal menyiapkan retry broadcast", {
        broadcastId: id,
        userId: user?.id,
        broadcastError: broadcastError?.message,
        recipientError: recipientError?.message,
      });
      return NextResponse.json(
        { error: broadcastError?.message || recipientError?.message || "Gagal mengambil data retry" },
        { status: 500 }
      );
    }

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast tidak ditemukan" }, { status: 404 });
    }

    const scope = await getBroadcastScope(supabase, user!);
    if (!canAccessBroadcastSender(scope, broadcast.sent_by)) {
      return NextResponse.json({ error: "Anda tidak dapat mengakses broadcast ini" }, { status: 403 });
    }

    const recipients = failedRecipients ?? [];
    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada penerima gagal yang dapat dikirim ulang" },
        { status: 400 }
      );
    }

    const { data: retryBroadcast, error: retryBroadcastError } = await supabase
      .from("broadcasts")
      .insert({
        message: broadcast.message,
        filter_role: null,
        filter_team: null,
        filter_active: true,
        recipient_count: recipients.length,
        sent_by: user?.telegram_id,
        status: "pending",
      })
      .select("id")
      .single();

    if (retryBroadcastError || !retryBroadcast) {
      console.error("Gagal membuat retry broadcast", {
        broadcastId: id,
        userId: user?.id,
        error: retryBroadcastError?.message,
      });
      return NextResponse.json(
        { error: retryBroadcastError?.message || "Gagal membuat broadcast ulang" },
        { status: 500 }
      );
    }

    const { error: retryRecipientError } = await supabase
      .from("broadcast_recipients")
      .insert(
        recipients.map((recipient) => ({
          broadcast_id: retryBroadcast.id,
          user_id: recipient.user_id,
          telegram_id: recipient.telegram_id,
          status: "pending",
        }))
      );

    if (retryRecipientError) {
      await supabase.from("broadcasts").delete().eq("id", retryBroadcast.id);
      console.error("Gagal membuat penerima retry broadcast", {
        broadcastId: id,
        retryBroadcastId: retryBroadcast.id,
        userId: user?.id,
        error: retryRecipientError.message,
      });
      return NextResponse.json({ error: retryRecipientError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      broadcast_id: retryBroadcast.id,
      recipient_count: recipients.length,
      message: "Broadcast ulang dijadwalkan. Akan diproses oleh bot.",
    });
  } catch (error) {
    console.error("Broadcast retry error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
