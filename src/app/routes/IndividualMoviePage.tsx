import {useSuspenseQueries} from '@tanstack/react-query';
import {Suspense} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import AppErrorScreen from '../../components/AppErrorScreen';
import DefaultTabContainer from '../../components/DefaultTabContainer';
import {LoadScreen} from '../../components/LoadScreen';
import MoviePage from '../../features/movie_info/MoviePage';
import {movieOptions} from '../../hooks/dataOptions';
import {MovieId} from '../../types/APIDataSchema';

type Props = {
  movieId: MovieId;
  year: number;
};

export default function IndividualMoviePage({
  movieId,
  year,
}: Props): React.ReactElement {
  const [moviesQ] = useSuspenseQueries({
    queries: [movieOptions(year)],
  });
  const movies = moviesQ.data;
  const movie = movies.find(m => m.id === movieId);
  if (!movie) {
    return <AppErrorScreen isFullScreen />;
  }
  return (
    <ErrorBoundary fallback={<AppErrorScreen isFullScreen={false} />}>
      <Suspense fallback={<LoadScreen />}>
        <DefaultTabContainer>
          <MoviePage movie={movie} />
        </DefaultTabContainer>
      </Suspense>
    </ErrorBoundary>
  );
}
