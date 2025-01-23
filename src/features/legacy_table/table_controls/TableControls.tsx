import React, {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {watchlistOptions} from '../../../hooks/dataOptions';
import {Button, Paper, Stack, IconButton} from '@mui/material';
import {Refresh as RefreshIcon} from '@mui/icons-material';
import {useOscarAppContext} from '../../../providers/AppContext';
import {useIsMobile} from '../../../hooks/useIsMobile';
import HideColumnsWidget from './HideColumns';
import FilterRowsWidget from './FilterRows';

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
  const queryClient = useQueryClient();
  const {year} = useOscarAppContext();
  const isMobile = useIsMobile();
  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: watchlistOptions(year).queryKey,
    });
  };

  return (
    <Paper sx={{width: '50vw', position: 'sticky', top: '-40px'}}>
      <Stack direction="row" width="100%" justifyContent="space-between">
        <IconButton onClick={handleRefresh}>
          <RefreshIcon />
        </IconButton>
        <HideColumnsWidget isMobile={isMobile} />
        <FilterRowsWidget
          isMobile={isMobile}
          filterState={filterState}
          setFilterState={setFilterState}
        />
      </Stack>
    </Paper>
  );
}
