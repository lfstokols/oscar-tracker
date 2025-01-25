import {TableCell} from '@mui/material';
import {SxProps, Theme} from '@mui/material';
import {
  HIGHLIGHT_ANIMATED_COLOR,
  BEST_PICTURE_COLOR,
} from '../../config/StyleChoices';
import {MovieDb_POSTER_URL} from '../../config/GlobalConstants';
import {CategoryIdSchema} from '../../types/APIDataSchema';

export default function TitleCell({
  movie,
  bestPicNominees,
  nominations = [],
  preferences,
  sx: sxProps,
  ...props
}: {
  movie: Movie;
  bestPicNominees?: string[];
  preferences?: Preferences;
  sx?: SxProps<Theme>;
  nominations?: Nom[];
  props?: Record<string, unknown>;
}): React.ReactElement {
  const bestAnimatedCategoryId = CategoryIdSchema.parse('cat_anim');
  const isBestAnimatedNominee = nominations
    .filter(nom => nom.categoryId === bestAnimatedCategoryId)
    .map(nom => nom.movieId)
    .includes(movie.id);

  const bestPicCategoryId = CategoryIdSchema.parse('cat_pict');
  const isBestPicNominee = nominations
    .filter(nom => nom.categoryId === bestPicCategoryId)
    .map(nom => nom.movieId)
    .includes(movie.id);

  return (
    <>
      <TableCell>
        <img
          src={MovieDb_POSTER_URL + movie.posterPath}
          alt={movie.mainTitle}
          style={{maxHeight: '100px'}}
        />
      </TableCell>
      <TableCell
        title={movie.id}
        sx={{
          textAlign: 'center',
          className: 'title-column',
          maxWidth: '30ch',
          overflow: 'visible',
          scrollbarWidth: 'none',
          position: 'relative',
          ...sxProps,
        }}
        {...props}>
        {bestPicNominees?.includes(movie.id) && makeBestPicHighlight(movie)}
        <div
          style={
            preferences?.highlightAnimated && isBestAnimatedNominee
              ? {
                  border: `1px dashed ${HIGHLIGHT_ANIMATED_COLOR}`,
                  padding: '8px',
                  borderRadius: '30px',
                }
              : {}
          }>
          <b
            style={{
              fontSize: '1.2em',
              whiteSpace: 'nowrap',
              position: 'relative',
              zIndex: 1,
              color: isBestPicNominee
                ? BEST_PICTURE_COLOR
                : preferences?.highlightAnimated && isBestAnimatedNominee
                  ? HIGHLIGHT_ANIMATED_COLOR
                  : 'inherit',
            }}>
            {movie.mainTitle}
          </b>
          <br />
          {movie.subtitle ? (
            <i
              style={{
                fontSize: '0.8em',
                whiteSpace: 'nowrap',
                overflow: 'auto',
                position: 'relative',
                zIndex: 1,
              }}>
              {movie.subtitle}
            </i>
          ) : null}
        </div>
      </TableCell>
    </>
  );
}

function getTextWidth(text: string) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return 0;
  }
  context.font = 'Roboto, sans-serif';
  return context.measureText(text).width;
}

function makeBestPicHighlight(movie: Movie): React.ReactElement {
  const textWidth = getTextWidth(movie.mainTitle);
  const y_radius = 15;
  const x_radius = textWidth * 0.7;
  const diff = 10;
  const num_rays = Math.floor(textWidth / 7);
  const upper_angles = Array(num_rays)
    .fill(0)
    .map((_, i) => (5 * Math.PI) / 4 + (i / (num_rays - 1)) * (Math.PI / 2));
  const angles = [
    ...Array(num_rays)
      .fill(0)
      .map((_, i) => Math.PI / 4 + (i / (num_rays - 1)) * (Math.PI / 2)),
    ...upper_angles,
  ];
  const center = [75, 50];
  const radius = [x_radius, y_radius];
  const cis = (angle: number) => [Math.cos(angle), Math.sin(angle)];
  return (
    <svg
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: '0%',
        left: '0%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      viewBox="0 0 150 100">
      {angles.map((angle, i) => {
        const inner = [0, 1].map(i => center[i] + radius[i] * cis(angle)[i]);
        const outer = [0, 1].map(
          i => center[i] + (radius[i] + diff) * cis(angle)[i],
        );
        return (
          <line
            key={i}
            x1={inner[0]}
            y1={inner[1]}
            x2={outer[0]}
            y2={outer[1]}
            stroke="rgba(255,215,0,0.6)"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}
