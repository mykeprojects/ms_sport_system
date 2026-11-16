export function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function sameName(left: string, right: string): boolean {
  return normalize(left).toLocaleLowerCase('es') === normalize(right).toLocaleLowerCase('es');
}

export function nameKey(value: string): string {
  return normalize(value).toLocaleLowerCase('es');
}

export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function addYears(iso: string, years: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${Number(match[1]) + years}-${match[2]}-${match[3]}`;
}

export function nextCode(items: { code: string }[], prefix: string): string {
  const max = items.reduce((highest, item) => {
    const match = new RegExp(`^${prefix}-(\\d+)$`).exec(item.code);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}
