import Button from '@mui/material/Button';
import {Grouping} from '../../types/Enums';
import {objectFromEntries, objectValues} from '../../utils/objectUtils';

export default function ExpandAllButton({
  openGroups,
  setOpenGroups,
}: {
  openGroups: Record<Grouping, boolean>;
  setOpenGroups: (openGroups: Record<Grouping, boolean>) => void;
}): React.ReactElement {
  const shouldExpand = objectValues(openGroups).some(x => !x);

  return (
    <Button
      onClick={() => {
        setOpenGroups(
          objectFromEntries(
            objectValues(Grouping).map(grouping => [grouping, shouldExpand]),
          ),
        );
      }}
      size="small"
      variant="outlined">
      {shouldExpand ? 'Expand All' : 'Collapse All'}
    </Button>
  );
}
