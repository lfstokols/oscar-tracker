import React from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {watchlistOptions} from '../../../hooks/dataOptions';
import {Paper, Stack} from '@mui/material';
import {Sync as RefreshIcon} from '@mui/icons-material';
import {useOscarAppContext} from '../../../providers/AppContext';
import {useIsMobile} from '../../../hooks/useIsMobile';
import HideColumnsWidget from './HideColumns';
import FilterRowsWidget from './FilterRows';
import {NoAccountBlocker} from '../../../components/NoAccountBlocker';
import {DisplayedSettingsButton} from '../../legacy_table/table_controls/Common';
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
  const handleRefresh = async () => {
    await fetch(`/api/force-refresh`);
    queryClient.invalidateQueries({
      queryKey: watchlistOptions(year).queryKey,
    });
  };
  const canRefresh = useOscarAppContext().activeUserId !== null;

  return (
    <Paper
      sx={{
        width: '50vw',
        // position: 'sticky',
        // top: '-40px',
      }}>
      <Stack direction="row" width="100%" justifyContent="space-between">
        <NoAccountBlocker hasAccess={canRefresh}>
          <RefreshWidget handleRefresh={handleRefresh} isMobile={isMobile} />
        </NoAccountBlocker>
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

function RefreshWidget({
  handleRefresh,
  isMobile,
}: {
  handleRefresh: () => void;
  isMobile: boolean;
}): React.ReactElement {
  return (
    <DisplayedSettingsButton
      onClick={handleRefresh}
      isMobile={isMobile}
      icon={<RefreshIcon />}
      text="Fetch Updates"
    />
  );
}
