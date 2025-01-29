import RuntimeCell from './RuntimeCell';

type Props = {
  filteredMovies: Movie[];
  isRuntimeFormatted: boolean;
};

export default function MultiMovieRuntimeCell({
  filteredMovies,
  isRuntimeFormatted,
}: Props): React.ReactElement {
  const totalRuntimeMinutes = filteredMovies.every(
    movie => movie['runtime_minutes'] !== null,
  )
    ? filteredMovies.reduce(
        (acc, movie) => acc + (movie['runtime_minutes'] ?? 0),
        0,
      )
    : null;

  const totalRuntimeHours = totalRuntimeMinutes
    ? Math.floor(totalRuntimeMinutes / 60).toString() +
      ':' +
      (totalRuntimeMinutes % 60).toString().padStart(2, '0')
    : null;

  return (
    <RuntimeCell
      runtimeMinutes={totalRuntimeMinutes}
      runtimeHours={totalRuntimeHours}
      isRuntimeFormatted={isRuntimeFormatted}
    />
  );
}
