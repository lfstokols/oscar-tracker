import {FilterState} from '../../hooks/useFilterState';
import {WatchStatus} from '../../types/Enums';

export default function filterMovies(
  movies: Movie[],
  nominations: Nom[],
  myWatchlist: WatchNotice[],
  filterState: FilterState,
): Movie[] {
  const filterByWatchstatus = (movie: Movie): boolean => {
    const status =
      myWatchlist.find(watch => watch.movieId === movie.id)?.status ??
      WatchStatus.blank;
    return filterState.watchstatus.includes(status);
  };
  const filterByCategories = (movie: Movie): boolean => {
    const myNoms = nominations.filter(nom => nom.movieId === movie.id);
    return myNoms.some(nom => filterState.categories.includes(nom.categoryId));
  };
  const filterBySubstring = (movie: Movie): boolean => {
    return movie.title
      .toLowerCase()
      .includes(filterState.subString?.toLowerCase() ?? '');
  };
  let currentMovies = movies;
  if (filterState.watchstatus.length !== 0) {
    currentMovies = movies.filter(filterByWatchstatus);
  }
  if (filterState.categories.length !== 0) {
    currentMovies = currentMovies.filter(filterByCategories);
  }
  if (filterState.subString) {
    currentMovies = currentMovies.filter(filterBySubstring);
  }

  return currentMovies;
}
