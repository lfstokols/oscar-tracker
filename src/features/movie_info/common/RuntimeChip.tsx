import {Chip} from '@mui/material';
import {Movie} from '../../../types/APIDataSchema';
import {formatRuntime} from '../../../utils/formatRuntime';

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
