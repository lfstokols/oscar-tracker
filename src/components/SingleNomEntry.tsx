import {Stack, Typography} from '@mui/material';
import {CategoryList, Nom} from '../types/APIDataSchema';
import {CategoryType} from '../types/Enums';
import {getCategoryIcon, getFlag, getSong} from '../utils/CategoryMetadata';

export default function Entry({
  nom,
  categories,
  includeNote = true,
  repeated = 1,
  longName = false,
  compact = false,
}: {
  nom: Nom;
  categories: CategoryList;
  includeNote?: boolean;
  repeated?: number;
  longName?: boolean;
  compact?: boolean;
}): React.ReactElement | null {
  if (repeated < 1) {
    return null;
  }
  const category = categories.find(cat => cat.id === nom.categoryId);
  if (!category) {
    return <Typography variant="body2">???</Typography>;
  }
  const formattedNote = includeNote ? (
    category.id === CategoryType.foreign_film ? (
      <em>
        {getFlag(nom.note ?? '')} {nom.note ?? ''}
      </em>
    ) : category.id === CategoryType.original_song ? (
      <>{getSong(nom.note ?? '')}</>
    ) : (
      <i>{nom.note}</i>
    )
  ) : repeated > 1 ? (
    <>{repeated}x</>
  ) : null;
  const hasNote = formattedNote !== null;
  const name = longName ? category.fullName : category.shortName;
  if (compact) {
    return (
      <>
        {getCategoryIcon(category)}
        {name + (hasNote ? ': ' : '')}
        {formattedNote}
        <br />
      </>
    );
  }
  return (
    <Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.5}>
      {getCategoryIcon(category)}
      {name + (hasNote ? ': ' : '')}
      {formattedNote}
      <br />
    </Stack>
  );
}
