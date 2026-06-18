import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel } from "@/components/dashboard/Bits";
import { Heart, Check } from "lucide-react";

const FACES: { score: number; emoji: string; label: string; color: string }[] = [
  { score: 1, emoji: "😔", label: "Tough", color: "#dc2626" },
  { score: 2, emoji: "😕", label: "Meh",   color: "#f59e0b" },
  { score: 3, emoji: "😐", label: "OK",    color: "#a3a3a3" },
  { score: 4, emoji: "🙂", label: "Good",  color: "#16a34a" },
  { score: 5, emoji: "😄", label: "Great", color: "#0ea5e9" },
];

export function MoodPulse() {
  const [done, setDone] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const sinceMonday = new Date();
      sinceMonday.setDate(sinceMonday.getDate() - ((sinceMonday.getDay() + 6) % 7));
      sinceMonday.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("mood_checks" as any)
        .select("score,created_at")
        .gte("created_at", sinceMonday.toISOString())
        .order("created_at", { ascending: false })
        .limit(1);
      const row = (data as any[] | null)?.[0];
      if (row) setDone(row.score);
    })();
  }, []);

  async function submit() {
    if (picked == null) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const { error } = await supabase.from("mood_checks" as any).insert({
      user_id: u.user.id, score: picked, note: note || null,
    });
    setSaving(false);
    if (!error) { setDone(picked); setNote(""); setPicked(null); }
  }

  if (done != null) {
    const face = FACES.find((f) => f.score === done)!;
    return (
      <Panel label="MOOD PULSE" title="Thanks for sharing this week">
        <div className="flex items-center gap-3 py-2">
          <div className="text-4xl">{face.emoji}</div>
          <div className="flex-1">
            <div className="text-sm font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-green-600"/> Recorded · {face.label}
            </div>
            <div className="text-[11px] text-muted-foreground">Anonymously aggregated for your team's well-being analytics.</div>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel label="MOOD PULSE" title="How's your week?">
      <div className="flex items-start gap-2 mb-3">
        <Heart className="w-4 h-4 text-accent mt-0.5"/>
        <div className="text-[11px] text-muted-foreground leading-relaxed">
          One tap per week. Your individual score is never shown to your manager — only the team's aggregated trend.
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {FACES.map((f) => (
          <button
            key={f.score}
            onClick={() => setPicked(f.score)}
            className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition ${picked === f.score ? "border-foreground bg-foreground/5" : "border-border hover:bg-muted"}`}
            style={picked === f.score ? { boxShadow: `0 0 0 2px ${f.color}` } : undefined}
            type="button"
          >
            <span className="text-2xl">{f.emoji}</span>
            <span className="text-[9px] tracking-wider uppercase font-semibold" style={{ color: f.color }}>{f.label}</span>
          </button>
        ))}
      </div>
      {picked != null && (
        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <textarea
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (anonymous)…"
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm resize-none focus:outline-none focus:border-foreground"
          />
          <button
            onClick={submit}
            disabled={saving}
            className="pill-btn accent w-full justify-center !py-2 !text-[11px] tracking-[0.2em] uppercase disabled:opacity-50"
            type="button"
          >
            {saving ? "Recording…" : "Send pulse"}
          </button>
        </div>
      )}
    </Panel>
  );
}
