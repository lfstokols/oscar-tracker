import {Stack, Typography} from '@mui/material';
import {useSuspenseQueries} from '@tanstack/react-query';
import {ClickableTooltip} from '../../components/ClickableTooltip';
import {categoryOptions, nomOptions} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import {Movie} from '../../types/APIDataSchema';
import {CategoryType} from '../../types/Enums';
import {getCategoryIcon} from '../../utils/CategoryMetadata';
import {getCategoryFromID} from '../../utils/dataSelectors';

type CategoryWithNote = Category & {
  note: string | null;
};

export default function QuickNominations({
  movie,
}: {
  movie: Movie;
}): React.ReactElement {
  const {year} = useOscarAppContext();
  const [nominationsQ, categoriesQ] = useSuspenseQueries({
    queries: [nomOptions(year), categoryOptions(year)],
  });
  const categories = categoriesQ.data;
  const nominations = nominationsQ.data;
  const myNominations = nominations.filter(nom => nom.movieId === movie.id);
  const myNomCategories = myNominations
    .map(nom => {
      const cat = getCategoryFromID(nom.categoryId, categories);
      if (cat === undefined) return undefined;
      return {...cat, note: nom.note};
    })
    .filter((cat): cat is CategoryWithNote => cat !== undefined)
    .sort(
      (a, b) =>
        Object.values(CategoryType).indexOf(a.id as CategoryType) -
        Object.values(CategoryType).indexOf(b.id as CategoryType),
    );

  return (
    <Typography variant="subtitle2">
      <Stack
        direction="row"
        flexWrap="wrap"
        gap={0.5}
        marginLeft={0.5}
        marginTop={0.5}>
        {myNomCategories.map(cat => (
          <NominationToken key={cat.id + (cat.note ?? '')} category={cat} />
        ))}
      </Stack>
    </Typography>
  );
}

function NominationToken({category}: {category: Category}): React.ReactElement {
  const popupContent = (
    <Typography variant="body2">{category.shortName}</Typography>
  );
  return (
    <ClickableTooltip popup={popupContent}>
      {getCategoryIcon(category)}
    </ClickableTooltip>
  );
}
