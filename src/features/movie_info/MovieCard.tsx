// A card that displays information about a movie for mobile view
// Poster on left, title/metadata on right, footer with watchlist controls
import ErrorIcon from '@mui/icons-material/DoNotDisturbAlt';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Suspense, useState} from 'react';
import {MovieDb_POSTER_URL} from '../../config/GlobalConstants';
import {SEEN_COLOR, TODO_COLOR} from '../../config/StyleChoices';
import {watchlistOptions} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import {Movie} from '../../types/APIDataSchema';
import {WatchStatus} from '../../types/Enums';
import {WatchlistCell} from '../legacy_table/cells/WatchlistCell';

type Props = {
  movie: Movie;
};

export default function MovieCard({movie}: Props): React.ReactElement {
  return (
    <Card sx={{display: 'flex', flexDirection: 'column'}}>
      <Box sx={{display: 'flex', flexDirection: 'row', p: 1.5, gap: 1.5}}>
        <MoviePoster movie={movie} />
        <MovieInfo movie={movie} />
      </Box>
      <CardActions
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
        }}>
        <Suspense fallback={<Skeleton height={32} width={120} />}>
          <WatchlistFooter movieId={movie.id} />
        </Suspense>
      </CardActions>
    </Card>
  );
}

function MoviePoster({movie}: {movie: Movie}): React.ReactElement {
  const [hasError, setHasError] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  if (!movie.posterPath) {
    return (
      <Box
        sx={{
          width: 80,
          height: 120,
          bgcolor: 'grey.800',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ErrorIcon color="disabled" />
      </Box>
    );
  }

  return (
    <Box sx={{position: 'relative', width: 80, height: 120, flexShrink: 0}}>
      {hasError ? (
        <Box
          sx={{
            width: 80,
            height: 120,
            bgcolor: 'grey.800',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ErrorIcon color="error" />
        </Box>
      ) : (
        <>
          {!hasLoaded && (
            <Skeleton
              height={120}
              sx={{position: 'absolute'}}
              variant="rectangular"
              width={80}
            />
          )}
          <img
            alt={movie.mainTitle}
            onError={() => setHasError(true)}
            onLoad={() => setHasLoaded(true)}
            src={MovieDb_POSTER_URL + movie.posterPath}
            style={{
              width: 80,
              height: 120,
              objectFit: 'cover',
              borderRadius: 4,
              display: hasLoaded ? 'block' : 'none',
            }}
          />
        </>
      )}
    </Box>
  );
}

function MovieInfo({movie}: {movie: Movie}): React.ReactElement {
  const runtime = formatRuntime(movie.runtime_hours, movie.runtime_minutes);

  return (
    <CardContent sx={{p: 0, flex: 1, minWidth: 0}}>
      <Typography
        noWrap
        sx={{fontWeight: 'bold', lineHeight: 1.2}}
        variant="body1">
        {movie.mainTitle}
      </Typography>
      {!!movie.subtitle && (
        <Typography color="text.secondary" noWrap variant="body2">
          <i>{movie.subtitle}</i>
        </Typography>
      )}
      <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{mt: 1}} useFlexGap>
        {runtime !== null && (
          <Chip label={runtime} size="small" variant="outlined" />
        )}
        {movie.numNoms > 1 && (
          <Chip
            label={`${movie.numNoms} noms`}
            size="small"
            variant="outlined"
          />
        )}
      </Stack>
    </CardContent>
  );
}

function formatRuntime(
  hours: string | null,
  minutes: number | null,
): string | null {
  if (!hours && !minutes) return null;
  if (hours === '0' && minutes) return `${minutes}m`;
  if (hours && !minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function WatchlistFooter({movieId}: {movieId: MovieId}): React.ReactElement {
  const context = useOscarAppContext();
  const year = context.year;
  const activeUserId = context.activeUserId;

  const {data: watchlist} = useSuspenseQuery(watchlistOptions(year));

  // Get watch statuses for this movie
  const movieWatches = watchlist.filter(w => w.movieId === movieId);

  // Count other users' statuses
  const otherUsersWatches = movieWatches.filter(w => w.userId !== activeUserId);
  const seenCount = otherUsersWatches.filter(
    w => w.status === WatchStatus.seen,
  ).length;
  const todoCount = otherUsersWatches.filter(
    w => w.status === WatchStatus.todo,
  ).length;

  return (
    <>
      {activeUserId !== null ? (
        <WatchlistCell movieId={movieId} userId={activeUserId} />
      ) : (
        <Typography color="text.secondary" variant="body2">
          Log in to track
        </Typography>
      )}
      <OtherUsersWatchSummary seenCount={seenCount} todoCount={todoCount} />
    </>
  );
}

function OtherUsersWatchSummary({
  seenCount,
  todoCount,
}: {
  seenCount: number;
  todoCount: number;
}): React.ReactElement {
  if (seenCount === 0 && todoCount === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        No one else tracking
      </Typography>
    );
  }

  return (
    <Stack direction="row" gap={0.5}>
      {seenCount > 0 && (
        <Chip
          label={`${seenCount} seen`}
          size="small"
          sx={{bgcolor: SEEN_COLOR, color: 'white'}}
        />
      )}
      {todoCount > 0 && (
        <Chip
          label={`${todoCount} to-do`}
          size="small"
          sx={{bgcolor: TODO_COLOR, color: 'white'}}
        />
      )}
    </Stack>
  );
}
