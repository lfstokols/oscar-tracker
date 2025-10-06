import {Table, TableBody, TableCell, TableRow} from '@mui/material';
import MoviePosterCell from './MoviePosterCell';
import TitleCell from './TitleCell';

type Props = {
  filteredMovies: Movie[];
};

export default function MultiMovieTitleCell({
  filteredMovies,
}: Props): React.ReactElement {
  return (
    <TableCell colSpan={2} sx={{padding: 0}}>
      <Table>
        <TableBody>
          {filteredMovies.map((movie, index) => (
            <TableRow key={movie.id + 'mini'}>
              <MoviePosterCell movie={movie} />
              <TitleCell
                movie={movie}
                sx={{
                  borderBottom:
                    index === 4
                      ? 'none'
                      : '1px solid --mui-palette-text-primary',
                }}
              />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCell>
  );
}
