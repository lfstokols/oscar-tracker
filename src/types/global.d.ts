// src/types/global.d.ts

declare global {
	//type User = {
	//	username: string,
	//	watchedMovies: string[],
	//}
	
	type DataFlavor = 'movies' | 'users' | 'nominations' | 'categoriess' | 'watchlist';

	type RawUser = {
		userId: string,
		username: string,
		//[other: string]: any,
	}
	
	type RawMovie = {
		movieId: string,
		title: string,
		//[other: string]: any,
	}
	
	type Nom = {
		movieId: string,
		catId: string,
		note: string,
	}
	
	type Category = {
		catId: string,
		shortName:string, 
		fullName: string, 
		hasNote: boolean, 
		isShort: boolean, 
		grouping: string, 
		maxNoms: number,
	}
	
	type WatchNotice = {
		userId: string,
		movieId: string,
		status: watchStatus,
	}
	
	type watchStatus = 'seen' | 'todo' | '';
	
	type Movie = {
		title: string,
		nominations: string[],
	}
	
	
	
	type RawMap = {
		movies: RawMovie,
		users: RawUser,
		noms: Noms,
		cats: Category,
		watchlist: WatchNotice,
	}
	
	type RawTypes = [RawMovie, RawUser, Noms, Category, WatchNotice];
	
	type RawFromFlavor<T extends keyof RawMap> = RawMap[T];
	
	type Data = {
		users: User[],
		movies: Movie[],
	}

	//interface ApiResponse<T> {
	//  data: T;
	//  error?: string;
	//}
  }
  
  export {}; // Ensures this file is treated as a module
  