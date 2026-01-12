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
          width: {xs: '100%', sm: width},
          maxWidth: width,
          height: {xs: 'auto', sm: height},
          aspectRatio: `${width} / ${height}`,
          margin: '0 auto',
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
    <Box
      sx={{
        position: 'relative',
        width: {xs: '100%', sm: width},
        maxWidth: width,
        height: {xs: 'auto', sm: height},
        aspectRatio: `${width} / ${height}`,
        margin: '0 auto',
      }}>
      {hasError ? (
        <Box
          sx={{
            width: '100%',
            height: '100%',
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
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
              }}
              variant="rectangular"
            />
          ) : null}
          <img
            alt={movie.mainTitle}
            onError={() => setHasError(true)}
            onLoad={() => setHasLoaded(true)}
            src={MovieDb_POSTER_URL + movie.posterPath}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: 4,
              display: showLoading && !hasLoaded ? 'none' : 'block',
            }}
          />
        </>
      )}
    </Box>
  );
}
