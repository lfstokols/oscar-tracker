import React from 'react';
import {MovieDb_POSTER_URL} from '../../../config/GlobalConstants';
import {TableCell} from '@mui/material';

type Props = {movie: Movie};

export default function MoviePosterCell({movie}: Props): React.ReactElement {
  return (
    <TableCell sx={{className: 'runtime-column'}} align="center">
      <img
        src={MovieDb_POSTER_URL + movie.posterPath}
        alt={movie.mainTitle}
        style={{maxHeight: '100px', borderRadius: '4px'}}
      />
    </TableCell>
  );
}
