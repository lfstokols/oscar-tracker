import {useOscarAppContext} from '../providers/AppContext';
import {CategoryIdSchema} from '../types/APIDataSchema';
import {Grouping, WatchStatus} from '../types/Enums';
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

function getByCategory(
  movies: Movie[],
  nominations: Nom[],
  category: CategoryId,
): Movie[] {
  return movies.filter(movie =>
    nominations.find(
      nom => nom.movieId == movie.id && nom.categoryId == category,
    ),
  );
}

export function groupByShort(movies: Movie[], nominations: Nom[]) {
  const shorts = movies.filter(movie => movie.isShort);
  const features = movies.filter(movie => !movie.isShort);
  const anim = getByCategory(
    shorts,
    nominations,
    CategoryIdSchema.parse('cat_sanm'),
  );
  const live = getByCategory(
    shorts,
    nominations,
    CategoryIdSchema.parse('cat_shla'),
  );
  const doc = getByCategory(
    shorts,
    nominations,
    CategoryIdSchema.parse('cat_sdoc'),
  );
  return {
    shortsAnimated: anim,
    shortsLive: live,
    shortsDoc: doc,
    features: features,
  };
}

export function sortUsers(users: User[]): User[] {
  const {activeUserId} = useOscarAppContext();
  if (activeUserId == null) {
    return users;
  }
  const activeUser = users.find(user => user.id === activeUserId);
  if (activeUser == null) {
    LogToConsole(`Unknown active user id: ${activeUserId}`);
    return users;
  }
  return [activeUser, ...users.filter(user => user.id !== activeUserId)];
}

export function getNominees(catId: CategoryId, nominations: Nom[]): MovieId[] {
  return nominations
    ?.filter(nom => nom.categoryId === catId)
    .map(nom => nom.movieId);
}

export function catssByGrouping(
  categories: Category[],
  // grouping?: Grouping,
): Record<Grouping, Category[]> {
  const result: Record<Grouping, Category[]> = {} as Record<
    Grouping,
    Category[]
  >;
  for (const grouping of Object.values(Grouping)) {
    result[grouping] = categories.filter(cat => cat.grouping === grouping);
  }
  return result;
}
