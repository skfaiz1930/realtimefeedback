import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listTracks, listNudges, startTrack, weakestFor, managerById, type DevelopmentTrack, type ManagerNudge } from "@/lib/tracks";
import { toast } from "sonner";

interface State {
  tracks: DevelopmentTrack[];
  nudges: ManagerNudge[];
  loading: boolean;
  byManager: Record<string, DevelopmentTrack | undefined>;
  refresh: () => Promise<void>;
  start: (managerId: string) => Promise<void>;
}

let cache: { tracks: DevelopmentTrack[]; nudges: ManagerNudge[] } | null = null;
const subscribers = new Set<() => void>();
let inflight: Promise<void> | null = null;
let sharedChannel: ReturnType<typeof supabase.channel> | null = null;

async function reload() {
  // Dedupe concurrent reloads — multiple components mounting simultaneously
  // would otherwise fire the same fetches in parallel and the browser aborts
  // the duplicates (which Firefox surfaces as "CORS request did not succeed").
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const [tracks, nudges] = await Promise.all([listTracks(), listNudges()]);
      cache = { tracks: tracks.filter((t) => t.status !== "completed"), nudges };
      subscribers.forEach((fn) => fn());
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

function ensureChannel() {
  if (sharedChannel) return;
  sharedChannel = supabase
    .channel("tracks-realtime-shared")
    .on("postgres_changes", { event: "*", schema: "public", table: "development_tracks" }, () => { reload().catch(() => {}); })
    .on("postgres_changes", { event: "*", schema: "public", table: "manager_nudges" }, () => { reload().catch(() => {}); })
    .subscribe();
}

export function useTracksState(): State {
  const [, setTick] = useState(0);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    subscribers.add(fn);
    ensureChannel();
    if (!cache) reload().catch(() => {}).finally(() => setLoading(false));
    else setLoading(false);

    return () => {
      subscribers.delete(fn);
      // keep the shared channel alive for the session — cheaper than tearing it down
      // and re-opening it as components mount/unmount across navigation.
    };
  }, []);

  const tracks = cache?.tracks ?? [];
  const nudges = cache?.nudges ?? [];
  const byManager: Record<string, DevelopmentTrack | undefined> = {};
  tracks.forEach((t) => { byManager[t.manager_id] = t; });

  const refresh = useCallback(async () => { await reload(); }, []);
  const start = useCallback(async (managerId: string) => {
    const m = managerById(managerId);
    if (!m) return;
    try {
      await startTrack(managerId, weakestFor(m).key);
      toast.success(`${m.name} added to a track — 6 weeks of nudges scheduled`);
      await reload();
    } catch { toast.error("Failed to start track"); }
  }, []);

  return { tracks, nudges, loading, byManager, refresh, start };
}
