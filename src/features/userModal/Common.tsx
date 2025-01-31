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

export const boxStyle = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  gap: 2,
};

export function Divider(): React.ReactElement {
  return <MuiDivider />;
}
