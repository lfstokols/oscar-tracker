import {TableCell, Typography} from '@mui/material';
import * as React from 'react';
import {forwardRef, useEffect, useRef, useState} from 'react';
import {ClickableTooltip} from '../../../components/ClickableTooltip';
import Entry from '../../../components/SingleNomEntry';
import {CategoryList, MovieId, NomList} from '../../../types/APIDataSchema';

import 'flag-icons/css/flag-icons.min.css';

const maxNomsToShow = 4;

export default function NominationsCell({
  movieId,
  nominations,
  categories,
  tableCellProps,
  putInCell = true,
  compact = false,
}: {
  movieId: MovieId;
  nominations: NomList;
  categories: CategoryList;
  putInCell?: boolean;
  tableCellProps?: Record<string, unknown>;
  compact?: boolean;
}) {
  const [isTruncated, setIsTruncated] = useState(false);

  const myNoms = nominations.filter(nom => nom.movieId === movieId);

  const entries = putInCell
    ? decoratedNomEntries({nominations: myNoms, categories, compact})
    : numberedNomEntries({nominations: myNoms, categories, compact});

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

  const fullContent =
    tooBig || isTruncated ? (
      <ClickableTooltip isOpaque popup={popupContent}>
        {content}
      </ClickableTooltip>
    ) : (
      content
    );

  if (putInCell) {
    return (
      <TableCell
        sx={{
          className: 'nominations-column',
        }}
        {...tableCellProps}>
        {fullContent}
      </TableCell>
    );
  } else {
    return fullContent;
  }
}

function decoratedNomEntries({
  nominations,
  categories,
  compact = false,
}: {
  nominations: NomList;
  categories: CategoryList;
  includeNote?: boolean;
  compact?: boolean;
}): React.ReactElement[] {
  return nominations.map(nom => (
    <Entry
      key={[nom.categoryId, nom.note].join('|')}
      categories={categories}
      compact={compact}
      nom={nom}
    />
  ));
}

function numberedNomEntries({
  nominations,
  categories,
  compact = false,
}: {
  nominations: NomList;
  categories: CategoryList;
  compact?: boolean;
}): React.ReactElement[] {
  type CountedNom = Nom & {repeated: number};
  const countedNominations: CountedNom[] = nominations.reduce((acc, nom) => {
    if (acc.find(c => c.categoryId === nom.categoryId)) {
      acc.find(c => c.categoryId === nom.categoryId)!.repeated++;
    } else {
      acc.push({...nom, repeated: 1});
    }
    return acc;
  }, [] as CountedNom[]);
  return countedNominations.map(nom => (
    <Entry
      key={nom.categoryId}
      categories={categories}
      compact={compact}
      includeNote={false}
      nom={nom}
      repeated={nom.repeated}
    />
  ));
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
