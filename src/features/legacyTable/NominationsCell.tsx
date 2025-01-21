import React, {useState} from 'react';
import {TableCell, Tooltip, ClickAwayListener, Box, Stack} from '@mui/material';
import {getNominationCategoriesForMovie} from '../../utils/dataSelectors';
import {
  NomList,
  CategoryList,
  MovieId,
  CategoryId,
} from '../../types/APIDataSchema';
import countries from '../../assets/countries.json';
import musicVideos from '../../assets/musicVideos.json';
import 'flag-icons/css/flag-icons.min.css';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
type NoteProps = {
  catName: string;
  text: string;
  catId: CategoryId;
};

const countryCodes: {name: string; flag: string; code: string}[] = countries;
const songUrls: {title: string; url: string}[] = musicVideos;
const numNomsToShow = 4;

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
  const MyNoms = nominations.filter(nom => nom.movieId === movieId);
  const catList = getNominationCategoriesForMovie(
    movieId,
    nominations,
    categories,
  );

  const entries = MyNoms.map(nom => makeEntry(nom, categories));

  const tooBig = entries.length > numNomsToShow;
  const remainingEntries = tooBig ? entries.splice(numNomsToShow - 1) : [];
  const content = arrayToDisplay([
    ...entries,
    ...(tooBig ? [<>{remainingEntries.length} more...</>] : []),
  ]);
  const popupContent = arrayToDisplay([...entries, ...remainingEntries]);

  return (
    <TableCell
      sx={{
        whiteSpace: 'pre-wrap',
        className: 'nominations-column',
      }}
      {...tableCellProps}>
      {makeCellContent(content, popupContent)}
    </TableCell>
  );
}

function makeCellContent(
  // movieId: MovieId,
  content: React.ReactNode,
  popupContent: React.ReactNode,
  // needsTooltip: boolean,
) {
  const [open, setOpen] = useState(false);
  // if (needsTooltip) {
  const handleTooltipOpen = () => {
    setOpen(true);
  };
  const handleTooltipClose = () => {
    setOpen(false);
  };
  return (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <Tooltip
        open={open}
        onClose={handleTooltipClose}
        onOpen={handleTooltipOpen}
        disableFocusListener
        slotProps={{
          popper: {
            disablePortal: true,
          },
        }}
        title={popupContent}>
        <span>
          <Box onClick={handleTooltipOpen}>{content}</Box>
        </span>
      </Tooltip>
    </ClickAwayListener>
  );
}

function getNote(nom: Nom, categories: CategoryList) {
  const cat = categories.find(cat => cat.id === nom.categoryId);
  if (!cat) return '???';
  return `${cat.shortName}: ${nom.note}`;
}

function getEmoji(country: string): React.ReactNode {
  //* Convert country names to 2-letter ISO country codes
  const data = countryCodes.find(c => c.name === country);
  if (!data) return '';
  return <span className={`fi fi-${data.code.toLowerCase()}`}></span>;
}

function getSong(song: string): React.ReactNode {
  const url = songUrls.find(s => s.title === song)?.url;
  if (!url) return <>{song}</>;
  return <a href={url}>{song}</a>;
}

function makeEntry(nom: Nom, categories: CategoryList) {
  const cat = categories.find(cat => cat.id === nom.categoryId);
  if (!cat) return <>???</>;
  const formattedText =
    cat.id === 'cat_frgn' ? (
      <em>
        {getEmoji(nom.note ?? '')} {nom.note ?? ''}
      </em>
    ) : cat.id === 'cat_song' ? (
      <>{getSong(nom.note ?? '')}</>
    ) : (
      <i>{nom.note}</i>
    );
  return (
    <Box key={cat.id + nom.note} sx={{overflow: 'visible'}}>
      <b>{cat.shortName + (cat.hasNote ? ':' : '')}</b>
      {formattedText}
    </Box>
  );
}

function arrayToDisplay(arr: React.ReactNode[]) {
  return (
    <Stack direction="column" padding={1}>
      {...arr}
    </Stack>
  );
}
