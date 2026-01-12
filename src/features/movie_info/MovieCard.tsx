// A card that displays information about a movie for mobile view
// Poster on left, title/metadata on right, footer with watchlist controls
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import {useSuspenseQueries} from '@tanstack/react-query';
import {Suspense, isValidElement} from 'react';
import {categoryOptions, nomOptions} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import {Movie} from '../../types/APIDataSchema';
import NominationsCell from '../legacy_table/cells/NominationsCell';
import PosterImage from './common/PosterImage';
import RuntimeChip from './common/RuntimeChip';
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
};

export function GenericMovieCard({
  image,
  title,
  subtitle,
  details,
  metadata,
  footer,
  onClick,
}: GenericMovieCardProps): React.ReactElement {
  return (
    <Card
      onClick={onClick}
      sx={{
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
      <CardContent sx={{display: 'flex', flexDirection: 'row', gap: 1}}>
        {image}
        <InfoBlock
          extras={metadata}
          mainData={details}
          subtitle={subtitle}
          title={title}
        />
      </CardContent>
      <CardActions
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
      </CardActions>
    </Card>
  );
}

export default function MovieCard({
  movie,
  onClick,
}: Props & {onClick?: () => void}): React.ReactElement {
  return (
    <GenericMovieCard
      details={<NominationsBlock movie={movie} />}
      footer={<WatchlistFooter movieId={movie.id} />}
      image={<MoviePoster movie={movie} />}
      metadata={[<RuntimeChip key="runtime" movie={movie} />]}
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
  const mainDataElements = Array.isArray(mainData) ? mainData : [mainData];
  return (
    <CardContent sx={{p: 0, flex: 1, minWidth: 0}}>
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
        sx={{mt: 1}}
        useFlexGap>
        {mainDataElements.map((element, index) => {
          // Use element's key if available, otherwise use index as fallback
          const elementKey =
            isValidElement(element) && element.key != null
              ? element.key
              : `main-data-${index}`;
          return (
            <Paper key={elementKey} elevation={3}>
              {element}
            </Paper>
          );
        })}
        {extras}
      </Stack>
    </CardContent>
  );
}

// function MovieInfo({movie}: {movie: Movie}): React.ReactElement {
//   return (
//     <InfoBlock
//       extras={<RuntimeChip movie={movie} />}
//       mainData={<NominationsBlock movie={movie} />}
//       subtitle={movie.subtitle}
//       title={movie.mainTitle}
//     />
//   );
// }
//   return (
//     <CardContent sx={{p: 0, flex: 1, minWidth: 0}}>
//       <Typography sx={{fontWeight: 'bold', lineHeight: 1.2}} variant="body1">
//         {movie.mainTitle}
//       </Typography>
//       {!!movie.subtitle && (
//         <Typography color="text.secondary" noWrap variant="body2">
//           <i>{movie.subtitle}</i>
//         </Typography>
//       )}
//       <Stack
//         direction="column"
//         flexWrap="wrap"
//         gap={0.5}
//         sx={{mt: 1}}
//         useFlexGap>
//         <NominationsBlock movie={movie} />
//         <RuntimeChip movie={movie} />
//       </Stack>
//     </CardContent>
//   );
// }

function NominationsBlock({movie}: {movie: Movie}): React.ReactElement {
  const {year} = useOscarAppContext();
  const [nominationsQ, categoriesQ] = useSuspenseQueries({
    queries: [nomOptions(year), categoryOptions()],
  });
  const categories = categoriesQ.data;
  const nominations = nominationsQ.data;
  return (
    <NominationsCell
      categories={categories}
      movieId={movie.id}
      nominations={nominations}
      putInCell={false}
    />
  );
}
