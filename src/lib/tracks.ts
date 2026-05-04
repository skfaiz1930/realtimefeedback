import { supabase } from "@/integrations/supabase/client";
import { dimensions, managers, type Manager } from "@/lib/data";

export type TrackStatus = "active" | "paused" | "completed";
export type Channel = "email" | "slack" | "in-app";
export type NudgeStatus = "sent" | "opened" | "acted";

export interface DevelopmentTrack {
  id: string;
  manager_id: string;
  focus_dimension: string;
  status: TrackStatus;
  weeks_total: number;
  start_date: string;
  created_at: string;
  updated_at: string;
}

export interface ManagerNudge {
  id: string;
  track_id: string | null;
  manager_id: string;
  channel: Channel;
  template_key: string | null;
  subject: string;
  body: string;
  status: NudgeStatus;
  sent_at: string;
  opened_at: string | null;
  acted_at: string | null;
}

/** Derive each manager's weakest dimension from the org-level data
 * (demo only — we don't have per-manager dimension scores).
 * We bias the weakest dimension by manager risk to make it feel personalised. */
export function weakestFor(manager: Manager): { key: string; label: string; score: number } {
  // pick the lowest org dimension as the universal weakest, then nudge per manager
  const sorted = [...dimensions].sort((a, b) => a.score - b.score);
  const base = sorted[0];
  // estimate manager-specific score: org base ± delta-influenced offset
  const offset = Math.round((manager.score - 70) * 0.4);
  const score = Math.max(30, Math.min(95, base.score + offset));
  return { key: base.key, label: base.label, score };
}

export const NUDGE_TEMPLATES: Record<string, { key: string; label: string }[]> = {
  connect: [
    { key: "trust-checkin", label: "Trust check-in prompt" },
    { key: "active-listening", label: "Active listening practice" },
    { key: "personal-1on1", label: "Personal 1:1 opener" },
  ],
  develop: [
    { key: "career-convo", label: "Career conversation prompt" },
    { key: "feedback-framework", label: "Feedback framework share" },
    { key: "skill-goal", label: "Skill goal check-in" },
  ],
  inspire: [
    { key: "purpose-share", label: "Team purpose share" },
    { key: "vision-story", label: "Vision storytelling tip" },
    { key: "recognition", label: "Recognition reminder" },
  ],
};

export async function listTracks(): Promise<DevelopmentTrack[]> {
  const { data, error } = await supabase
    .from("development_tracks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DevelopmentTrack[];
}

export async function listNudges(trackId?: string): Promise<ManagerNudge[]> {
  const q = supabase.from("manager_nudges").select("*").order("sent_at", { ascending: false });
  const { data, error } = trackId ? await q.eq("track_id", trackId) : await q;
  if (error) throw error;
  return (data ?? []) as ManagerNudge[];
}

export async function startTrack(managerId: string, focusDimension: string) {
  const { data, error } = await supabase
    .from("development_tracks")
    .insert({ manager_id: managerId, focus_dimension: focusDimension })
    .select()
    .single();
  if (error) throw error;
  return data as DevelopmentTrack;
}

export async function updateTrack(id: string, patch: Partial<Pick<DevelopmentTrack, "status">>) {
  const { error } = await supabase.from("development_tracks").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function sendNudge(input: Omit<ManagerNudge, "id" | "sent_at" | "opened_at" | "acted_at" | "status"> & { status?: NudgeStatus }) {
  const { data, error } = await supabase
    .from("manager_nudges")
    .insert({ ...input, status: input.status ?? "sent" })
    .select()
    .single();
  if (error) throw error;
  return data as ManagerNudge;
}

export function managerById(id: string): Manager | undefined {
  return managers.find((m) => m.id === id);
}

export function weeksElapsed(start: string): number {
  const ms = Date.now() - new Date(start).getTime();
  return Math.max(0, Math.floor(ms / (7 * 24 * 60 * 60 * 1000)));
}

export function trackStatusLabel(track: DevelopmentTrack, nudgeCount: number): { label: string; tone: "info" | "success" | "warning" | "muted" } {
  if (track.status === "completed") return { label: "Completed", tone: "success" };
  if (track.status === "paused") return { label: "Paused", tone: "muted" };
  const weeks = weeksElapsed(track.start_date);
  if (weeks === 0) return { label: "Just started", tone: "info" };
  if (nudgeCount === 0 && weeks >= 2) return { label: "Stalled", tone: "warning" };
  if (nudgeCount >= 3) return { label: "Improving", tone: "success" };
  return { label: `Week ${Math.min(weeks + 1, track.weeks_total)} of ${track.weeks_total}`, tone: "info" };
}
