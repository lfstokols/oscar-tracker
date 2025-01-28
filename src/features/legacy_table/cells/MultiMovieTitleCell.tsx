import {TableCell, Table, TableBody, TableRow} from '@mui/material';
import TitleCell from './TitleCell';

type Props = {
  filteredMovies: Movie[];
};

export default function MultiMovieTitleCell({
  filteredMovies,
}: Props): React.ReactElement {
  return (
    <TableCell sx={{padding: 0}} colSpan={2}>
      <Table>
        <TableBody>
          {filteredMovies.map((movie, index) => (
            <TableRow key={movie.id + 'mini'}>
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
