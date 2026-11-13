import { Chapter, RULE, validTime } from "./RunRecords";
export interface Invite { kind: "invite" | "challenge" | "progress"; chapter?: Chapter; targetMs?: number; oldRule: boolean; key: string }
export function parseInvite(query: unknown): Invite | undefined {
  if (!query || typeof query !== "object") return;
  const q = query as Record<string, unknown>;
  if (q.sv !== "1" || !["invite", "challenge", "progress"].includes(String(q.from))) return;
  if (Object.values(q).some(v => typeof v !== "string" || v.length > 160)) return;
  const kind = q.from as Invite["kind"];
  if (kind === "invite") return { kind, oldRule: false, key: "invite" };
  if (q.level !== "1" && q.level !== "2") return;
  const chapter = Number(q.level) as Chapter;
  if (typeof q.rule !== "string" || q.rule.length > 24) return;
  const targetMs = kind === "challenge" ? Number(q.targetMs) : undefined;
  if (kind === "challenge" && (!/^\d+$/.test(String(q.targetMs)) || !validTime(targetMs))) return;
  return { kind, chapter, targetMs, oldRule: q.rule !== RULE, key: `${kind}:${chapter}:${q.rule}:${targetMs ?? 0}` };
}
