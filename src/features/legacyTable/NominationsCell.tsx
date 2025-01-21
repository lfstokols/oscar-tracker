import React, {useState} from 'react';
import {TableCell, Tooltip, ClickAwayListener, Box} from '@mui/material';
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
  const notedCats = catList.filter(cat => cat.hasNote);
  const needsTooltip = notedCats.length > 0;
  const notedNoms = MyNoms.filter(
    nom => notedCats.find(cat => cat.id === nom.categoryId) != null,
  );

  const content = catList.map(cat => cat.shortName).join(', ');

  const popupContent = notedNoms.map(nom => {
    const cat = categories.find(c => c.id === nom.categoryId);
    return {
      catName: cat?.shortName ?? '???',
      text: nom.note ?? '???',
      catId: nom.categoryId,
    };
  });

  return (
    <TableCell
      sx={{
        whiteSpace: 'pre-wrap',
        className: 'nominations-column',
      }}
      {...tableCellProps}>
      {makeCellContent(movieId, content, popupContent, needsTooltip)}
    </TableCell>
  );
}

function makeCellContent(
  movieId: MovieId,
  content: string,
  popupContent: NoteProps[],
  needsTooltip: boolean,
) {
  const [open, setOpen] = useState(false);
  if (needsTooltip) {
    const handleTooltipOpen = () => {
      setOpen(true);
    };
    const handleTooltipClose = () => {
      setOpen(false);
    };
    return (
      <ClickAwayListener onClickAway={handleTooltipClose}>
        <Tooltip
          key={movieId}
          open={open}
          onClose={handleTooltipClose}
          onOpen={handleTooltipOpen}
          disableFocusListener
          slotProps={{
            popper: {
              disablePortal: true,
            },
          }}
          title={
            <React.Fragment>
              {popupContent.map(props => {
                const formattedText =
                  props.catId === 'cat_frgn' ? (
                    <em>
                      {getEmoji(props.text)} {props.text}
                    </em>
                  ) : props.catId === 'cat_song' ? (
                    <>{getSong(props.text)}</>
                  ) : (
                    <i>{props.text}</i>
                  );
                return (
                  <React.Fragment key={props.catId + props.text}>
                    <b>{props.catName}:</b>
                    {formattedText}
                    <br />
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          }>
          <span>
            <Box onClick={handleTooltipOpen}>{content}</Box>
            <InfoOutlinedIcon
              sx={{
                fontSize: '0.8rem',
                marginLeft: '4px',
                // verticalAlign: 'super',
                opacity: 0.7,
              }}
            />
          </span>
        </Tooltip>
      </ClickAwayListener>
    );
  }
  return content;
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
