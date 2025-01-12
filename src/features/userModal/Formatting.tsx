import Typography from '@mui/material/Typography';
import MuiDivider from '@mui/material/Divider';

export default function TitleLine({title}: {title: string}) {
  return (
    <Typography
      component="h1"
      variant="h4"
      sx={{width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)'}}
      color="primary"
      fontWeight="bold"
      textAlign="center">
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

export const Divider = () => {
  return (
    <MuiDivider />
  )
}
