import {Stack} from '@mui/material';
import HypotheticalityToggleGroup from '../../components/HypotheticalityToggleGroup';
import {useIsMobile} from '../../hooks/useIsMobile';
import {Grouping} from '../../types/Enums';
import {Hypotheticality} from '../userStatsTable/Enums';
import ExpandAllButton from './ExpandAllButton';

export default function TableControls({
  value,
  setter,
  openGroups,
  setOpenGroups,
}: {
  openGroups: Record<Grouping, boolean>;
  setOpenGroups: (openGroups: Record<Grouping, boolean>) => void;
  value: Hypotheticality;
  setter: (value: Hypotheticality) => void;
}) {
  const isMobile = useIsMobile();

  return (
    <Stack
      boxShadow="border-box"
      direction="row"
      flexWrap="wrap"
      gap={isMobile ? 1 : 8}
      justifyContent="center"
      width="100%">
      <HypotheticalityToggleGroup setter={setter} value={value} />
      <ExpandAllButton openGroups={openGroups} setOpenGroups={setOpenGroups} />
    </Stack>
  );
}
