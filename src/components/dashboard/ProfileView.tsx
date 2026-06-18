import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getUser, setUser, ROLE_META, type Role, type User } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowUpRight, Mail, Phone, MapPin, Building2, Calendar,
  Award, Edit3, Camera, ShieldCheck, Loader2, Briefcase, Heart,
} from "lucide-react";

interface ProfileRow {
  full_name: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  department: string | null;
  position: string | null;
  avatar_url: string | null;
  bio: string | null;
  address: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  hire_date: string | null;
}

const EMPTY: ProfileRow = {
  full_name: "", email: "", phone: "", location: "", department: "", position: "",
  avatar_url: "", bio: "", address: "", emergency_contact: "", emergency_phone: "", hire_date: "",
};

export function ProfileView({ role }: { role: Role }) {
  const navigate = useNavigate();
  const [u, setU] = useState<User | null>(null);
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [signedAvatar, setSignedAvatar] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileRow>(EMPTY);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) { navigate({ to: "/auth" }); return; }
    setU(user);
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name,email,phone,location,department,position,avatar_url,bio,address,emergency_contact,emergency_phone,hire_date")
        .eq("id", user.id)
        .maybeSingle();
      if (!error && data) {
        setForm({ ...EMPTY, ...data });
        if (data.avatar_url) refreshAvatar(data.avatar_url);
      }
      setLoading(false);
    })();
  }, [navigate]);

  async function refreshAvatar(path: string) {
    const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
    if (data?.signedUrl) setSignedAvatar(data.signedUrl);
  }

  function field(k: keyof ProfileRow, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    if (!u) return;
    setSaving(true); setMsg(null);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name ?? "",
      phone: form.phone || null,
      location: form.location || null,
      department: form.department || null,
      position: form.position || null,
      bio: form.bio || null,
      address: form.address || null,
      emergency_contact: form.emergency_contact || null,
      emergency_phone: form.emergency_phone || null,
    }).eq("id", u.id);
    setSaving(false);
    if (error) { setMsg(error.message); return; }
    setUser({ ...u, name: form.full_name || u.name });
    setU({ ...u, name: form.full_name || u.name });
    setEdit(false);
    setMsg("Saved");
    setTimeout(() => setMsg(null), 2000);
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!u) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setMsg("Image too large (max 4 MB)"); return; }
    if (!file.type.startsWith("image/")) { setMsg("Please pick an image"); return; }

    setAvatarBusy(true); setMsg(null);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${u.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setMsg(upErr.message); setAvatarBusy(false); return; }

    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ avatar_url: path })
      .eq("id", u.id);
    if (dbErr) { setMsg(dbErr.message); setAvatarBusy(false); return; }

    setForm((f) => ({ ...f, avatar_url: path }));
    await refreshAvatar(path);
    setAvatarBusy(false);
    setMsg("Photo updated");
    setTimeout(() => setMsg(null), 2000);
  }

  if (!u) return null;
  const meta = ROLE_META[role] ?? ROLE_META.collab;
  const initial = (form.full_name || u.name || "?").slice(0, 1).toUpperCase();

  return (
    <div className="space-y-4 -mx-5">
      <div className="px-2">
        <div className="edunai-card overflow-hidden">
          <div className="relative h-28" style={{ background: "var(--grad-brand)" }}>
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="absolute top-3 left-3 bracket-tag !text-white">PROFILE</div>
          </div>
          <div className="px-5 pb-5 -mt-10">
            <div className="flex items-end gap-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full grid place-items-center bg-foreground text-background font-display font-extrabold text-2xl border-4 border-card overflow-hidden">
                  {signedAvatar ? (
                    <img src={signedAvatar} alt="" className="w-full h-full object-cover" />
                  ) : initial}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarBusy}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent text-white grid place-items-center border-2 border-card disabled:opacity-60"
                  title="Change photo"
                >
                  {avatarBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
              </div>
              <button onClick={() => setEdit((e) => !e)} className="ml-auto pill-btn !py-2 !px-3 !text-[10px] tracking-[0.2em] uppercase">
                <Edit3 className="w-3 h-3" /> {edit ? "Cancel" : "Edit"}
              </button>
            </div>

            {!edit ? (
              <>
                <h1 className="mt-4 font-display font-bold text-2xl tracking-tight">{form.full_name || u.name}</h1>
                <div className="text-[10px] tracking-[0.22em] uppercase text-accent font-bold mt-1">{meta.label}</div>
                <p className="text-sm text-muted-foreground mt-2">{form.bio || meta.tagline}</p>
              </>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input id="pname" label="Full name" value={form.full_name ?? ""} onChange={(v) => field("full_name", v)} />
                <Input id="pphone" label="Phone" type="tel" value={form.phone ?? ""} onChange={(v) => field("phone", v)} />
                <Input id="pposition" label="Job title" value={form.position ?? ""} onChange={(v) => field("position", v)} />
                <Input id="pdept" label="Department" value={form.department ?? ""} onChange={(v) => field("department", v)} />
                <Input id="ploc" label="Location" value={form.location ?? ""} onChange={(v) => field("location", v)} />
                <Input id="paddr" label="Address" value={form.address ?? ""} onChange={(v) => field("address", v)} />
                <Input id="pec" label="Emergency contact" value={form.emergency_contact ?? ""} onChange={(v) => field("emergency_contact", v)} />
                <Input id="pep" label="Emergency phone" type="tel" value={form.emergency_phone ?? ""} onChange={(v) => field("emergency_phone", v)} />
                <div className="field sm:col-span-2">
                  <div className="relative">
                    <textarea id="pbio" placeholder=" " rows={3} value={form.bio ?? ""} onChange={(e) => field("bio", e.target.value)} className="w-full" />
                    <label htmlFor="pbio">Short bio</label>
                  </div>
                </div>
                <button disabled={saving} onClick={save} className="pill-btn solid sm:col-span-2 !pl-5 !pr-1.5 !py-1.5 justify-between !text-[11px] tracking-[0.2em] uppercase disabled:opacity-60">
                  {saving ? "Saving…" : "Save changes"}
                  <span className="arrow-circle">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}</span>
                </button>
              </div>
            )}
            {msg && <div className="mt-3 text-xs text-muted-foreground">{msg}</div>}
            {loading && <div className="mt-3 text-xs text-muted-foreground">Loading…</div>}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-2 grid grid-cols-3 gap-2">
        {[
          { l: "Tenure", v: form.hire_date ? `${Math.max(1, Math.floor((Date.now() - new Date(form.hire_date).getTime()) / (365 * 86400000)))}y` : "—" },
          { l: "Role", v: meta.label.split(" ")[0] },
          { l: "Status", v: "Active" },
        ].map((s) => (
          <div key={s.l} className="edunai-card p-3 text-center">
            <div className="text-[9px] tracking-[0.22em] uppercase text-muted-foreground">{s.l}</div>
            <div className="font-display font-bold text-lg mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="px-2">
        <div className="edunai-card p-5">
          <div className="section-label mb-4">contact</div>
          <ul className="divide-y divide-border text-sm">
            {[
              { i: Mail, l: "Email", v: form.email || u.email },
              { i: Phone, l: "Phone", v: form.phone || "—" },
              { i: MapPin, l: "Location", v: form.location || "—" },
              { i: Building2, l: "Department", v: form.department || "—" },
              { i: Briefcase, l: "Position", v: form.position || "—" },
              { i: Calendar, l: "Hired", v: form.hire_date ?? "—" },
              { i: Heart, l: "Emergency", v: form.emergency_contact ? `${form.emergency_contact} · ${form.emergency_phone ?? ""}` : "—" },
            ].map(({ i: Icon, l, v }) => (
              <li key={l} className="py-3 flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground w-24 shrink-0">{l}</span>
                <span className="ml-auto font-medium text-foreground/90 truncate min-w-0">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="px-2">
        <div className="edunai-card p-5">
          <div className="section-label mb-4">badges</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { i: Award, t: "Top performer", c: "var(--accent)" },
              { i: ShieldCheck, t: "Security MVP", c: "#1d1d1d" },
              { i: Calendar, t: "Streak 14d", c: "var(--accent)" },
            ].map(({ i: Ic, t, c }) => (
              <div key={t} className="text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center text-white" style={{ background: c }}>
                  <Ic className="w-5 h-5" />
                </div>
                <div className="text-[10px] tracking-[0.15em] uppercase font-semibold mt-2 leading-tight">{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-2 pb-4">
        <div className="edunai-card p-5">
          <div className="section-label mb-4">permissions</div>
          <div className="flex flex-wrap gap-2">
            {(role === "admin"
              ? ["RBAC", "Audit", "Security", "Policies", "Users", "Billing"]
              : role === "manager"
              ? ["Team data", "Insights", "Alerts", "Reports"]
              : role === "rh"
              ? ["People", "Documents", "Onboarding", "Offboarding", "AI supervision"]
              : ["Self-service", "Documents", "Assistant"]
            ).map((p) => (
              <span key={p} className="text-[10px] tracking-[0.18em] uppercase px-3 py-1.5 rounded-full bg-foreground text-background font-bold">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ id, label, value, onChange, type = "text" }: {
  id: string; label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="field">
      <div className="relative">
        <input id={id} type={type} placeholder=" " value={value} onChange={(e) => onChange(e.target.value)} />
        <label htmlFor={id}>{label}</label>
      </div>
    </div>
  );
}
