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
  const {merge, filteredMovies, nominations, categories, sortedUsers} = props;

  if (filteredMovies.length === 0) {
    return null;
  }

  if (!merge) {
    return <MovieRows {...props} />;
  }

  return (
    <TableRow
      sx={
        {
          // backgroundColor: TABLE_ROW_COLOR,
        }
      }>
      <MultiMovieTitleCell filteredMovies={filteredMovies} />
      <NominationsCell
        movieId={filteredMovies[0].id}
        nominations={nominations}
        categories={categories}
      />
      <MultiMovieRuntimeCell
        filteredMovies={filteredMovies}
        isRuntimeFormatted
      />
      {sortedUsers.map(user => (
        <WatchlistCell
          key={user.id}
          userId={user.id}
          movieId={filteredMovies.map(movie => movie.id)}
        />
      ))}
    </TableRow>
  );
}
