// Types for TMDB API responses
// We only define the fields we actually use

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBCredits {
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string | null;
  tagline: string | null;
  genres: TMDBGenre[];
  release_date: string;
  credits?: TMDBCredits;
}
