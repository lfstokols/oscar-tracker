export interface LProfile {
  username: string;
  fullName: string;
  avatar: string;
}

export default async function SearchProfileDatabase(
  snippet: string,
): Promise<LProfile[]> {
  // const base_url = 'https://letterboxd.com/s/search/members/';
  const base_url = '/oscars/api/letterboxd/search';
  const url = `${base_url}?searchTerm=${snippet}`;
  const response = await fetch(url);
  const html = await response.text();

  // Create a DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find all li elements
  const liElements = doc.querySelectorAll('li');

  // Map each li element to an LProfile object
  const profiles: LProfile[] = Array.from(liElements).map(li => {
    const avatar = li.querySelector('img')?.getAttribute('src') || '';
    const username = li.querySelector('.metadata')?.textContent?.trim() || '';
    const fullName = li.querySelector('.name')?.textContent?.trim() || '';

    return {
      username,
      fullName,
      avatar,
    };
  });

  return profiles;
}
