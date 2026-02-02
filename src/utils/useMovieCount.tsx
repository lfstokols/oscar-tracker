import {NUM_SHORT_FILMS_PER_CATEGORY} from '../config/GlobalConstants';
import {useOscarAppContext} from '../providers/AppContext';

export default function useMovieCount(): (movies: Movie[]) => number {
  const {
    preferences: {shortsAreOneFilm},
  } = useOscarAppContext();

  return (movies: Movie[]) => {
    if (!shortsAreOneFilm) {
      return movies.length;
    }

    const features = movies.filter(movie => !movie.isShort);
    const shorts = movies.filter(movie => movie.isShort);

    return features.length + shorts.length / NUM_SHORT_FILMS_PER_CATEGORY;
  };
}
