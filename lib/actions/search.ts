"use server";
import { db, schema } from "@/lib/db";
import { and, eq, isNull, ilike, or } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export type SearchResult = {
  kind: "lead" | "program" | "page";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

export async function searchEverything(q: string): Promise<SearchResult[]> {
  const needle = q.trim();
  const { tenant } = await requireUser();

  const PAGES: SearchResult[] = [
    { kind: "page", id: "leads",      title: "Leads pipeline",   href: "/leads" },
    { kind: "page", id: "customers",  title: "Customers",        href: "/customers" },
    { kind: "page", id: "programs",   title: "Programs",         href: "/programs" },
    { kind: "page", id: "dashboard",  title: "Dashboard",        href: "/dashboard" },
    { kind: "page", id: "follow-ups", title: "Follow-ups",       href: "/follow-ups" },
    { kind: "page", id: "calendar",   title: "Calendar",         href: "/calendar" },
    { kind: "page", id: "templates",  title: "Email templates",  href: "/templates" },
    { kind: "page", id: "settings",   title: "Settings",         href: "/settings" },
    { kind: "page", id: "users",      title: "Users & roles",    href: "/settings/users" },
  ];

  if (!needle) {
    return PAGES.slice(0, 6);
  }

  const wildcard = `%${needle}%`;

  const [leads, programs] = await Promise.all([
    db.select({
      id: schema.leads.id,
      fullName: schema.leads.fullName,
      phone: schema.leads.phone,
      email: schema.leads.email,
      stage: schema.leads.stage,
    })
    .from(schema.leads)
    .where(and(
      eq(schema.leads.tenantId, tenant.id),
      isNull(schema.leads.deletedAt),
      or(
        ilike(schema.leads.fullName, wildcard),
        ilike(schema.leads.email, wildcard),
        ilike(schema.leads.phone, wildcard),
        ilike(schema.leads.city, wildcard),
      ),
    ))
    .limit(8),

    db.select({
      id: schema.programs.id,
      name: schema.programs.name,
      type: schema.programs.type,
      price: schema.programs.price,
    })
    .from(schema.programs)
    .where(and(
      eq(schema.programs.tenantId, tenant.id),
      ilike(schema.programs.name, wildcard),
    ))
    .limit(5),
  ]);

  const results: SearchResult[] = [];

  for (const l of leads) {
    results.push({
      kind: "lead", id: l.id,
      title: l.fullName,
      subtitle: l.email ?? l.phone ?? l.stage,
      href: `/leads/${l.id}`,
    });
  }

  for (const p of programs) {
    results.push({
      kind: "program", id: p.id,
      title: p.name,
      subtitle: `${p.type} · ₾ ${p.price}`,
      href: "/programs",
    });
  }

  const matchedPages = PAGES.filter((pg) =>
    pg.title.toLowerCase().includes(needle.toLowerCase()),
  );
  results.push(...matchedPages);

  return results;
}
