import {Typography} from '@mui/material';
// @ts-ignore next-line
import oscarIcon from '/src/assets/Trophy_Icon_Outlined_512.png';

export default function OurWordmark() {
  const title = 'Oscar Tracker: Track the Oscars!';
  return (
    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
      <img
        src={oscarIcon}
        alt={'Oscar Icon, from https://www.flaticon.com/free-icons/oscar'}
        style={{width: '32px', height: '32px', marginRight: '8px'}}
      />
      <Typography variant="h6" style={{flexGrow: 1, marginRight: '8px'}}>
        {title}
      </Typography>
    </div>
  );
}
