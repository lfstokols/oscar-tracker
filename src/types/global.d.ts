// src/types/global.d.ts

declare global {
	//type User = {
	//	username: string,
	//	watchedMovies: string[],
	//}
	
	type DataFlavor = 'movies' | 'users' | 'nominations' | 'categoriess' | 'watchlist';

	type MovieId = string;
	type UserId = string;
	type CategoryId = string;

	type User = {
		id: UserId,
		username: string,
		//[other: string]: any,
	}
	
	type Movie = {
		id: MovieId,
		title: string,
		//[other: string]: any,
	}
	
	type Nom = {
		movieId: MovieId,
		catId: CategoryId,
		note: string,
	}
	
	type Category = {
		id: CategoryId,
		shortName:string, 
		fullName: string, 
		hasNote: boolean, 
		isShort: boolean, 
		grouping: string, 
		maxNoms: number,
	}
	
	type WatchNotice = {
		userId: UserId,
		movieId: MovieId,
		status: WatchStatus,
	}
	
	//type watchStatus = 'seen' | 'todo' | '';

	type Preferences = {
		shortsAreOneFilm: boolean,
		highlightAnimated: boolean,
	}
	
	//type Movie = {
	//	title: string,
	//	nominations: string[],
	//}
	
	
	
	type RawMap = {
		movies: Movie,
		users: User,
		noms: Noms,
		cats: Category,
		watchlist: WatchNotice,
	}
	
	type RawTypes = [Movie, User, Noms, Category, WatchNotice];
	
	type RawFromFlavor<T extends keyof RawMap> = RawMap[T];
	
	//type Data = {
	//	users: User[],
	//	movies: Movie[],
	//}

	//interface ApiResponse<T> {
	//  data: T;
	//  error?: string;
	//}
  }
  
  export {}; // Ensures this file is treated as a module
