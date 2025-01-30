import React, {Suspense, useState} from 'react';
import {MovieDb_POSTER_URL} from '../../../config/GlobalConstants';
import {Skeleton, TableCell} from '@mui/material';
import {ErrorBoundary} from 'react-error-boundary';
import ErrorIcon from '@mui/icons-material/DoNotDisturbAlt';

type Props = {movie: Movie};

export default function MoviePosterCell({movie}: Props): React.ReactElement {
  const [hasError, setHasError] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  return (
    <TableCell
      key={`poster-${movie.id}`}
      align="center"
      sx={{className: 'runtime-column'}}>
      <ErrorBoundary fallback={<ErrorIcon />}>
        <Suspense
          fallback={<Skeleton height={100} variant="rectangular" width={66} />}>
          {hasError ? (
            <ErrorIcon color="error" />
          ) : (
            <>
              {!hasLoaded && (
                <Skeleton height={100} variant="rectangular" width={66} />
              )}
              <img
                alt={movie.mainTitle}
                onError={() => {
                  setHasError(true);
                }}
                onLoad={() => {
                  setHasLoaded(true);
                }}
                src={MovieDb_POSTER_URL + movie.posterPath}
                style={{
                  maxHeight: '100px',
                  borderRadius: '4px',
                  display: hasLoaded ? 'block' : 'none',
                }}
              />
            </>
          )}
        </Suspense>
      </ErrorBoundary>
    </TableCell>
  );
}
