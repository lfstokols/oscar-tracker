import {Paper, Stack} from '@mui/material';
import * as React from 'react';
import {useIsMobile} from '../../../hooks/useIsMobile';
import FilterRowsWidget from './FilterRows';
import HideColumnsWidget from './HideColumns';
import RefreshWidget from './RefreshButton';
export default function TableControls({
  filterState,
  setFilterState,
}: {
  filterState: {watchstatus: WatchStatus[]; categories: CategoryId[]};
  setFilterState: (filterState: {
    watchstatus: WatchStatus[];
    categories: CategoryId[];
  }) => void;
}): React.ReactElement {
  const isMobile = useIsMobile();


  return (
    <Paper
      sx={{
        width: '50vw',
        // position: 'sticky',
        // top: '-40px',
      }}>
      <Stack direction="row" justifyContent="space-between" width="100%">
          <RefreshWidget
            isMobile={isMobile}
          />
        <HideColumnsWidget isMobile={isMobile} />
        <FilterRowsWidget
          filterState={filterState}
          isMobile={isMobile}
          setFilterState={setFilterState}
        />
      </Stack>
    </Paper>
  );
}


