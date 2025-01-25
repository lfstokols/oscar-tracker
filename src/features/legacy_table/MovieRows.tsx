import MultiMovieRuntimeCell from './MultiMovieRuntimeCell';
import MultiMovieTitleCell from './MultiMovieTitleCell';
import NominationsCell from './NominationsCell';
import RuntimeCell from './RuntimeCell';
import TitleCell from './TitleCell';
import TableRow from '@mui/material/TableRow';
import WatchlistCell from './WatchlistCell';

type Props = {
  filteredMovies: Movie[];
  nominations: Nom[];
  categories: CategoryList;
  preferences: Preferences;
  sortedUsers: User[];
  isRuntimeFormatted: boolean;
};

export default function MovieRows({
  isRuntimeFormatted,
  filteredMovies,
  nominations,
  categories,
  preferences,
  sortedUsers,
}: Props): React.ReactElement {
  return (
    <>
      {filteredMovies.map(movie => {
        return (
          <TableRow
            key={movie.id}
            sx={
              {
                // backgroundColor: TABLE_ROW_COLOR,
              }
            }>
            <TitleCell
              movie={movie}
              nominations={nominations}
              preferences={preferences}
            />
            <NominationsCell
              movieId={movie.id}
              nominations={nominations}
              categories={categories}
            />
            <RuntimeCell
              runtime_minutes={movie['runtime_minutes']}
              runtime_hours={movie['runtime_hours']}
              display_formatted={isRuntimeFormatted}
            />
            {sortedUsers.map(user => (
              <WatchlistCell
                key={user.id}
                userId={user.id}
                movieId={movie.id}
              />
            ))}
          </TableRow>
        );
      })}
    </>
  );
}
