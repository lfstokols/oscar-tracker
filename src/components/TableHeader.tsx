import {TableCell, Typography} from '@mui/material';
import {TABLE_HEADER_COLOR} from '../config/StyleChoices';

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
      color={TABLE_HEADER_COLOR}
      sx={{
        // color: 'primary',
        // justifyContent: 'center',
        ...props.sx,
      }}>
      <Typography variant="h5">{text}</Typography>
    </TableCell>
  );
}
