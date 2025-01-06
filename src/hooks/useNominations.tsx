import {useQuery} from '@tanstack/react-query';
import {useContext} from 'react';
import {OscarAppContext} from '../contexts/AppContext';

export default function useNominations() {
  const {year} = useContext(OscarAppContext);
  const results = useQuery({
    queryKey: ['nominationData'],
    queryFn: async (): Promise<Nom[]> => {
      const params = new URLSearchParams({year: year.toString()});
      const response = await fetch(`api/nominations?${params.toString()}`, {
        method: 'GET',
      });
      const data = await response.json();
      if (response.ok) {
        checkNominationData(data);
      }
      return data;
    },
  });
  return results;
}

// Type guard that ensures data is Nom[]
// Returns false if data is missing (undefined, still a Promise)
// Throws an error if the data is present but of the wrong type
function checkNominationData(data: unknown): data is Nom[] {
  if (data instanceof Promise) {
    console.log('Data is a Promise, this is being run too soon.');
    return false;
  }
  if (data === undefined) return false;
  if (!Array.isArray(data)) throw new Error('Nomination Data is not an array');

  if (
    !data.every(
      (item): item is Nom =>
        typeof item === 'object' &&
        item !== null &&
        'movieId' in item &&
        'catId' in item &&
        'note' in item,
    )
  ) {
    throw new Error('Nomination Data is not an array of Nom');
  }
  return true;
}
