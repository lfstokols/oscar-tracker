import {Stack, TableCell, Typography} from '@mui/material';
import {SxProps, Theme} from '@mui/material';
import {
  HIGHLIGHT_ANIMATED_COLOR,
  BEST_PICTURE_COLOR,
} from '../../../config/StyleChoices';
import {CategoryIdSchema} from '../../../types/APIDataSchema';
import {forwardRef, useEffect, useRef, useState} from 'react';

export default function TitleCell({
  movie,
  nominations = [],
  preferences,
  sx: sxProps,
  ...props
}: {
  movie: Movie;
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
    <TableCell
      title={movie.id}
      sx={{
        className: 'title-column',
        ...sxProps,
      }}
      {...props}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '230px',
        }}>
        <FancyMovieTitle
          movie={movie}
          highlightAnimated={preferences?.highlightAnimated}
          isBestPicNominee={isBestPicNominee}
          isBestAnimatedNominee={isBestAnimatedNominee}
        />
      </div>
    </TableCell>
  );
}

function FancyMovieTitle({
  movie,
  highlightAnimated,
  isBestPicNominee,
  isBestAnimatedNominee,
}: {
  movie: Movie;
  highlightAnimated: boolean | undefined;
  isBestPicNominee: boolean;
  isBestAnimatedNominee: boolean;
}): React.ReactElement {
  const [ref, textWidth, textHeight] = useDimensions();

  return (
    <div
      style={{
        position: 'relative',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {isBestPicNominee && (
        <GoldSparkle textWidth={textWidth} textHeight={textHeight} />
      )}
      <MovieTitle
        ref={ref}
        movie={movie}
        highlightAnimated={highlightAnimated}
        isBestPicNominee={isBestPicNominee}
        isBestAnimatedNominee={isBestAnimatedNominee}
      />
    </div>
  );
}

function GoldSparkle({
  textWidth,
  textHeight,
}: {
  textWidth: number;
  textHeight: number;
}): React.ReactElement {
  // I think these two numbers can be anything
  const boxWidth = 150;
  const boxHeight = 100;
  const center = [boxWidth / 2, boxHeight / 2];

  const diff = 15;

  // Map [50,150] to [40,75]
  const xRadius = 40 + (35 / 100) * Math.max(0, textWidth - 50);
  const yRadius = textHeight;
  const radius = [xRadius, yRadius];

  // Map [50,150] to [3,8]
  const numRays = Math.floor(5 + (3 / 100) * Math.max(0, textWidth - 50)); //Math.floor(textWidth / 10);

  const upperAngles = range(numRays).map(
    i => (5 * Math.PI) / 4 + (i / (numRays - 1)) * (Math.PI / 2),
  );
  const angles = [
    ...range(numRays).map(
      i => Math.PI / 4 + (i / (numRays - 1)) * (Math.PI / 2),
    ),
    ...upperAngles,
  ];

  const cis = (angle: number) => [Math.cos(angle), Math.sin(angle)];

  return (
    <svg
      style={{
        position: 'absolute',
        width: textWidth + 24 + 'px',
        height: '100%',
        top: '0%',
        left: '-12px',
        zIndex: 0,
        pointerEvents: 'none',
        boxSizing: 'border-box',
      }}
      viewBox={`0 0 ${boxWidth} ${boxHeight}`}>
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
            stroke={BEST_PICTURE_COLOR}
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}

const MovieTitle = forwardRef(function MovieTitle(
  {
    highlightAnimated,
    isBestPicNominee,
    isBestAnimatedNominee,
    movie,
  }: {
    highlightAnimated: boolean | undefined;
    isBestPicNominee: boolean;
    isBestAnimatedNominee: boolean;
    movie: Movie;
  },
  ref: React.ForwardedRef<HTMLElement>,
): React.ReactElement {
  const textColor = isBestPicNominee
    ? BEST_PICTURE_COLOR
    : highlightAnimated && isBestAnimatedNominee
    ? HIGHLIGHT_ANIMATED_COLOR
    : 'inherit';

  return (
    <Stack
      direction="column"
      alignItems="center"
      style={
        highlightAnimated && isBestAnimatedNominee
          ? {
              border: `1px dashed ${HIGHLIGHT_ANIMATED_COLOR}`,
              padding: '8px 12px',
              borderRadius: '30px',
            }
          : {}
      }>
      <Typography
        ref={ref}
        variant="body1"
        textAlign="center"
        style={{
          fontSize: '1.3em',
          zIndex: 1,
          color: textColor,
        }}>
        <b>{movie.mainTitle}</b>
      </Typography>
      {movie.subtitle && (
        <Typography
          variant="subtitle2"
          textAlign="center"
          style={{
            zIndex: 1,
            color: textColor,
          }}>
          <i>{movie.subtitle}</i>
        </Typography>
      )}
    </Stack>
  );
});

function range(count: number): Array<number> {
  return [...Array(count).keys()];
}

function useDimensions(): [
  React.RefObject<HTMLElement | null>,
  number,
  number,
] {
  const ref = useRef<HTMLElement | null>(null);
  const [textWidth, setTextWidth] = useState(100);
  const [textHeight, setTextHeight] = useState(100);

  useEffect(() => {
    const handleResize = () => {
      setTextWidth(ref.current?.offsetWidth ?? 0);
      setTextHeight(ref.current?.offsetHeight ?? 0);
    };
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  return [ref, textWidth, textHeight];
}
