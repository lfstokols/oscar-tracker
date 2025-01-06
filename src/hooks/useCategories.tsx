import {useQuery} from '@tanstack/react-query';

export default function useCategories() {
  const results = useQuery({
    queryKey: ['categoryData'],
    queryFn: async (): Promise<Category[]> => {
      const response = await fetch('api/categories', {method: 'GET'});
      const data = await response.json();
      if (response.ok) {
        checkCategoryData(data);
      }
      return data;
    },
  });
  return results;
}

// Type guard that ensures data is Category[]
// Returns false if data is missing (undefined, still a Promise)
// Throws an error if the data is present but of the wrong type
function checkCategoryData(data: unknown): data is Category[] {
  if (data instanceof Promise) {
    console.log('Data is a Promise, this is being run too soon.');
    return false;
  }
  if (data === undefined) return false;
  if (!Array.isArray(data)) throw new Error('Category Data is not an array');

  if (
    !data.every(
      (item): item is Category =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'shortName' in item &&
        'fullName' in item &&
        'hasNote' in item &&
        'isShort' in item &&
        'grouping' in item &&
        'maxNoms' in item,
    )
  ) {
    throw new Error('Category Data is not an array of Category');
  }
  return true;
}
