import MovieRows from './MovieRows';
import TableRow from '@mui/material/TableRow';
import MultiMovieTitleCell from './cells/MultiMovieTitleCell';
import NominationsCell from './cells/NominationsCell';
import MultiMovieRuntimeCell from './cells/MultiMovieRuntimeCell';
import WatchlistCell from './cells/WatchlistCell';

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
