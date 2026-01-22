import {Paper, Stack} from '@mui/material';
import * as React from 'react';
import {useIsMobile} from '../../../hooks/useIsMobile';
import FilterRowsWidget from './FilterRows';
import HideColumnsWidget from './HideColumns';
import RefreshWidget from './RefreshButton';

export default function TableControls({
  filterState,
  setFilterState,
  type,
}: {
  filterState: {watchstatus: WatchStatus[]; categories: CategoryId[]};
  setFilterState: (filterState: {
    watchstatus: WatchStatus[];
    categories: CategoryId[];
  }) => void;
  type: 'table' | 'cards';
}): React.ReactElement {
  const isMobile = useIsMobile();

  return (
    <Paper
      sx={{
        width: '50vw',
        // position: 'sticky',
        // top: '-40px',
      }}>
      <Stack direction="row" justifyContent="space-around" width="100%">
        <RefreshWidget isMobile={isMobile} />
        {type === 'table' && <HideColumnsWidget isMobile={isMobile} />}
        <FilterRowsWidget
          filterState={filterState}
          isMobile={isMobile}
          noun={type === 'table' ? 'rows' : 'cards'}
          setFilterState={setFilterState}
        />
      </Stack>
    </Paper>
  );
}
