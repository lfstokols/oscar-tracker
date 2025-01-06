import {useQuery} from '@tanstack/react-query';

export default function useUsers() {
  const results = useQuery({
    queryKey: ['userData'],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch('api/users', {method: 'GET'});
      const data = await response.json();
      if (response.ok) {
        checkUserData(data);
      }
      return data;
    },
  });
  return results;
}

// Type guard that ensures data is User[]
// Returns false if data is missing (undefined, still a Promise)
// Throws an error if the data is present but of the wrong type
function checkUserData(data: unknown): data is User[] {
  if (data instanceof Promise) {
    console.log('Data is a Promise, this is being run too soon.');
    return false;
  }
  if (data === undefined) return false;
  if (!Array.isArray(data)) throw new Error('User Data is not an array');

  if (
    !data.every(
      (item): item is User =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'username' in item,
    )
  ) {
    throw new Error('User Data is not an array of User');
  }
  return true;
}

//function mapUser(data: unknown | undefined): RawUser[] | undefined {
//	if (data === undefined) return undefined;
//	if (!Array.isArray(data)) throw new Error("User Data is not an array");
//	if (!data.every((item) => item.hasOwnProperty("id")))
//		throw new Error("User Data does not have an id property");
//	if (!data.every((item) => item.hasOwnProperty("username")))
//		throw new Error("User Data does not have a username property");
//	return data.map(
//		(item): RawUser => ({
//			userId: item.id,
//			username: item.username,
//		})
//	);
//}
