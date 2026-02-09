import {Paper, Stack} from '@mui/material';
import * as React from 'react';
import {FilterState} from '../../../hooks/useFilterState';
import {useIsMobile} from '../../../hooks/useIsMobile';
import FilterRowsWidget from './FilterRows';
import RefreshWidget from './RefreshButton';
import SearchMoviesWidget from './SearchMovies';

export default function TableControls({
  filterState,
  setFilterState,
  type,
}: {
  filterState: FilterState;
  setFilterState: (filterState: FilterState) => void;
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
        {/* {type === 'table' && <HideColumnsWidget isMobile={isMobile} />} */}
        <SearchMoviesWidget
          filterState={filterState}
          isMobile={isMobile}
          setFilterState={setFilterState}
        />
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
