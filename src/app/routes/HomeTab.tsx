import DefaultCatcher from '../../components/LoadScreen';
import LegacyTable from '../../features/legacy_table/LegacyTable';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TableControls from '../../features/legacy_table/table_controls/TableControls';
import {useEffect, useState} from 'react';
import {useOscarAppContext} from '../../providers/AppContext';

export default function HomeTab(): React.ReactElement {
  const [filterState, setFilterState] = useState({
    watchstatus: [] as WatchStatus[],
    categories: [] as CategoryId[],
  });

  const {activeUserId} = useOscarAppContext();

  // Reset filterState when activeUserId changes
  useEffect(() => {
    setFilterState({
      watchstatus: [],
      categories: [],
    });
  }, [activeUserId]);

  return (
    <DefaultCatcher>
      <Box sx={{width: '100%', height: 'calc(100vh - 64px)'}}>
        <Stack
          direction="column"
          spacing={2}
          alignItems="center"
          // position="sticky"
          // top="-40px"
          // overflow="scroll"
        >
          <TableControls
            filterState={filterState}
            setFilterState={setFilterState}
          />
          <Paper
            sx={{
              width: '100%',
              flexGrow: 1,
              flexShrink: 1,
              height: 'calc(100vh - 64px)',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'sticky',
              top: 0,
            }}>
            <LegacyTable filterState={filterState} />
          </Paper>
        </Stack>
      </Box>
    </DefaultCatcher>
  );
}
