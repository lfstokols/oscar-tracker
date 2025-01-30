import ErrorIcon from '@mui/icons-material/DoNotDisturbAlt';
import {Box, Modal, Skeleton, TableCell} from '@mui/material';
import * as React from 'react';
import {Suspense, useState} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import {
  MovieDb_POSTER_URL,
  MovieDb_POSTER_URL_XL,
} from '../../../config/GlobalConstants';
import {useIsMobile} from '../../../hooks/useIsMobile';

type Props = {movie: Movie};

export default function MoviePosterCell({movie}: Props): React.ReactElement {
  const [hasError, setHasError] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);

  const isMobile = useIsMobile();

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
                onClick={() => {
                  setIsExpanded(true);
                  console.log(movie.posterPath);
                }}
                onError={() => {
                  setHasError(true);
                }}
                onLoad={() => {
                  setHasLoaded(true);
                }}
                role="button"
                src={MovieDb_POSTER_URL + movie.posterPath}
                style={{
                  maxHeight: '100px',
                  borderRadius: '4px',
                  display: hasLoaded ? 'block' : 'none',
                  cursor: 'pointer',
                }}
              />
            </>
          )}
        </Suspense>
      </ErrorBoundary>
      <Modal onClose={() => setIsExpanded(false)} open={isExpanded}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            '&:focus-visible ': {
              outline: 'none !important',
            },
          }}>
          <img
            alt={movie.mainTitle}
            onClick={() => setIsExpanded(false)}
            src={MovieDb_POSTER_URL_XL + movie.posterPath}
            style={{
              maxHeight: isMobile ? 'unset' : 'calc(100vh - 24px)',
              maxWidth: isMobile ? 'calc(100vw - 24px)' : 'unset',
              borderRadius: '4px',
            }}
          />
        </Box>
      </Modal>
    </TableCell>
  );
}
