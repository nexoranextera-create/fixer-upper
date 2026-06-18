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
 * Real-time notification fan-out via Supabase Realtime.
 *  - manager / rh                   -> new absences (leave requests)
 *  - rh                              -> AI escalations
 *  - manager / rh / admin / medecin -> alerts (severity-coloured)
 *  - medecin / collab                -> medical_requests (new + status changes)
 */
export function useRealtimeNotifs(role: Role, onNew: (n: RTNotif) => void) {
  useEffect(() => {
    const channels: ReturnType<typeof supabase.channel>[] = [];

    if (role === "manager" || role === "rh") {
      channels.push(
        supabase
          .channel(`rt-absences-${role}`)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "absences" }, (payload) => {
            const a = payload.new as { id: string; type?: string; start_date?: string };
            onNew({
              id: `abs-${a.id}`,
              t: "New leave request",
              d: `${a.type ?? "leave"} starting ${a.start_date ?? "soon"} — awaiting validation.`,
              time: "just now",
              kind: "info",
            });
          })
          .subscribe(),
      );
    }

    if (role === "rh") {
      channels.push(
        supabase
          .channel("rt-escalations-rh")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_escalations" }, (payload) => {
            const e = payload.new as { id: string; topic?: string };
            onNew({
              id: `esc-${e.id}`,
              t: "AI escalation",
              d: `Topic: ${e.topic ?? "unspecified"} — review in queue.`,
              time: "just now",
              kind: "warn",
            });
          })
          .subscribe(),
      );
    }

    // Alerts -> everyone with a steering view
    if (role === "manager" || role === "rh" || role === "admin" || role === "medecin") {
      channels.push(
        supabase
          .channel(`rt-alerts-${role}`)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
            const a = payload.new as { id: string; title?: string; description?: string; severity?: string };
            onNew({
              id: `alert-${a.id}`,
              t: a.title ?? "New alert",
              d: (a.description ?? "").slice(0, 140),
              time: "just now",
              kind: a.severity === "critical" || a.severity === "high" ? "warn" : "info",
            });
          })
          .subscribe(),
      );
    }

    // Medical requests -> doctor sees new ones, employee sees status changes
    if (role === "medecin") {
      channels.push(
        supabase
          .channel("rt-medreq-medecin")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "medical_requests" }, (payload) => {
            const r = payload.new as { id: string; topic?: string; urgency?: string };
            onNew({
              id: `medreq-${r.id}`,
              t: "New consultation request",
              d: `${r.topic ?? "—"} · urgency ${r.urgency ?? "normal"}`,
              time: "just now",
              kind: r.urgency === "high" ? "warn" : "info",
            });
          })
          .subscribe(),
      );
    }

    if (role === "collab") {
      channels.push(
        supabase
          .channel("rt-medreq-collab")
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "medical_requests" }, (payload) => {
            const r = payload.new as { id: string; topic?: string; status?: string };
            if (r.status === "scheduled" || r.status === "done") {
              onNew({
                id: `medreq-upd-${r.id}-${r.status}`,
                t: r.status === "scheduled" ? "Consultation scheduled" : "Consultation closed",
                d: `${r.topic ?? "Your request"} — ${r.status}.`,
                time: "just now",
                kind: "ok",
              });
            }
          })
          .subscribe(),
      );
    }

    return () => {
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, [role, onNew]);
}
