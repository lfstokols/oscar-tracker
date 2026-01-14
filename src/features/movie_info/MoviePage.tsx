import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid2,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import {useQuery, useSuspenseQueries} from '@tanstack/react-query';
import {Suspense} from 'react';
import {z} from 'zod';
import imdbIcon from '../../assets/IMDb_Logo_Rectangle_Gold.png';
import JWIcon from '../../assets/JW_logo_color_10px.svg';
import {SEEN_COLOR, TODO_COLOR} from '../../config/StyleChoices';
import {WatchlistCell} from '../../features/legacy_table/cells/WatchlistCell';
import {
  categoryOptions,
  nomOptions,
  tmdbMovieOptions,
  userOptions,
  watchlistOptions,
} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import {
  NotificationsDispatch,
  useNotifications,
} from '../../providers/NotificationContext';
import {Movie, MovieId} from '../../types/APIDataSchema';
import {WatchStatus} from '../../types/Enums';
import {TMDBCrewMember} from '../../types/TMDBTypes';
import {errorToConsole} from '../../utils/Logger';
import PosterImage from './common/PosterImage';
import RuntimeChip from './common/RuntimeChip';
import NominationsCard from './movie_page_components/NominationsCard';
import UserStatusGroup from './movie_page_components/UserStatusGroup';

type Props = {
  movie: Movie;
};

export default function MoviePage({movie}: Props): React.ReactElement {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: {xs: 2, sm: 3, md: 4},
        overflow: 'auto',
      }}>
      <Suspense fallback={<MoviePageSkeleton />}>
        <MoviePageContent movie={movie} />
      </Suspense>
    </Box>
  );
}

function MoviePageContent({movie}: Props): React.ReactElement {
  const {year} = useOscarAppContext();
  const [nominationsQ, categoriesQ] = useSuspenseQueries({
    queries: [nomOptions(year), categoryOptions()],
  });
  const categories = categoriesQ.data;
  const nominations = nominationsQ.data;

  const movieNominations = nominations.filter(nom => nom.movieId === movie.id);

  return (
    <Grid2 container spacing={3} sx={{width: '100%'}}>
      <Grid2
        // size={{xl: 4, lg: 5, xs: 12}}

        sx={{
          width: '100%',
          overflow: 'visible',
          // Ensure enough space for poster (267px) + padding + spacing
          '@media (min-width: 300px)': {
            minWidth: '300px',
          },
        }}>
        <MovieHeaderCard movie={movie} />
      </Grid2>

      <Grid2 sx={{width: '100%'}}>
        <Stack spacing={3} sx={{width: '100%'}}>
          <MovieDetailsCard movieId={movie.id} />

          <Card sx={{width: '100%'}}>
            <CardContent sx={{width: '100%'}}>
              <Typography sx={{fontWeight: 'bold', mb: 2}} variant="h6">
                External Links
              </Typography>
              <ExternalLinks movieId={movie.id} />
            </CardContent>
          </Card>

          <NominationsCard
            categories={categories}
            movieNominations={movieNominations}
          />

          <WatchlistCard movieId={movie.id} />

          <PersonalWatchStatusCard movieId={movie.id} />
        </Stack>
      </Grid2>
    </Grid2>
  );
}

const logoHeight = '25px';

const justWatchIcon = (
  <img
    alt="JustWatch"
    height={logoHeight}
    src={JWIcon}
    style={{height: logoHeight, width: 'auto'}}
  />
);

const ImdbIcon = <img alt="IMDB" height={logoHeight} src={imdbIcon} />;

const apiResponse = z
  .object({
    failed: z.boolean(),
    message: z.string().optional(),
    url: z.string().url().optional(),
  })
  .refine(
    data => {
      if (data.failed) {
        return data.message !== undefined;
      }
      return data.url !== undefined;
    },
    {
      message:
        'Invalid API response, if successful must include url, if unsuccessful must include message',
    },
  );

function ExternalLinks({movieId}: {movieId: MovieId}): React.ReactElement {
  return (
    <Stack direction="row" justifyContent="space-around" spacing={1}>
      <ExternalLinkButton
        icon={justWatchIcon}
        movieId={movieId}
        service="justwatch"
      />
      <ExternalLinkButton icon={ImdbIcon} movieId={movieId} service="imdb" />
    </Stack>
  );
}

function ExternalLinkButton({
  icon,
  movieId,
  service,
}: {
  icon: React.ReactElement;
  movieId: MovieId;
  service: string;
}): React.ReactElement {
  const notifications = useNotifications();
  return (
    <IconButton
      onClick={() => handleLinkClick(service, movieId, notifications)}
      sx={{padding: 0}}>
      {icon}
    </IconButton>
  );
}

function handleLinkClick(
  service: string,
  movieId: MovieId,
  notifications: NotificationsDispatch,
) {
  const params = new URLSearchParams({
    id: movieId.toString(),
    service: service,
  });
  const url = `/api/forward/get_link?${params.toString()}`;
  fetch(url)
    .then(response => response.json())
    .then((data: z.infer<typeof apiResponse>) => {
      const valid_data = apiResponse.parse(data);
      if (valid_data.failed) {
        notifications.show({
          type: 'info',
          message: valid_data.message ?? 'There are no offers for this movie',
        });
      } else if (valid_data.url) {
        window.open(valid_data.url, '_blank');
      }
    })
    .catch(error => {
      errorToConsole(`Error fetching link: ${error}`);
      notifications.show({
        type: 'error',
        message: 'Unable to obtain link',
      });
    });
}

function WatchlistCard({movieId}: {movieId: MovieId}): React.ReactElement {
  return (
    <Card sx={{width: '100%'}}>
      <CardContent sx={{width: '100%'}}>
        <Typography sx={{fontWeight: 'bold', mb: 2}} variant="h6">
          Watchlist
        </Typography>
        <Suspense fallback={<Typography>Loading watchlist...</Typography>}>
          <WatchlistUserList movieId={movieId} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

function WatchlistUserList({movieId}: {movieId: MovieId}): React.ReactElement {
  const context = useOscarAppContext();
  const year = context.year;
  const activeUserId = context.activeUserId;

  const [watchlistQ, usersQ] = useSuspenseQueries({
    queries: [watchlistOptions(year), userOptions()],
  });
  const watchlist = watchlistQ.data;
  const users = usersQ.data;

  // Get watch statuses for this movie
  const movieWatches = watchlist.filter(w => w.movieId === movieId);

  // Filter out the active user's watch status
  const otherUsersWatches = movieWatches.filter(w => w.userId !== activeUserId);

  // Group by status
  const seenWatches = otherUsersWatches.filter(
    w => w.status === WatchStatus.seen,
  );
  const todoWatches = otherUsersWatches.filter(
    w => w.status === WatchStatus.todo,
  );

  return (
    <Stack spacing={2}>
      {seenWatches.length > 0 && (
        <UserStatusGroup
          color={SEEN_COLOR}
          status={WatchStatus.seen}
          users={users}
          watches={seenWatches}
        />
      )}
      {todoWatches.length > 0 && (
        <UserStatusGroup
          color={TODO_COLOR}
          status={WatchStatus.todo}
          users={users}
          watches={todoWatches}
        />
      )}
      {seenWatches.length === 0 && todoWatches.length === 0 && (
        <Typography color="text.secondary" variant="body2">
          No other users have watched or want to watch this movie
        </Typography>
      )}
    </Stack>
  );
}

function PersonalWatchStatusCard({
  movieId,
}: {
  movieId: MovieId;
}): React.ReactElement {
  const context = useOscarAppContext();
  const activeUserId = context.activeUserId;

  return (
    <Card sx={{width: '100%'}}>
      <CardContent sx={{width: '100%'}}>
        <Typography sx={{fontWeight: 'bold', mb: 2}} variant="h6">
          My Watch Status
        </Typography>
        {activeUserId !== null ? (
          <Suspense fallback={<Typography>Loading...</Typography>}>
            <Box sx={{display: 'flex', justifyContent: 'center'}}>
              <WatchlistCell movieId={movieId} userId={activeUserId} />
            </Box>
          </Suspense>
        ) : (
          <Typography color="text.secondary" variant="body2">
            Log in to track your watch status
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function MovieHeaderCard({movie}: {movie: Movie}): React.ReactElement {
  return (
    <Card sx={{overflow: 'visible', width: '100%', height: 'fit-content'}}>
      <CardContent sx={{overflow: 'visible', width: '100%'}}>
        <Stack
          alignItems={{md: 'flex-start', xs: 'center'}}
          spacing={2}
          sx={{width: '100%'}}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              overflow: 'visible',
            }}>
            <PosterImage height={400} movie={movie} showLoading width={267} />
          </Box>
          <MovieTitleSection movie={movie} />
        </Stack>
      </CardContent>
    </Card>
  );
}

function MovieTitleSection({movie}: {movie: Movie}): React.ReactElement {
  return (
    <Box sx={{width: '100%'}}>
      <Typography component="h1" sx={{fontWeight: 'bold', mb: 1}} variant="h4">
        {movie.mainTitle}
      </Typography>
      {movie.subtitle ? (
        <Typography
          color="text.secondary"
          sx={{fontStyle: 'italic', mb: 2}}
          variant="h6">
          {movie.subtitle}
        </Typography>
      ) : null}
      <Stack direction="row" flexWrap="wrap" gap={1} spacing={1} sx={{mb: 2}}>
        <RuntimeChip movie={movie} />
        {movie.isShort ? (
          <Chip color="secondary" label="Short Film" size="small" />
        ) : null}
        <Chip
          label={`${movie.numNoms} Nomination${movie.numNoms > 1 ? 's' : ''}`}
          size="small"
          variant="outlined"
        />
      </Stack>
    </Box>
  );
}

function MovieDetailsCard({movieId}: {movieId: MovieId}): React.ReactElement {
  const {data: tmdbData, isPending, isError} = useQuery(tmdbMovieOptions(movieId));

  if (isPending) {
    return (
      <Card sx={{width: '100%'}}>
        <CardContent>
          <Typography color="text.secondary">
            Loading movie details...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return <Card sx={{display: 'none'}} />;
  }

  const directors =
    tmdbData.credits?.crew.filter(
      (c: TMDBCrewMember) => c.job === 'Director',
    ) ?? [];
  const topCast = tmdbData.credits?.cast.slice(0, 5) ?? [];

  return (
    <Card sx={{width: '100%'}}>
      <CardContent>
        {tmdbData.tagline ? (
          <Typography
            color="text.secondary"
            sx={{fontStyle: 'italic', mb: 2}}
            variant="body1">
            &ldquo;{tmdbData.tagline}&rdquo;
          </Typography>
        ) : null}

        {tmdbData.overview ? (
          <Typography sx={{mb: 2}} variant="body2">
            {tmdbData.overview}
          </Typography>
        ) : null}

        {tmdbData.genres.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{mb: 2}}>
            {tmdbData.genres.map(genre => (
              <Chip key={genre.id} label={genre.name} size="small" />
            ))}
          </Stack>
        )}

        {directors.length > 0 && (
          <Typography color="text.secondary" variant="body2">
            <strong>Director:</strong> {directors.map(d => d.name).join(', ')}
          </Typography>
        )}

        {topCast.length > 0 && (
          <Typography color="text.secondary" variant="body2">
            <strong>Cast:</strong> {topCast.map(c => c.name).join(', ')}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function MoviePageSkeleton(): React.ReactElement {
  return (
    <Box sx={{width: '100%', height: '100%'}}>
      <Typography>Loading movie information...</Typography>
    </Box>
  );
}
