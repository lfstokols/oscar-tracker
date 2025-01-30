import {Box, Typography, Stack} from '@mui/material';
import oscarIcon from '/src/assets/Trophy_Icon_Outlined_512.png';

export default function OurWordmark({
  mini,
  folded,
}: {
  mini?: boolean;
  folded?: boolean;
}) {
  return (
    <Box alignItems="center" display="flex" flexDirection="row">
      <img
        alt="Oscar Icon, from https://www.flaticon.com/free-icons/oscar"
        src={oscarIcon}
        style={{width: '32px', height: '32px', marginRight: '8px'}}
      />
      <Text folded={folded} mini={mini} />
    </Box>
  );
}

function Text({mini, folded}: {mini?: boolean; folded?: boolean}) {
  if (folded) {
    return (
      <Stack direction="column">
        <Typography variant="h6">Oscar Tracker:</Typography>
        <Typography variant="subtitle1">Track the Oscars!</Typography>
      </Stack>
    );
  }
  if (mini) {
    return <Typography variant="h6">OSCAR TRACKER</Typography>;
  }
  return <Typography variant="h6">Oscar Tracker: Track the Oscars!</Typography>;
}
