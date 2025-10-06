import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import XButton from '../../components/XButton';
import {useIsMobile} from '../../hooks/useIsMobile';
import {
  CategoryId,
  MovieList,
  NomList,
  UserId,
  WatchList,
} from '../../types/APIDataSchema';
import {getNominees} from '../../utils/dataSelectors';

export default function CategoryTooltip({
  catId,
  userId,
  nominations,
  watchlist,
  movies,
}: {
  catId: CategoryId;
  userId: UserId;
  nominations: NomList;
  watchlist: WatchList;
  movies: MovieList;
}): React.ReactNode {
  const isMobile = useIsMobile();
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
      direction="column"
      justifyContent="space-between"
      onClick={event => {
        event.stopPropagation();
        event.preventDefault();
      }}
      spacing={0}
      sx={{
        pointerEvents: 'auto',
      }}>
      {isMobile ? <XButton onClick={() => {}} /> : null}
      {MakeColumn({title: 'Seen', idList: myMovieIds, allMovies: movies})}
      {MakeColumn({
        title: 'Planned',
        idList: myPlannedMovieIds,
        allMovies: movies,
      })}
      {MakeColumn({
        title: 'Missing',
        idList: myMissingMovieIds,
        allMovies: movies,
      })}
    </Stack>
  );
}

function MakeColumn({
  title,
  idList,
  allMovies,
}: {
  title: string;
  idList: MovieId[];
  allMovies: MovieList;
}): React.ReactElement {
  const movieList = idList.map(
    id => allMovies.find(m => m.id === id) ?? {id: id, mainTitle: '??? '},
  );
  return (
    <Stack direction="column" spacing={0}>
      <div style={{width: '100%', textAlign: 'center'}}>
        <Typography noWrap variant="h6">
          <b>{title}</b>
        </Typography>
      </div>
      <Card>
        <CardContent>
          <List dense sx={{minWidth: '100px'}}>
            {movieList.map(movie => (
              <ListItem key={movie.id} disablePadding>
                <ListItemText
                  primary={movie.mainTitle}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Stack>
  );
}
