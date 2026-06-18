import { createFileRoute } from "@tanstack/react-router";

const DEMO = [
  // Hero accounts (one per role)
  { email: "aya@wasl.app",     password: "aya12345",     full_name: "Aya EL HAQYQY",     role: "collab"  as const, department: "Engineering", position: "Frontend Engineer" },
  { email: "yasmine@wasl.app", password: "yasmine12345", full_name: "Yasmine AMRI",      role: "manager" as const, department: "Engineering", position: "Engineering Manager" },
  { email: "sara@wasl.app",    password: "sara12345",    full_name: "Sara RAFIK",        role: "rh"      as const, department: "People",      position: "HR Business Partner" },
  { email: "nadia@wasl.app",   password: "nadia12345",   full_name: "Dr. Nadia BENNANI", role: "medecin" as const, department: "Health",      position: "Occupational Doctor" },
  { email: "oussama@wasl.app", password: "oussama12345", full_name: "Oussama ETTALALI",  role: "admin"   as const, department: "IT",          position: "Platform Admin" },
  // Extra collaborators (realistic team)
  { email: "mehdi@wasl.app",   password: "mehdi12345",   full_name: "Mehdi ZIANI",       role: "collab"  as const, department: "Engineering", position: "Backend Engineer" },
  { email: "salma@wasl.app",   password: "salma12345",   full_name: "Salma BENALI",      role: "collab"  as const, department: "Product",     position: "Product Designer" },
  { email: "rachid@wasl.app",  password: "rachid12345",  full_name: "Rachid TAZI",       role: "collab"  as const, department: "Sales",       position: "Account Executive" },
  { email: "imane@wasl.app",   password: "imane12345",   full_name: "Imane EL FASSI",    role: "collab"  as const, department: "Marketing",   position: "Content Lead" },
  { email: "youssef@wasl.app", password: "youssef12345", full_name: "Youssef CHAOUI",    role: "collab"  as const, department: "Finance",     position: "Financial Analyst" },
  // Extra manager + HR
  { email: "khalid@wasl.app",  password: "khalid12345",  full_name: "Khalid NACIRI",     role: "manager" as const, department: "Sales",       position: "Sales Manager" },
  { email: "hajar@wasl.app",   password: "hajar12345",   full_name: "Hajar BERRADA",     role: "rh"      as const, department: "People",      position: "Talent Acquisition" },
];

export const Route = createFileRoute("/api/public/seed-demo")({
  server: {
    handlers: {
      POST: async () => seed(),
      GET: async () => seed(),
    },
  },
});

async function seed() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const results: Array<{ email: string; status: string }> = [];
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });

  for (const acc of DEMO) {
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === acc.email);

    let userId: string;
    if (existing) {
      userId = existing.id;
      results.push({ email: acc.email, status: "exists" });
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.full_name },
      });
      if (error || !created.user) {
        results.push({ email: acc.email, status: `error: ${error?.message ?? "unknown"}` });
        continue;
      }
      userId = created.user.id;
      results.push({ email: acc.email, status: "created" });
    }

    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email: acc.email,
      full_name: acc.full_name,
      department: acc.department,
      position: acc.position,
      organisation_id: "00000000-0000-0000-0000-000000000001",
    });

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: acc.role });
    if (roleErr && !roleErr.message.includes("duplicate")) {
      results.push({ email: acc.email, status: `role-error: ${roleErr.message}` });
    }
  }

  return new Response(JSON.stringify({ ok: true, results }, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
