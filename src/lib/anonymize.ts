/**
 * Ethical anonymization helper.
 * Risk/disengagement signals must NEVER expose a person's real name to managers.
 * We surface a stable pseudonym derived from the user id (or input string).
 */
export function anonymize(idOrName: string): string {
  let h = 0;
  for (let i = 0; i < idOrName.length; i++) h = (h * 31 + idOrName.charCodeAt(i)) >>> 0;
  const code = (h % 9000) + 1000;
  return `Collaborateur #${code}`;
}

export function initialsOnly(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join(".") + ".";
}
