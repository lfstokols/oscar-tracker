import React, {Suspense, useState} from 'react';
import {MovieDb_POSTER_URL} from '../../../config/GlobalConstants';
import {Skeleton, TableCell} from '@mui/material';
import {ErrorBoundary} from 'react-error-boundary';
import ErrorIcon from '@mui/icons-material/DoNotDisturbAlt';

type Props = {movie: Movie};

export default function MoviePosterCell({movie}: Props): React.ReactElement {
  const [hasError, setHasError] = useState(false);
  return (
    <TableCell
      sx={{className: 'runtime-column'}}
      align="center"
      key={`poster-${movie.id}`}>
      <ErrorBoundary fallback={<ErrorIcon />}>
        <Suspense
          fallback={<Skeleton variant="rectangular" height={100} width={66} />}>
          {hasError ? (
            <ErrorIcon color="error" />
          ) : (
            <img
              src={MovieDb_POSTER_URL + movie.posterPath}
              alt={movie.mainTitle}
              style={{maxHeight: '100px', borderRadius: '4px'}}
              onError={() => {
                setHasError(true);
              }}
            />
          )}
        </Suspense>
      </ErrorBoundary>
    </TableCell>
  );
}
