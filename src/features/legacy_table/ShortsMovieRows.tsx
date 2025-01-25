import MovieRows from './MovieRows';
import TableRow from '@mui/material/TableRow';
import MultiMovieTitleCell from './MultiMovieTitleCell';
import NominationsCell from './NominationsCell';
import MultiMovieRuntimeCell from './MultiMovieRuntimeCell';
import WatchlistCell from './WatchlistCell';

type Props = {
  merge: boolean;
  isRuntimeFormatted: boolean;
  filteredMovies: Movie[];
  nominations: Nom[];
  categories: CategoryList;
  preferences: Preferences;
  sortedUsers: User[];
};

export default function ShortsMovieRows(
  props: Props,
): React.ReactElement | null {
  if (props.filteredMovies.length === 0) {
    return null;
  }

  if (!props.merge) {
    return <MovieRows {...props} />;
  }

  return (
    <TableRow
      key={props.filteredMovies.reduce((acc, movie) => acc + movie.id, '')}
      sx={
        {
          // backgroundColor: TABLE_ROW_COLOR,
        }
      }>
      <MultiMovieTitleCell filteredMovies={props.filteredMovies} />
      <NominationsCell
        movieId={props.filteredMovies[0].id}
        nominations={props.nominations}
        categories={props.categories}
      />
      <MultiMovieRuntimeCell
        filteredMovies={props.filteredMovies}
        isRuntimeFormatted
      />
      {props.sortedUsers.map(user => (
        <WatchlistCell
          key={user.id}
          userId={user.id}
          movieId={props.filteredMovies.map(movie => movie.id)}
        />
      ))}
    </TableRow>
  );
}
