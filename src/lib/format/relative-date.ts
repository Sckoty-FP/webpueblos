const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DIAS  = ['dom','lun','mar','mié','jue','vie','sáb'];

// "hace 18 min" / "en 3 días"
export function fromNow(date: Date | string): string {
  const d    = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const abs  = Math.abs(diff);
  const past = diff > 0;
  const pfx  = past ? 'hace' : 'en';

  if (abs < 60_000)                  return 'ahora mismo';
  if (abs < 3_600_000)               return `${pfx} ${Math.round(abs / 60_000)} min`;
  if (abs < 86_400_000)              return `${pfx} ${Math.round(abs / 3_600_000)} h`;
  if (abs < 7 * 86_400_000)          return `${pfx} ${Math.round(abs / 86_400_000)} días`;
  return formatAbsolute(d);
}

// "Mar 23 may · 21:00"
export function formatAbsolute(date: Date | string, withTime = true): string {
  const d   = typeof date === 'string' ? new Date(date) : date;
  const day = DIAS[d.getDay()].charAt(0).toUpperCase() + DIAS[d.getDay()].slice(1);
  const mes = MESES[d.getMonth()];
  const dd  = d.getDate();

  const now     = new Date();
  const diffMs  = Math.abs(now.getTime() - d.getTime());
  const showYear = diffMs > 180 * 86_400_000;

  const datePart = showYear
    ? `${dd} ${mes} ${d.getFullYear()}`
    : `${day} ${dd} ${mes}`;

  if (!withTime) return datePart;

  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${datePart} · ${hh}:${mm}`;
}
