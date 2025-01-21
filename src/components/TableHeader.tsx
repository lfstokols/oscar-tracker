import {TableCell, Typography} from '@mui/material';

export function ColumnLabel({text}: {text: string}): React.ReactElement {
  return (
    <TableCell
      sx={{
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        textJustify: 'centered',
      }}>
      <Typography variant="h5">{text}</Typography>
    </TableCell>
  );
}
