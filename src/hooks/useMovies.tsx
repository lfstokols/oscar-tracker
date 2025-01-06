import {useQuery} from '@tanstack/react-query';
import {useContext} from 'react';
import {OscarAppContext} from '../contexts/AppContext';

export default function useMovies(): ReturnType<typeof useQuery> {
  const {year} = useContext(OscarAppContext);
  const results = useQuery({
    queryKey: ['movieData'],
    queryFn: async (): Promise<Movie[]> => {
      const params = new URLSearchParams({year: year.toString()});
      const response = await fetch(`api/movies?${params.toString()}`, {
        method: 'GET',
      });
      const data = await response.json();
      if (response.ok) {
        checkMovieData(data);
      }
      return data;
    },
  });
  return results;
}

// Type guard that ensures data is Movie[]
// Returns false if data is missing (undefined, still a Promise)
// Throws an error if the data is present but of the wrong type
function checkMovieData(data: unknown): data is Movie[] {
  if (data instanceof Promise) {
    console.log('Data is a Promise, this is being run too soon.');
    return false;
  }
  if (data === undefined) return false;
  if (!Array.isArray(data)) throw new Error('Movie Data is not an array');

  if (
    !data.every(
      (item): item is Movie =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'title' in item,
    )
  ) {
    throw new Error('Movie Data is not an array of Movie');
  }
  return true;
}
