import LaunchIcon from '@mui/icons-material/Launch';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid2,
  IconButton,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {useSuspenseQueries} from '@tanstack/react-query';
import {Suspense} from 'react';
import {z} from 'zod';
import imdbIcon from '../../assets/IMDb_Logo_Rectangle_Gold.png';
import JWIcon from '../../assets/JW_logo_color_10px.svg';
import Entry from '../../components/SingleNomEntry';
import {SEEN_COLOR, TODO_COLOR} from '../../config/StyleChoices';
import {WatchlistCell} from '../../features/legacy_table/cells/WatchlistCell';
import {
  categoryOptions,
  nomOptions,
  userOptions,
  watchlistOptions,
} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import {
  NotificationsDispatch,
  useNotifications,
} from '../../providers/NotificationContext';
import {CategoryList, Movie, MovieId, NomList} from '../../types/APIDataSchema';
import {Grouping, WatchStatus, grouping_display_names} from '../../types/Enums';
import {errorToConsole} from '../../utils/Logger';
import PosterImage from './common/PosterImage';
import RuntimeChip from './common/RuntimeChip';
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

type NominationWithCategory = {
  nom: NomList[0];
  category: CategoryList[0];
};

function groupNominationsByGrouping(
  nominations: NomList,
  categories: CategoryList,
): Record<Grouping, NominationWithCategory[]> {
  const result: Record<Grouping, NominationWithCategory[]> = {} as Record<
    Grouping,
    NominationWithCategory[]
  >;
  for (const grouping of Object.values(Grouping)) {
    result[grouping] = nominations
      .map(nom => {
        const category = categories.find(cat => cat.id === nom.categoryId);
        if (!category) return null;
        if (category.grouping === grouping) {
          return {nom, category};
        }
        return null;
      })
      .filter((item): item is NominationWithCategory => item !== null);
  }
  return result;
}

function MoviePageContent({movie}: Props): React.ReactElement {
  const {year} = useOscarAppContext();
  const [nominationsQ, categoriesQ] = useSuspenseQueries({
    queries: [nomOptions(year), categoryOptions()],
  });
  const categories = categoriesQ.data;
  const nominations = nominationsQ.data;

  const movieNominations = nominations.filter(nom => nom.movieId === movie.id);

  // Group nominations by category grouping
  const nominationsByGrouping = groupNominationsByGrouping(
    movieNominations,
    categories,
  );

  return (
    <Grid2
      container
      spacing={3}
      sx={{maxWidth: '1400px', mx: 'auto', width: '100%'}}>
      <Grid2 size={{md: 4, xs: 12}}>
        <MovieHeaderCard movie={movie} />
      </Grid2>

      <Grid2 size={{md: 8, xs: 12}}>
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography sx={{fontWeight: 'bold', mb: 2}} variant="h6">
                External Links
              </Typography>
              <ExternalLinks movieId={movie.id} />
            </CardContent>
          </Card>

          <NominationsCard
            categories={categories}
            nominationsByGrouping={nominationsByGrouping}
          />

          <WatchlistCard movieId={movie.id} />

          <PersonalWatchStatusCard movieId={movie.id} />
        </Stack>
      </Grid2>
    </Grid2>
  );
}

function NominationsGroup({
  categories,
  grouping,
  nominations,
}: {
  categories: CategoryList;
  grouping: Grouping;
  nominations: NominationWithCategory[];
}): React.ReactElement {
  const displayName = grouping_display_names[grouping] || grouping;

  return (
    <Box>
      <Typography sx={{fontWeight: 'bold', mb: 1.5}} variant="subtitle1">
        {displayName}
      </Typography>
      <Divider sx={{mb: 1.5}} />
      <Stack spacing={1.5}>
        {nominations.map(({category, nom}) => (
          <NominationEntry
            key={`${nom.categoryId}-${nom.note}`}
            categories={categories}
            category={category}
            nom={nom}
          />
        ))}
      </Stack>
    </Box>
  );
}

const logoHeight = '25px';
const logoMargin = '10px';

const justWatchIcon = (
  <img
    alt="JustWatch"
    src={JWIcon}
    style={{maxHeight: logoHeight}}
    width="auto"
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
    <Stack direction="column" spacing={0} sx={{width: '100px'}}>
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
      style={{margin: logoMargin, padding: 0}}>
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
    <Card>
      <CardContent>
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
    <Card>
      <CardContent>
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
    <Card sx={{height: '100%'}}>
      <CardContent>
        <Stack alignItems={{md: 'flex-start', xs: 'center'}} spacing={2}>
          <Box sx={{display: 'flex', justifyContent: 'center', width: '100%'}}>
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

function NominationsCard({
  categories,
  nominationsByGrouping,
}: {
  categories: CategoryList;
  nominationsByGrouping: Record<Grouping, NominationWithCategory[]>;
}): React.ReactElement {
  const groupingList = Object.values(Grouping);

  return (
    <Card>
      <CardContent>
        <Typography sx={{fontWeight: 'bold', mb: 2}} variant="h6">
          Nominations
        </Typography>
        <Stack spacing={3}>
          {groupingList.map(grouping => {
            const noms = nominationsByGrouping[grouping];
            if (noms.length === 0) {
              return null;
            }
            return (
              <NominationsGroup
                key={grouping}
                categories={categories}
                grouping={grouping}
                nominations={noms}
              />
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

function NominationEntry({
  categories,
  category,
  nom,
}: {
  categories: CategoryList;
  category: CategoryList[0];
  nom: NomList[0];
}): React.ReactElement {
  return (
    <Paper elevation={1} sx={{p: 1.5}}>
      <Stack alignItems="flex-start" direction="row" spacing={1}>
        <Typography sx={{flex: 1}} variant="body1">
          <Entry categories={categories} includeNote={true} nom={nom} />
        </Typography>
        <Link
          href="#"
          onClick={e => {
            e.preventDefault();
            // Navigate to category filter - you may want to implement this
          }}
          sx={{alignItems: 'center', display: 'flex'}}>
          <LaunchIcon fontSize="small" />
        </Link>
      </Stack>
      {category.fullName !== category.shortName ? (
        <Typography
          color="text.secondary"
          sx={{display: 'block', mt: 0.5}}
          variant="caption">
          {category.fullName}
        </Typography>
      ) : null}
    </Paper>
  );
}

function MoviePageSkeleton(): React.ReactElement {
  return (
    <Box sx={{width: '100%', height: '100%'}}>
      <Typography>Loading movie information...</Typography>
    </Box>
  );
}
