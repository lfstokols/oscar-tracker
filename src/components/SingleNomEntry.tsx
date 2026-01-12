import {Typography} from '@mui/material';
import countries from '../assets/countries.json';
import musicVideos from '../assets/musicVideos.json';
import {CategoryList, Nom} from '../types/APIDataSchema';
import {Grouping} from '../types/Enums';

const countryCodes: {name: string; flag: string; code: string}[] = countries;
const songUrls: {title: string; url: string}[] = musicVideos;
import 'flag-icons/css/flag-icons.min.css';

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

export default function Entry({
  nom,
  categories,
  includeNote = true,
  repeated = 1,
}: {
  nom: Nom;
  categories: CategoryList;
  includeNote?: boolean;
  repeated?: number;
}): React.ReactElement | null {
  if (repeated < 1) {
    return null;
  }
  const category = categories.find(cat => cat.id === nom.categoryId);
  if (!category) {
    return <Typography variant="body2">???</Typography>;
  }
  const formattedNote = includeNote ? (
    category.id === 'cat_frgn' ? (
      <em>
        {getFlag(nom.note ?? '')} {nom.note ?? ''}
      </em>
    ) : category.id === 'cat_song' ? (
      <>{getSong(nom.note ?? '')}</>
    ) : (
      <i>{nom.note}</i>
    )
  ) : repeated > 1 ? (
    <>{repeated}x</>
  ) : null;
  const hasNote = formattedNote !== null;
  return (
    <>
      {getGroupingMarker(Grouping[category.grouping])}
      {category.shortName + (hasNote ? ': ' : '')}
      {formattedNote}
      <br />
    </>
  );
}
