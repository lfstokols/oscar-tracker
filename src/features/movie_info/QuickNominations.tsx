import { Stack, Typography } from "@mui/material";
import { useSuspenseQueries } from "@tanstack/react-query";
import { ClickableTooltip } from "../../components/ClickableTooltip";
import { categoryOptions, nomOptions } from "../../hooks/dataOptions";
import { useOscarAppContext } from "../../providers/AppContext";
import { Movie } from "../../types/APIDataSchema";
import { getGroupingMarker } from "../../utils/CategoryMetadata";
import { getCategoryFromID } from "../../utils/dataSelectors";

type CategoryWithNote = Category & {
    note: string | null;
};

export default function QuickNominations({movie}: {movie: Movie}): React.ReactElement {
  const {year} = useOscarAppContext();
  const [nominationsQ, categoriesQ] = useSuspenseQueries({
    queries: [nomOptions(year), categoryOptions()],
  });
  const categories = categoriesQ.data;
  const nominations = nominationsQ.data;
  const myNominations = nominations.filter(nom => nom.movieId === movie.id);
  const myNomCategories = myNominations.
    map(nom => {
        const cat = getCategoryFromID(nom.categoryId, categories);
        if (cat === undefined) return undefined;
        return {...cat, note: nom.note};
    }).
    filter((cat): cat is CategoryWithNote => cat !== undefined);
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.5}>
        {myNomCategories.map(cat => (
            <NominationToken key={cat.id + (cat.note ?? '')} category={cat} />
        ))}
    </Stack>
  );
}

function NominationToken({category}: {category: Category}): React.ReactElement {
    const popupContent = (
        <Typography variant="body2">
            {category.shortName}
        </Typography>
    );
    return (
        <ClickableTooltip
            popup={popupContent}
        >
            {getGroupingMarker(category.grouping)}
        </ClickableTooltip>
    );
}
