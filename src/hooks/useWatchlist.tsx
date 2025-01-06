import {useQuery} from '@tanstack/react-query';
import {useContext} from 'react';
import {OscarAppContext} from '../contexts/AppContext';

export default function useWatchlist(): ReturnType<typeof useQuery> {
  const {year} = useContext(OscarAppContext);
  const results = useQuery({
    queryKey: ['watchlistData'],
    queryFn: async (): Promise<WatchNotice[]> => {
      const params = new URLSearchParams({
        justMe: 'false',
        year: year.toString(),
      });
      const response = await fetch(`api/watchlist?${params}`, {
        method: 'GET',
      });
      const data = await response.json();
      if (response.ok) {
        checkWatchlistData(data); // This will throw an error if the data is not in the correct format, but it silently approves undefined
      }
      return data;
    },
  });
  return results;
}

// Type guard that ensures data is WatchNotice[]
// Returns false if data is completelymissing (undefined, still a Promise)
// Throws an error if the data is present but of the wrong type
function checkWatchlistData(data: unknown): data is WatchNotice[] {
  if (data instanceof Promise) {
    console.log(
      'Hey Logan, the data is a Promise, this is being run too soon.',
    );
    return false;
  }
  if (data === undefined) return false;
  if (!Array.isArray(data)) throw new Error('Watchlist Data is not an array');

  if (
    !data.every(
      (item): item is WatchNotice =>
        typeof item === 'object' &&
        item !== null &&
        'movieId' in item &&
        'userId' in item &&
        'status' in item,
    )
  ) {
    throw new Error('Watchlist Data is not an array of WatchNotice');
  }
  return true;
}
