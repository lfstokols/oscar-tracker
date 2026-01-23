import LaunchIcon from '@mui/icons-material/Launch';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Entry from '../../../components/SingleNomEntry';
import {useNavigateToFilterState} from '../../../hooks/useFilterState';
import {CategoryList, NomList} from '../../../types/APIDataSchema';
import {CategoryType, Grouping, grouping_display_names} from '../../../types/Enums';
import {getFlag, getSong} from '../../../utils/CategoryMetadata';

type NominationWithCategory = {
  nom: NomList[0];
  category: CategoryList[0];
};

function groupNominationsByGrouping(
  nominations: NomList,
  categories: CategoryList,
): Record<Grouping, NominationWithCategory[]> {
  const result: Record<Grouping, NominationWithCategory[]> = {} as Record<
    Grouping,
    NominationWithCategory[]
  >;
  for (const grouping of Object.values(Grouping)) {
    result[grouping] = nominations
      .map(nom => {
        const category = categories.find(cat => cat.id === nom.categoryId);
        if (!category) return null;
        if (category.grouping === grouping) {
          return {nom, category};
        }
        return null;
      })
      .filter((item): item is NominationWithCategory => item !== null);
  }
  return result;
}

export default function NominationsCard({
  categories,
  movieNominations,
}: {
  categories: CategoryList;
  movieNominations: NomList;
}): React.ReactElement {
  const groupingList = Object.values(Grouping);
  // Group nominations by category grouping
  const nominationsByGrouping = groupNominationsByGrouping(
    movieNominations,
    categories,
  );

  return (
    <Card sx={{width: '100%'}}>
      <CardContent sx={{width: '100%'}}>
        <Typography sx={{fontWeight: 'bold', mb: 2}} variant="h6">
          Nominations
        </Typography>
        <Stack spacing={3}>
          {groupingList.map(grouping => {
            const noms = nominationsByGrouping[grouping];
            if (noms.length === 0) {
              return null;
            }
            return (
              <NominationsGroup
                key={grouping}
                categories={categories}
                grouping={grouping}
                nominations={noms}
              />
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

function NominationsGroup({
  categories,
  grouping,
  nominations,
}: {
  categories: CategoryList;
  grouping: Grouping;
  nominations: NominationWithCategory[];
}): React.ReactElement {
  const displayName = grouping_display_names[grouping] || grouping;

  return (
    <Box>
      <Typography sx={{fontWeight: 'bold', mb: 1.5}} variant="subtitle1">
        {displayName}
      </Typography>
      <Divider sx={{mb: 1.5}} />
      <Stack spacing={1.5}>
        {nominations.map(({category, nom}) => (
          <NominationEntry
            key={`${nom.categoryId}-${nom.note}`}
            categories={categories}
            category={category}
            nom={nom}
          />
        ))}
      </Stack>
    </Box>
  );
}

function NominationNote({
  nom,
  category,
}: {
  nom: NomList[0];
  category: CategoryList[0];
}): React.ReactNode {
  if (!nom.note) {
    return null;
  }
  if (category.id === CategoryType.foreign_film) {
    return (
      <Typography variant="body2">
        {getFlag(nom.note)} {nom.note}
      </Typography>
    );
  } else if (category.id === CategoryType.original_song) {
    return <Typography variant="body2">{getSong(nom.note)}</Typography>;
  } else {
    return (
      <Typography variant="body2">
        <i>{nom.note}</i>
      </Typography>
    );
  }
}

function NominationEntry({
  categories,
  category,
  nom,
}: {
  categories: CategoryList;
  category: CategoryList[0];
  nom: NomList[0];
}): React.ReactElement {
  const navigateToFilterState = useNavigateToFilterState();
  return (
    <Paper elevation={1} sx={{p: 1.5}}>
      <Stack alignItems="flex-start" direction="row" spacing={1}>
        <Typography sx={{flex: 1}} variant="body1">
          <Entry categories={categories} includeNote={false} nom={nom} />
        </Typography>
        <NominationNote category={category} nom={nom} />
        <Link
          href="#"
          onClick={e => {
            e.preventDefault();
            navigateToFilterState({
              categories: [category.id],
              watchstatus: [],
            });
          }}
          sx={{alignItems: 'center', display: 'flex'}}>
          <LaunchIcon fontSize="small" />
        </Link>
      </Stack>
    </Paper>
  );
}
