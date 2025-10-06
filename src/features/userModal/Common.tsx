import MuiDivider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

export default function TitleLine({title}: {title: string}) {
  return (
    <Typography
      color="primary"
      component="h1"
      fontWeight="bold"
      sx={{fontSize: 'clamp(2rem, 10vw, 2.15rem)'}}
      textAlign="center"
      variant="h4">
      {title}
    </Typography>
  );
}

const boxStyleCommon = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

export const boxStyle = {
  ...boxStyleCommon,
  maxWidth: '500px',
};

export const boxStyleMobile = {
  ...boxStyleCommon,
  width: '95vw',
};

export function Divider(): React.ReactElement {
  return <MuiDivider />;
}
