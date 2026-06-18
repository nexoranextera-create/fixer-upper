import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/auth";

export type RTNotif = {
  id: string;
  t: string;
  d: string;
  time: string;
  kind: "info" | "warn" | "ok";
  read?: boolean;
};

/**
 * Subscribe to Supabase Realtime sources relevant to the role and push new
 * notifications via `onNew`. Currently wires:
 *  - absences inserts  -> manager/rh get a "new leave request" notif
 *  - ai_escalations    -> rh get a "new escalation" notif
 *  - presence_events   -> manager get unusual presence
 */
export function useRealtimeNotifs(role: Role, onNew: (n: RTNotif) => void) {
  useEffect(() => {
    const channels: ReturnType<typeof supabase.channel>[] = [];

    if (role === "manager" || role === "rh") {
      const ch = supabase
        .channel(`rt-absences-${role}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "absences" },
          (payload) => {
            const a = payload.new as { id: string; type?: string; start_date?: string };
            onNew({
              id: `abs-${a.id}`,
              t: "New leave request",
              d: `${a.type ?? "leave"} starting ${a.start_date ?? "soon"} — awaiting validation.`,
              time: "just now",
              kind: "info",
            });
          },
        )
        .subscribe();
      channels.push(ch);
    }

    if (role === "rh") {
      const ch = supabase
        .channel("rt-escalations-rh")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "ai_escalations" },
          (payload) => {
            const e = payload.new as { id: string; topic?: string };
            onNew({
              id: `esc-${e.id}`,
              t: "AI escalation",
              d: `Topic: ${e.topic ?? "unspecified"} — review in queue.`,
              time: "just now",
              kind: "warn",
            });
          },
        )
        .subscribe();
      channels.push(ch);
    }

    return () => {
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, [role, onNew]);
}
