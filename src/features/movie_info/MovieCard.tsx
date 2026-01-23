// A card that displays information about a movie for mobile view
// Poster on left, title/metadata on right, footer with watchlist controls
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  Paper,
  Skeleton,
  Stack,
  SxProps,
  Typography,
} from '@mui/material';
import {useSuspenseQueries} from '@tanstack/react-query';
import {Suspense} from 'react';
import {
  BEST_PICTURE_COLOR,
  HIGHLIGHT_ANIMATED_COLOR,
} from '../../config/StyleChoices';
import {categoryOptions, nomOptions} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import {CategoryIdSchema, Movie} from '../../types/APIDataSchema';
import QuickNominations from './QuickNominations';
import PosterImage from './common/PosterImage';
import RuntimeChip, { formatRuntime } from './common/RuntimeChip';
import WatchlistFooter from './common/WatchlistFooter';

type Props = {
  movie: Movie;
};

type GenericMovieCardProps = {
  image: React.ReactElement;
  title: string;
  subtitle?: string;
  details: React.ReactElement | React.ReactElement[];
  metadata?: React.ReactElement[];
  footer?: React.ReactElement;
  onClick?: () => void;
  borderSx?: SxProps;
};

export function GenericMovieCard({
  image,
  title,
  subtitle,
  details,
  metadata,
  footer,
  onClick,
  borderSx = {},
}: GenericMovieCardProps): React.ReactElement {
  return (
    <Card
      raised={true}
      onClick={onClick}
      sx={{
        ...borderSx,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick
          ? {
              boxShadow: 6,
              transform: 'translateY(-2px)',
              transition: 'all 0.2s ease-in-out',
            }
          : {},
      }}>
      <CardContent sx={{p: 1.5, '&:last-child': {pb: 1.5}}}>
        <Stack direction="row" gap={1.5}>
          {image}
          <Stack direction="column" gap={1} width="100%">
            <InfoBlock
              extras={metadata}
              mainData={details}
              subtitle={subtitle}
              title={title}
              />
            <Stack
              direction="row"
              alignItems="end"
              justifyContent="space-between"
              onClick={e => {
                // Prevent card click when clicking on footer actions
                e.stopPropagation();
              }}>
              <Suspense fallback={<Skeleton height={32} width={120} />}>
                {footer}
              </Suspense>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
      {/* <CardActions
        onClick={e => {
          // Prevent card click when clicking on footer actions
          e.stopPropagation();
        }}
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
          mt: 'auto',
        }}>
        <Suspense fallback={<Skeleton height={32} width={120} />}>
          {footer}
        </Suspense>
      </CardActions> */}
    </Card>
  );
}

type ImportantCategories = {
  isBestPic: boolean;
  isBestAnimated: boolean;
};

function useGetImportantCategories(movie: Movie): ImportantCategories {
  const {year} = useOscarAppContext();
  const [nominationsQ] = useSuspenseQueries({
    queries: [nomOptions(year), categoryOptions()],
  });
  const nominations = nominationsQ.data;
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

  return {
    isBestAnimated: isBestAnimatedNominee,
    isBestPic: isBestPicNominee,
  };
}

export default function MovieCard({
  movie,
  onClick,
}: Props & {onClick?: () => void}): React.ReactElement {
  const {preferences} = useOscarAppContext();
  const importantCategories = useGetImportantCategories(movie);
  const borderSx =
    preferences.highlightAnimated && importantCategories.isBestAnimated
      ? {
          borderColor: HIGHLIGHT_ANIMATED_COLOR,
          borderWidth: '0px 0px 0px 2px',
          borderStyle: 'solid',
        }
      : importantCategories.isBestPic
        ? {
            borderColor: BEST_PICTURE_COLOR,
            borderWidth: '0px 0px 0px 2px',
            borderStyle: 'solid',
          }
        : undefined;

  const runtimeText = getRuntimeText(movie);

  const metadata = (
    <Typography variant="caption">
      {getNomCountText(movie)}
      {runtimeText != null ? ` • ${runtimeText}` : ''}
    </Typography>
  );

  return (
    <GenericMovieCard
      borderSx={borderSx}
      details={<QuickNominations movie={movie} />}
      footer={<WatchlistFooter movieId={movie.id} />}
      image={<MoviePoster movie={movie} />}
      metadata={[metadata]}
      onClick={onClick}
      subtitle={movie.subtitle}
      title={movie.mainTitle}
    />
  );
}

function MoviePoster({movie}: {movie: Movie}): React.ReactElement {
  return (
    <Box sx={{flexShrink: 0}}>
      <PosterImage height={120} movie={movie} showLoading width={80} />
    </Box>
  );
}

function InfoBlock({
  title,
  subtitle,
  mainData,
  extras,
}: {
  title: string;
  subtitle?: string;
  mainData: React.ReactElement | React.ReactElement[];
  extras?: React.ReactElement | React.ReactElement[];
}): React.ReactElement {
  // const mainDataElements = Array.isArray(mainData)
  //   ? mainData.map((el, i) =>
  //       isValidElement(el) && el.key == null
  //         ? cloneElement(el, {key: `main-data-${i}`})
  //         : el,
  //     )
  //   : [
  //       isValidElement(mainData) && mainData.key == null
  //         ? cloneElement(mainData, {key: 'main-data-0'})
  //         : mainData,
  //     ];
  return (
    <Box sx={{flex: 1, minWidth: 0}}>
      <Typography sx={{fontWeight: 'bold', lineHeight: 1.2}} variant="body1">
        {title}
      </Typography>
      {!!subtitle && (
        <Typography color="text.secondary" noWrap variant="body2">
          <i>{subtitle}</i>
        </Typography>
      )}
      <Stack
        direction="column"
        flexWrap="wrap"
        gap={0.5}
        useFlexGap>
        <Stack>{extras}</Stack>
        <Paper elevation={3}>{mainData}</Paper>
      </Stack>
    </Box>
  );
}

function getNomCountText(movie: Movie): string {
  return `${movie.numNoms} nom${movie.numNoms > 1 ? 's' : ''}`;
}

function getRuntimeText(movie: Movie): string | null {
  return formatRuntime(movie.runtime_hours, movie.runtime_minutes);
}
