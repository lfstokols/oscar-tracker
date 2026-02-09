import TableRow from '@mui/material/TableRow';
import MovieRows from './MovieRows';
import MultiMovieRuntimeCell from './cells/MultiMovieRuntimeCell';
import MultiMovieTitleCell from './cells/MultiMovieTitleCell';
import NominationsCell from './cells/NominationsCell';
import WatchlistCell from '../both_movie_views/WatchlistCell';

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
        categories={categories}
        movieId={filteredMovies[0].id}
        nominations={nominations}
      />
      <MultiMovieRuntimeCell
        filteredMovies={filteredMovies}
        isRuntimeFormatted
      />
      {sortedUsers.map(user => (
        <WatchlistCell
          key={user.id}
          movieId={filteredMovies.map(movie => movie.id)}
          userId={user.id}
        />
      ))}
    </TableRow>
  );
}
