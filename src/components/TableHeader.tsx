import {TableCell, Typography} from '@mui/material';

export function ColumnLabel({
  text,
  ...props
}: {text: string} & React.ComponentProps<
  typeof TableCell
>): React.ReactElement {
  return (
    <TableCell
      {...props}
      align="center"
      sx={{
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        // justifyContent: 'center',
        ...props.sx,
      }}>
      <Typography variant="h5">{text}</Typography>
    </TableCell>
  );
}
