import Fuse from "fuse.js";
import type { TranscriptMessage } from "@/types/database";
import type { ChatAnalysis } from "@/types/database";

export interface Highlight {
  messageIndex: number;
  type: "good" | "objection" | "improve" | "key";
  label: string;
  confidence: number; // 0-1
}

/**
 * Fuzzy match quote ke transcript message.
 * Return index pesan yang paling cocok, atau -1 kalau tidak ketemu.
 */
function findMessageIndex(
  quote: string,
  messages: TranscriptMessage[],
  fuseCache: Map<string, Fuse<TranscriptMessage>>
): number {
  console.log("[Fuzzy] searching:", quote.slice(0, 60));

  if (!quote || quote.length < 5) {
    console.log("[Fuzzy] quote too short, skip");
    return -1;
  }

  // Buang tanda kutip di awal/akhir
  const cleanQuote = quote.replace(/^["""'']+|["""'']+$/g, "").trim();
  if (cleanQuote.length < 5) return -1;

  // Cek cache Fuse
  let fuse = fuseCache.get("_global");
  if (!fuse) {
    fuse = new Fuse(messages, {
      keys: ["content"],
      threshold: 0.5,          // cukup toleran
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 5,
    });
    fuseCache.set("_global", fuse);
  }

  const results = fuse.search(cleanQuote);
  console.log("[Fuzzy] results:", results.length, "| best score:", results[0]?.score);

  if (results.length === 0) {
    console.log("[Fuzzy] ❌ no matches");
    return -1;
  }

  const best = results[0];
  const score = best.score ?? 1;

  if (score > 0.5) {
    console.log("[Fuzzy] ❌ score too high:", score);
    return -1;
  }

  console.log("[Fuzzy] ✅ MATCH at index", best.refIndex, "| score:", score);
  return best.refIndex;
}

/**
 * Generate highlights dari analysis + transcript.
 */
export function generateHighlights(
  analysis: ChatAnalysis | null,
  messages: TranscriptMessage[]
): Highlight[] {
  console.log("[Highlight] called:", {
    hasAnalysis: !!analysis,
    messageCount: messages.length,
    objections: analysis?.objections?.length ?? 0,
    keyMoments: analysis?.key_moments?.length ?? 0,
  });

  if (!analysis || messages.length === 0) return [];

  const highlights: Highlight[] = [];
  const fuseCache = new Map<string, Fuse<TranscriptMessage>>();

  // 1. Objections — kuning (handled) atau merah (not handled)
  for (const obj of analysis.objections ?? []) {
    const idx = findMessageIndex(obj.quote, messages, fuseCache);
    if (idx === -1) continue;

    highlights.push({
      messageIndex: idx,
      type: "objection",  // ← selalu kuning
      label: obj.handled_well
        ? `🟡 Objection ${obj.type} (handled)`
        : `🟡 Objection ${obj.type} (not handled)`,
      confidence: 0.8,
    });
  }

  // 2. what_went_well — hijau
  // (LLM kadang kasih paragraf, kita coba match ke pesan terakhir agent)
  // Untuk sekarang, kita skip matching ketat; cukup tampilkan di sidebar

  // 3. what_could_improve — merah
  // Sama seperti above

  // 4. key_moments — biru
  // for (const moment of analysis.key_moments ?? []) {
  //   const idx = findMessageIndex(moment, messages, fuseCache);
  //   if (idx === -1) continue;

  //   highlights.push({
  //     messageIndex: idx,
  //     type: "key",
  //     label: "📌 Momen Penting",
  //     confidence: 0.7,
  //   });
  // }

  // Dedup: kalau ada 2 highlight di message yang sama, prioritaskan
  // improve > objection > key > good
  const byIndex = new Map<number, Highlight>();
  for (const h of highlights) {
    const existing = byIndex.get(h.messageIndex);
    if (!existing) {
      byIndex.set(h.messageIndex, h);
      continue;
    }
    const priority = { improve: 4, objection: 3, key: 2, good: 1 };
    if (priority[h.type] > priority[existing.type]) {
      // Simpan yang baru sebagai primary, tapi tetap catat yang lama
      // (untuk sekarang, kita hanya simpan 1 highlight utama)
      byIndex.set(h.messageIndex, h);
    }
  }

  return Array.from(byIndex.values());
}
