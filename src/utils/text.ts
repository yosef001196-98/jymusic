/**
 * Normalises a metadata string. Returns '' for empty values and for the
 * placeholder strings that older builds used to store ("Local Audio", ...).
 */
export function cleanTag(value?: string | null): string {
  if (!value) return '';
  // eslint-disable-next-line no-control-regex
  const trimmed = value.replace(/\u0000/g, '').trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'local audio' || lower === 'unknown album' || lower === 'unknown genre') return '';
  return trimmed;
}

export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
