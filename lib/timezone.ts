const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
export const WIB_TIME_ZONE = "Asia/Jakarta";

function getWibDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WIB_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

export function getWibMidnightUtc(date: Date = new Date(), daysAgo = 0): Date {
  const { year, month, day } = getWibDateParts(date);
  return new Date(Date.UTC(year, month - 1, day - daysAgo) - WIB_OFFSET_MS);
}

export function getWibDateKey(date: Date): string {
  const { year, month, day } = getWibDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseDbTimestamp(value: string): Date {
  // PostgreSQL timestamp tanpa timezone dikirim tanpa suffix; DB project menyimpannya UTC.
  return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);
}

export function parseWibLocalTimestamp(value: string): Date {
  // Timestamp transcript berasal dari export WhatsApp dan tidak membawa offset.
  return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}+07:00`);
}

export function formatWibDateTime(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB_TIME_ZONE,
    ...options,
  }).format(parseDbTimestamp(value));
}

export function formatWibLocalDateTime(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB_TIME_ZONE,
    ...options,
  }).format(parseWibLocalTimestamp(value));
}

export function getTodayRangeUtc(): { startUtc: string; endUtc: string } {
  const startUtc = getWibMidnightUtc();
  const endUtc = getWibMidnightUtc(new Date(), -1);
  return {
    startUtc: startUtc.toISOString(),
    endUtc: endUtc.toISOString(),
  };
}
