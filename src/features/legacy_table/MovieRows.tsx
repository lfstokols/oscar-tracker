import TableRow from '@mui/material/TableRow';
import ExternalLinkCell from './cells/ExternalLinkCell';
import MoviePosterCell from './cells/MoviePosterCell';
import NominationsCell from './cells/NominationsCell';
import RuntimeCell from './cells/RuntimeCell';
import TitleCell from './cells/TitleCell';
import WatchlistCell from '../both_movie_views/WatchlistCell';

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
              categories={categories}
              compact={true}
              movieId={movie.id}
              nominations={nominations}
            />
            <ExternalLinkCell movieId={movie.id} />
            <RuntimeCell
              isRuntimeFormatted={isRuntimeFormatted}
              runtimeHours={movie['runtime_hours']}
              runtimeMinutes={movie['runtime_minutes']}
            />
            {sortedUsers.map(user => (
              <WatchlistCell
                key={user.id}
                movieId={movie.id}
                userId={user.id}
              />
            ))}
          </TableRow>
        );
      })}
    </>
  );
}
