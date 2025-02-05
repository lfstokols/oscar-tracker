import {TableCell, Typography} from '@mui/material';
import * as React from 'react';
import {forwardRef, useEffect, useRef, useState} from 'react';
import countries from '../../../assets/countries.json';
import musicVideos from '../../../assets/musicVideos.json';
import {ClickableTooltip} from '../../../components/ClickableTooltip';
import {useIsMobile} from '../../../hooks/useIsMobile';
import {CategoryList, MovieId, NomList} from '../../../types/APIDataSchema';
import {Grouping} from '../../../types/Enums';

import 'flag-icons/css/flag-icons.min.css';

const countryCodes: {name: string; flag: string; code: string}[] = countries;
const songUrls: {title: string; url: string}[] = musicVideos;
const maxNomsToShow = 4;

export default function NominationsCell({
  movieId,
  nominations,
  categories,
  tableCellProps,
}: {
  movieId: MovieId;
  nominations: NomList;
  categories: CategoryList;
  tableCellProps?: Record<string, unknown>;
}) {
  const [isTruncated, setIsTruncated] = useState(false);

  const myNoms = nominations.filter(nom => nom.movieId === movieId);

  const entries = myNoms.map(nom => (
    <Entry
      key={[nom.categoryId, nom.note].join('|')}
      categories={categories}
      nom={nom}
    />
  ));

  const tooBig = entries.length > maxNomsToShow;
  const remainingEntries = tooBig ? entries.splice(maxNomsToShow - 1) : [];
  const content = (
    <>
      <LineClampText setIsTruncated={setIsTruncated}>{entries}</LineClampText>
      {!!tooBig && (
        <Typography variant="caption">
          <i>{remainingEntries.length} more</i>
        </Typography>
      )}
    </>
  );
  const popupContent = (
    <Typography variant="body2">
      {entries}
      {remainingEntries}
    </Typography>
  );

  return (
    <TableCell
      sx={{
        className: 'nominations-column',
      }}
      {...tableCellProps}>
      {tooBig || isTruncated ? (
        <ClickableTooltip isOpaque popup={popupContent}>
          {content}
        </ClickableTooltip>
      ) : (
        content
      )}
    </TableCell>
  );
}

function getFlag(country: string): React.ReactNode {
  //* Convert country names to 2-letter ISO country codes
  const data = countryCodes.find(c => c.name === country);
  if (!data) return '';
  return <span className={`fi fi-${data.code.toLowerCase()}`} />;
}

function getSong(song: string): React.ReactNode {
  const url = songUrls.find(s => s.title === song)?.url;
  if (!url) return song;
  return (
    <a
      href={url}
      style={{
        marginLeft: '4px',
        textDecoration: 'none',
        color: 'inherit',
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '4px',
      }}>
      <svg
        height="1.25em"
        style={{fill: '#FF0000', position: 'relative', top: '4px'}}
        viewBox="0 0 24 24">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
      </svg>
      {song}
    </a>
  );
}

function getGroupingMarker(grouping: Grouping) {
  switch (grouping) {
    case Grouping.big_three:
      return '⭐';
    case Grouping.acting:
      return '🎭';
    case Grouping.art:
      return '🎨';
    case Grouping.audio:
      return '🎧';
    case Grouping.filmkraft:
      return '🎞️';
    case Grouping.best_in_class:
      return '🥇';
    case Grouping.short:
      return '↔️';
    default:
      return '';
  }
}

function Entry({
  nom,
  categories,
}: {
  nom: Nom;
  categories: CategoryList;
}): React.ReactElement {
  const isMobile = useIsMobile();

  const category = categories.find(cat => cat.id === nom.categoryId);
  if (!category) {
    return <Text>???</Text>;
  }
  const formattedNote =
    category.id === 'cat_frgn' ? (
      <em>
        {getFlag(nom.note ?? '')} {nom.note ?? ''}
      </em>
    ) : category.id === 'cat_song' ? (
      <>{getSong(nom.note ?? '')}</>
    ) : (
      <i>{nom.note}</i>
    );

  return (
    <>
      {getGroupingMarker(Grouping[category.grouping])}
      {category.shortName + (!isMobile && category.hasNote ? ': ' : '')}
      {!isMobile ? formattedNote : ''}
      <br />
    </>
  );
}

function LineClampText({
  children,
  setIsTruncated,
}: {
  children: React.ReactNode;
  setIsTruncated: (value: boolean) => void;
}): React.ReactElement {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsTruncated(
        (ref.current?.scrollHeight ?? 0) > (ref.current?.offsetHeight ?? 0),
      );
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsTruncated]);

  return (
    <Text
      ref={ref}
      display="-webkit-box"
      overflow="hidden"
      paddingRight="2px"
      sx={{
        WebkitLineClamp: '3',
        WebkitBoxOrient: 'vertical',
      }}
      textOverflow="ellipsis"
      // Prevent strange bug where text is sometimes clipped by a few pixels
      width="fit-content">
      {children}
    </Text>
  );
}

const Text = forwardRef(function Text(
  {
    children,
    ...props
  }: {children: React.ReactNode} & React.ComponentProps<typeof Typography>,
  ref: React.ForwardedRef<HTMLElement>,
): React.ReactElement {
  return (
    <Typography ref={ref} variant="body2" {...props}>
      {children}
    </Typography>
  );
});
