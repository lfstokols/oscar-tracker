import {Stack, Typography} from '@mui/material';
import * as React from 'react';
import useActiveUserState from '../../hooks/useActiveUserState';
import {WatchStatus} from '../../types/Enums';
import useMovieCount from '../../utils/useMovieCount';

function Text({text}: {text: string}): React.ReactElement {
  return (
    <Stack direction="row" justifyContent="start" width="100%">
      <Typography align="left" variant="body1">
        {text}
      </Typography>
    </Stack>
  );
}

type Props = {
  movies: Movie[];
  watchlist: WatchNotice[];
};

export default function MovieListInfoHeader({
  movies,
  watchlist,
}: Props): React.ReactElement {
  const activeUserState = useActiveUserState();
  const getMovieCount = useMovieCount();

  if (activeUserState[0] == null) {
    return <Text text={`${getMovieCount(movies)} movies`} />;
  }

  const seenMovies = movies.filter(
    movie =>
      watchlist.find(watch => watch.movieId === movie.id)?.status ===
      WatchStatus.seen,
  );
  const todoMovies = movies.filter(
    movie =>
      watchlist.find(watch => watch.movieId === movie.id)?.status ===
      WatchStatus.todo,
  );

  return (
    <Text
      text={`${getMovieCount(movies)} movies, ${getMovieCount(seenMovies)} seen, ${getMovieCount(todoMovies)} planned`}
    />
  );
}
