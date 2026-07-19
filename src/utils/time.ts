export function formatTimeLabel(time24: string | null | undefined): string | null {
  if (!time24 || !time24.includes(':')) return null;
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${mStr} ${period}`;
}