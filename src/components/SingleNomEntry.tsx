import {Typography} from '@mui/material';
import {CategoryList, Nom} from '../types/APIDataSchema';
import {Grouping} from '../types/Enums';
import {getFlag, getSong} from '../utils/CategoryMetadata';

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
  longName = false,
}: {
  nom: Nom;
  categories: CategoryList;
  includeNote?: boolean;
  repeated?: number;
  longName?: boolean;
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
  const name = longName ? category.fullName : category.shortName;
  return (
    <>
      {getGroupingMarker(Grouping[category.grouping])}
      {name + (hasNote ? ': ' : '')}
      {formattedNote}
      <br />
    </>
  );
}
