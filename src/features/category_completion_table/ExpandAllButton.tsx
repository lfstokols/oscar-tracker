import Button from '@mui/material/Button';
import {Dispatch, SetStateAction} from 'react';
import {Grouping} from '../../types/Enums';
import {objectFromEntries, objectValues} from '../../utils/objectUtils';

export default function ExpandAllButton({
  openGroups,
  setOpenGroups,
}: {
  openGroups: Record<Grouping, boolean>;
  setOpenGroups: Dispatch<SetStateAction<Record<Grouping, boolean>>>;
}): React.ReactElement {
  const shouldExpand = objectValues(openGroups).some(x => !x);

  return (
    <Button
      onClick={() => {
        setOpenGroups(() =>
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
