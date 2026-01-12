import ErrorIcon from '@mui/icons-material/DoNotDisturbAlt';
import {Box, Skeleton} from '@mui/material';
import {useState} from 'react';
import {MovieDb_POSTER_URL} from '../../../config/GlobalConstants';
import {Movie} from '../../../types/APIDataSchema';

type PosterImageProps = {
  height: number;
  movie: Movie;
  showLoading?: boolean;
  width: number;
};

export default function PosterImage({
  height,
  movie,
  showLoading = false,
  width,
}: PosterImageProps) {
  const [hasError, setHasError] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  if (!movie.posterPath) {
    return (
      <Box
        sx={{
          width,
          height,
          bgcolor: 'grey.800',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ErrorIcon
          color="disabled"
          sx={{fontSize: height < 80 ? 16 : undefined}}
        />
      </Box>
    );
  }

  return (
    <Box sx={{position: 'relative', width, height}}>
      {hasError ? (
        <Box
          sx={{
            width,
            height,
            bgcolor: 'grey.800',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ErrorIcon
            color="error"
            sx={{fontSize: height < 80 ? 16 : undefined}}
          />
        </Box>
      ) : (
        <>
          {showLoading && !hasLoaded ? (
            <Skeleton
              height={height}
              sx={{position: 'absolute'}}
              variant="rectangular"
              width={width}
            />
          ) : null}
          <img
            alt={movie.mainTitle}
            onError={() => setHasError(true)}
            onLoad={() => setHasLoaded(true)}
            src={MovieDb_POSTER_URL + movie.posterPath}
            style={{
              width,
              height,
              objectFit: 'cover',
              borderRadius: 4,
              display: showLoading && !hasLoaded ? 'none' : 'block',
            }}
          />
        </>
      )}
    </Box>
  );
}
