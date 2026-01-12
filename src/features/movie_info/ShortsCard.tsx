import {Box, Typography} from '@mui/material';
import {Movie} from '../../types/APIDataSchema';
import {ShortsType} from '../../types/Enums';
import {GenericMovieCard} from './MovieCard';
import PosterImage from './common/PosterImage';
import RuntimeChip from './common/RuntimeChip';
import WatchlistFooter from './common/WatchlistFooter';
type Props = {
  type: ShortsType;
  movies: Movie[];
  onClick?: () => void;
};

function displayCategoryName(type: ShortsType) {
  switch (type) {
    case ShortsType.animated:
      return 'Animated Shorts';
    case ShortsType.liveAction:
      return 'Live Action Shorts';
    case ShortsType.documentary:
      return 'Documentary Shorts';
  }
}

export default function ShortsCard({type, movies, onClick}: Props) {
  const poster = conglomeratePoster(movies);
  const movieEntries = movies.map(movie => (
    <IndividualMovieEntry key={movie.id} movie={movie} />
  ));
  const footer = <WatchlistFooter movieId={movies.map(movie => movie.id)} />;

  return (
    <GenericMovieCard
      details={movieEntries}
      footer={footer}
      image={poster}
      onClick={onClick}
      title={displayCategoryName(type)}
    />
  );
}

function conglomeratePoster(movies: Movie[]) {
  const posterSize = 40; // Width of each poster in the grid
  const posterHeight = 60; // Height of each poster in the grid
  const gridColumns = 2; // Number of columns in the grid

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
        gap: 0.5,
        width: posterSize * gridColumns + (gridColumns - 1) * 4, // Account for gaps
        height:
          posterHeight * Math.ceil(movies.length / gridColumns) +
          (Math.ceil(movies.length / gridColumns) - 1) * 4,
      }}>
      {movies.map(movie => (
        <PosterThumbnail
          key={movie.id}
          height={posterHeight}
          movie={movie}
          width={posterSize}
        />
      ))}
    </Box>
  );
}

function PosterThumbnail({
  height,
  movie,
  width,
}: {
  height: number;
  movie: Movie;
  width: number;
}) {
  return <PosterImage height={height} movie={movie} width={width} />;
}

function IndividualMovieEntry({movie}: {movie: Movie}) {
  return (
    <span
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 4,
        alignItems: 'center',
      }}>
      <Typography variant="body2">{movie.title}</Typography>
      <RuntimeChip movie={movie} />
    </span>
  );
}
