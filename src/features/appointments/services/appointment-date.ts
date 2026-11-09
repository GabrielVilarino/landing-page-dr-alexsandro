export const CLINIC_TIMEZONE =
  process.env.NEXT_PUBLIC_CLINIC_TIMEZONE || "America/Araguaina";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLINIC_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function clinicDate(date = new Date()) {
  return dateFormatter.format(date);
}

function timezoneOffset(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  const zonedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  const minutes = Math.round((zonedAsUtc - date.getTime()) / 60000);
  const sign = minutes >= 0 ? "+" : "-";
  const absolute = Math.abs(minutes);
  return `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

export function clinicInstant(date: string, time: string) {
  if (!isClinicDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new RangeError("Data ou horário da clínica inválido.");
  }
  const estimate = new Date(`${date}T${time}:00Z`);
  return `${date}T${time}:00${timezoneOffset(estimate)}`;
}

export function isClinicDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  return (
    value.getUTCFullYear() === year &&
    value.getUTCMonth() === month - 1 &&
    value.getUTCDate() === day
  );
}

export function clinicInterval(date: string, view: "day" | "week") {
  if (!isClinicDate(date)) return null;
  const base = new Date(`${date}T12:00:00Z`);
  const day = base.getUTCDay();
  if (view === "week") base.setUTCDate(base.getUTCDate() - day);
  const startDate = base.toISOString().slice(0, 10);
  base.setUTCDate(base.getUTCDate() + (view === "week" ? 7 : 1));
  const endDate = base.toISOString().slice(0, 10);
  return {
    start_at: clinicInstant(startDate, "00:00"),
    end_at: clinicInstant(endDate, "00:00"),
    startDate,
    endDate,
  };
}

export function moveClinicDate(date: string, days: number) {
  if (!isClinicDate(date)) return clinicDate();
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function scheduleBlockInterval(date = clinicDate()) {
  const startDate = isClinicDate(date) ? date : clinicDate();
  return {
    start_at: clinicInstant(startDate, "00:00"),
    end_at: clinicInstant(moveClinicDate(startDate, 32), "00:00"),
  };
}

export function formatClinicDateTime(
  value: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: CLINIC_TIMEZONE,
    dateStyle: "short",
    timeStyle: "short",
    ...options,
  }).format(new Date(value));
}

export function formatClinicTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: CLINIC_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
