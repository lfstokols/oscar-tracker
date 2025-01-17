import {WatchStatus} from '../types/Enums';
import {LogToConsole} from './Logger';

export function getMovieWatchStatusForUser(
  userId: UserId,
  movieId: MovieId,
  watchlist: WatchNotice[],
): WatchStatus {
  const watchNotice = watchlist
    .slice()
    .reverse()
    .find(
      watchNotice =>
        watchNotice.movieId === movieId && watchNotice.userId === userId,
    );

  return watchNotice?.status ?? WatchStatus.blank;
}

export function getNominationCategoriesForMovie(
  movieId: String,
  nominations: Nom[],
  categories: Category[],
): Category[] {
  return nominations
    .filter(nom => nom.movieId === movieId)
    .map(nom => getCategoryFromID(nom.categoryId, categories))
    .filter(cat => cat != null);
}

export function getCategoryFromID(
  categoryID: CategoryId,
  categories: Category[],
): Category | undefined {
  // TODO: Maybe we should throw error here instead
  const theCat = categories.find(cat => cat.id === categoryID);
  if (theCat == null) {
    LogToConsole(`Unknown category id: ${categoryID}`);
  }
  return theCat;
}

export function getUsernameFromId(
  userId: string,
  users: User[],
): string | null {
  return users.find(user => user.id === userId)?.username ?? null;
}
