import { DeleteChatDialog } from "@/components/dashboard/delete-chat-dialog";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Quote,
} from "lucide-react";
import { getChatById, getTranscript } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { User } from "lucide-react";
import { generateHighlights } from "@/lib/highlight";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OutcomeBadge } from "@/components/dashboard/outcome-badge";
import { TranscriptBubble } from "@/components/dashboard/transcript-bubble";
import type {
  ChatAnalysis,
  CoachingRecommendation,
} from "@/types/database";

function parseJSON<T>(str: string | null): T | null {
  if (!str) return null;
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chat = await getChatById(id);

  if (!chat) notFound();

  const analysis = parseJSON<ChatAnalysis>(chat.analysis_json);
  const coaching = parseJSON<CoachingRecommendation>(chat.coaching_json);
  const transcript = await getTranscript(id);

    // Ambil info agent, leader, supervisor
  const supabase = await createClient();
  const { data: agentUser } = await supabase
    .from("users")
    .select("id, full_name, leader_id, supervisor_id")
    .eq("id", chat.user_id)
    .single();

  let leaderName: string | null = null;
  let supervisorName: string | null = null;

  if (agentUser?.leader_id) {
    const { data: leader } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", agentUser.leader_id)
      .single();
    leaderName = leader?.full_name ?? null;
  }

  if (agentUser?.supervisor_id) {
    const { data: sup } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", agentUser.supervisor_id)
      .single();
    supervisorName = sup?.full_name ?? null;
  } else if (agentUser?.leader_id) {
    // Kalau agent tidak punya supervisor langsung, ambil dari leader
    const { data: leader } = await supabase
      .from("users")
      .select("supervisor_id")
      .eq("id", agentUser.leader_id)
      .single();

    if (leader?.supervisor_id) {
      const { data: sup } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", leader.supervisor_id)
        .single();
      supervisorName = sup?.full_name ?? null;
    }
  }
  
  const highlights = transcript
    ? generateHighlights(analysis, transcript.messages)
    : [];  

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/dashboard/chats"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke daftar chat
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <OutcomeBadge outcome={chat.outcome} />
            <span className="text-sm text-muted-foreground">
              Chat ID:{" "}
              <code className="text-xs">{chat.chat_id.slice(0, 12)}</code>
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {chat.customer_name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Agent: <strong>{chat.agent_name}</strong>
            {leaderName && (
              <>
                {" • "}Leader: <strong>{leaderName}</strong>
              </>
            )}
            {supervisorName && (
              <>
                {" • "}Supervisor: <strong>{supervisorName}</strong>
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {chat.total_messages} pesan •{" "}
            {new Date(chat.created_at).toLocaleString("id-ID")}
          </p>
        </div>
        <DeleteChatDialog
          chatId={chat.chat_id}
          customerName={chat.customer_name}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Skor Agent</div>
            <div className="text-3xl font-bold">
              {chat.agent_score ?? "-"}/100
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Engagement</div>
            <div className="text-3xl font-bold">
              {chat.engagement_score ?? "-"}/100
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">
              Total Pesan
            </div>
            <div className="text-3xl font-bold">{chat.total_messages}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transcript */}
      {transcript && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              💬 Transcript Percakapan
              <span className="text-xs font-normal text-muted-foreground">
                ({transcript.total_messages} pesan)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-3 pb-3 border-b text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                  <span className="text-muted-foreground">Bagus</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
                  <span className="text-muted-foreground">Objection</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
                  <span className="text-muted-foreground">Perlu Improve</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
                  <span className="text-muted-foreground">Momen Penting</span>
                </span>
                <span className="text-muted-foreground ml-auto">
                  {highlights.length} highlight
                </span>
              </div>
            )}

            <div className="max-h-[600px] overflow-y-auto pr-2">
              <TranscriptBubble
                transcript={transcript}
                highlights={highlights}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Moments */}
      {analysis && analysis.key_moments && analysis.key_moments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-blue-600 dark:text-blue-400">
              📌 Momen Penting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {analysis.key_moments.map((moment, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{moment}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {chat.root_cause && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-primary" />
              Root Cause
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {chat.root_cause}
            </p>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <>
          {analysis.what_went_well?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  Yang Sudah Baik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.what_went_well.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        •
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {analysis.what_could_improve?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  Yang Perlu Diperbaiki
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.what_could_improve.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-amber-600 dark:text-amber-400">
                        •
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {analysis.objections?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  🚧 Objections ({analysis.objections.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.objections.map((obj, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border-l-4 ${
                      obj.handled_well
                        ? "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                        : "border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-card border">
                        {obj.type}
                      </span>
                      <span className="text-xs">
                        {obj.handled_well ? "✅ Handled" : "❌ Not handled"}
                      </span>
                    </div>
                    <div className="flex gap-2 text-sm mb-2">
                      <Quote className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="italic text-muted-foreground">
                        &ldquo;{obj.quote}&rdquo;
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Penilaian:</strong> {obj.agent_response_quality}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {analysis.customer_needs?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  🎯 Kebutuhan Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.customer_needs.map((need, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-sm rounded-full bg-accent text-accent-foreground border border-primary/20"
                    >
                      {need}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {coaching && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-blue-600 dark:text-blue-400">
              <Lightbulb className="w-5 h-5" />
              Rekomendasi Coaching
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {coaching.priority_actions?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Aksi Prioritas:</h3>
                <ol className="space-y-2">
                  {coaching.priority_actions.map((action, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {coaching.improved_scripts?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Contoh Script Perbaikan:
                </h3>
                <div className="space-y-4">
                  {coaching.improved_scripts.map((script, i) => (
                    <div
                      key={i}
                      className="rounded-lg border bg-muted/30 p-4 space-y-3"
                    >
                      <p className="text-xs text-muted-foreground italic">
                        <strong>Situasi:</strong> {script.situation}
                      </p>
                      <div className="space-y-2">
                        <div className="flex gap-2 text-sm">
                          <span className="text-rose-600 dark:text-rose-400 font-medium shrink-0">
                            Sebelum:
                          </span>
                          <span className="text-muted-foreground">
                            {script.original}
                          </span>
                        </div>
                        <div className="flex gap-2 text-sm">
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                            Sesudah:
                          </span>
                          <span>{script.improved}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {coaching.playbook_refs?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">
                  Referensi Playbook:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {coaching.playbook_refs.map((ref, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded bg-muted border"
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!analysis && !chat.root_cause && (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">
              ⏳ Analisis belum tersedia untuk chat ini.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Coba refresh beberapa saat lagi.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
