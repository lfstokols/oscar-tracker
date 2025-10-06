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
