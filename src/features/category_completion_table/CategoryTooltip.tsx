import {Stack, Typography} from '@mui/material';
import {
  CategoryId,
  MovieList,
  NomList,
  UserId,
  WatchList,
} from '../../types/APIDataSchema';
import {getNominees} from '../../utils/dataSelectors';

export default function makeCategoryTooltip(
  catId: CategoryId,
  userId: UserId,
  nominations: NomList,
  watchlist: WatchList,
  movies: MovieList,
): React.ReactNode {
  const categoryMovies = getNominees(catId, nominations);
  const getIds = (actual: boolean) =>
    watchlist
      .filter(
        wl =>
          wl.userId === userId &&
          wl.status === (actual ? 'seen' : 'todo') &&
          categoryMovies.includes(wl.movieId),
      )
      .map(wl => wl.movieId);
  const myMovieIds = getIds(true);
  const myPlannedMovieIds = getIds(false);
  const myMissingMovieIds = categoryMovies.filter(
    movieId =>
      !myMovieIds.includes(movieId) && !myPlannedMovieIds.includes(movieId),
  );
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      spacing={2}
      sx={{
        maxWidth: '7500px',
        '& > div': {
          flex: 1,
          minWidth: '75px', // This prevents flex items from overflowing
        },
      }}>
      <div>
        <div style={{width: '100%', textAlign: 'center'}}>
          <Typography noWrap variant="h6">
            <u>Seen</u>
          </Typography>
        </div>
        <Stack gap={1.5} style={{paddingLeft: '12px', marginTop: '0px'}}>
          {myMovieIds.map(id => {
            const movie = movies.find(m => m.id === id);
            return (
              <div key={id}>
                <Typography noWrap sx={{lineHeight: 1.1}} variant="body1">
                  {movie ? movie.mainTitle : '??? '}
                </Typography>
              </div>
            );
          })}
        </Stack>
      </div>
      <div>
        <div style={{width: '100%', textAlign: 'center'}}>
          <Typography noWrap variant="h6">
            <u>Planned</u>
          </Typography>
        </div>
        <Stack gap={1.5} style={{paddingLeft: '12px', marginTop: '0px'}}>
          {myPlannedMovieIds.map(id => {
            const movie = movies.find(m => m.id === id);
            return (
              <div key={id}>
                <Typography noWrap sx={{lineHeight: 1.1}} variant="body1">
                  {movie ? movie.mainTitle : '??? '}
                </Typography>
              </div>
            );
          })}
        </Stack>
      </div>
      <div>
        <div style={{width: '100%', textAlign: 'center'}}>
          <Typography noWrap variant="h6">
            <u>Missing</u>
          </Typography>
        </div>
        <Stack gap={1.5} style={{paddingLeft: '12px', marginTop: '0px'}}>
          {myMissingMovieIds.map(id => {
            const movie = movies.find(m => m.id === id);
            return (
              <div key={id}>
                <Typography noWrap sx={{lineHeight: 1.1}} variant="body1">
                  {movie ? movie.mainTitle : '???'}
                </Typography>
              </div>
            );
          })}
        </Stack>
      </div>
    </Stack>
  );
}
