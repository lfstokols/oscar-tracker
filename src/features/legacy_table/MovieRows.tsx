import NominationsCell from './cells/NominationsCell';
import RuntimeCell from './cells/RuntimeCell';
import TitleCell from './cells/TitleCell';
import TableRow from '@mui/material/TableRow';
import WatchlistCell from './cells/WatchlistCell';
import MoviePosterCell from './cells/MoviePosterCell';

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
            <MoviePosterCell movie={movie} />
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
              runtimeMinutes={movie['runtime_minutes']}
              runtimeHours={movie['runtime_hours']}
              isRuntimeFormatted={isRuntimeFormatted}
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
