export function formatRuntime(
  hours: string | null,
  minutes: number | null,
): string | null {
  if (!hours && !minutes) return null;
  if (hours === '0' && minutes) return `${minutes}m`;
  if (hours && !minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
