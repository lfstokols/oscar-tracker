import {Chip} from '@mui/material';
import {Movie} from '../../../types/APIDataSchema';

function formatRuntime(
  hours: string | null,
  minutes: number | null,
): string | null {
  if (!hours && !minutes) return null;
  if (hours === '0' && minutes) return `${minutes}m`;
  if (hours && !minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export default function RuntimeChip({
  movie,
}: {
  movie: Movie;
}): React.ReactElement | null {
  const runtime = formatRuntime(movie.runtime_hours, movie.runtime_minutes);
  return runtime !== null ? (
    <Chip label={runtime} size="small" variant="outlined" />
  ) : null;
}
