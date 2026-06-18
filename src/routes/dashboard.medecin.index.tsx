import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Panel } from "@/components/dashboard/Bits";
import { Heart, Activity, AlertTriangle, Stethoscope, Flame, ShieldAlert } from "lucide-react";
import { getMedicalSnapshot } from "@/lib/medical.functions";

export const Route = createFileRoute("/dashboard/medecin/")({ component: MedecinHome });

function Stat({ icon: Icon, label, value, sub, tone = "default" }: { icon: any; label: string; value: string | number; sub?: string; tone?: "default" | "warn" | "danger" | "good" }) {
  const colors = { default: "var(--accent)", warn: "#f59e0b", danger: "#dc2626", good: "#16a34a" } as const;
  return (
    <div className="edunai-card p-3">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl grid place-items-center text-white" style={{ background: colors[tone] }}><Icon className="w-4 h-4"/></div>
        <div className="bracket-tag">{label}</div>
      </div>
      <div className="font-display font-bold text-2xl mt-2">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function MedecinHome() {
  const fn = useServerFn(getMedicalSnapshot);
  const { data, isLoading, error } = useQuery({ queryKey: ["medecin-snap"], queryFn: () => fn(), refetchInterval: 60000 });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (error) return <div className="text-sm text-red-600">{(error as Error).message}</div>;

  return (
    <div className="space-y-5">
      <PageHeader kicker="Occupational health" title="Well-being dashboard" subtitle="Confidential cross-signals to detect burnout & sick-leave patterns — anonymised at the team level." />

      <div className="grid grid-cols-2 gap-2">
        <Stat icon={Heart} label="Sick days (90d)" value={data?.sickDays ?? 0} tone="warn" />
        <Stat icon={Activity} label="Avg engagement" value={`${data?.avgEngagement ?? 0}/100`} tone={(data?.avgEngagement ?? 0) < 60 ? "danger" : "good"} />
        <Stat icon={Flame} label="Burnout candidates" value={data?.burnoutCandidates ?? 0} tone="danger" sub="≥3 absences + low pulse" />
        <Stat icon={AlertTriangle} label="Open escalations" value={(data?.escalations ?? []).filter((e: any) => e.status === "open").length} tone="warn" />
      </div>

      <Panel label="ALERTS" title="Recent health-related signals">
        {(data?.recentAlerts ?? []).slice(0, 6).map((a: any) => (
          <div key={a.id} className="py-2 border-b border-border last:border-0">
            <div className="text-sm font-medium">{a.title}</div>
            <div className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString()} · {a.severity}</div>
          </div>
        ))}
        {(data?.recentAlerts ?? []).length === 0 && <div className="text-xs text-muted-foreground py-4">No recent alerts.</div>}
      </Panel>

      <Panel label="ESCALATIONS" title="AI-flagged sensitive cases">
        {(data?.escalations ?? []).slice(0, 6).map((e: any) => (
          <div key={e.id} className="py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-accent" />
              <span className="text-sm font-medium capitalize">{String(e.topic).replace("_", " ")}</span>
              <span className="text-[10px] tracking-wider uppercase text-muted-foreground ml-auto">{e.status}</span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate">{e.prompt_excerpt}</div>
          </div>
        ))}
        {(data?.escalations ?? []).length === 0 && <div className="text-xs text-muted-foreground py-4">No escalations.</div>}
      </Panel>

      <div className="text-[11px] text-muted-foreground flex items-center gap-2 px-2">
        <Stethoscope className="w-3 h-3" />
        Data shown is anonymised. Individual employee identity is never displayed without explicit consent.
      </div>
    </div>
  );
}
