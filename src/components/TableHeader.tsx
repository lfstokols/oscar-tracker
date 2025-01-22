import {TableCell, Typography} from '@mui/material';
import {TABLE_HEADER_COLOR} from '../config/StyleChoices';

export function ColumnLabel({
  text,
  sx,
}: // ...props
{text: string} & React.ComponentProps<typeof TableCell>): React.ReactElement {
  return (
    <TableCell
      align="center"
      // color={TABLE_HEADER_COLOR}
      sx={{
        ...sx,
        backgroundColor: TABLE_HEADER_COLOR,
        // justifyContent: 'center',
      }}
      // {...props}
    >
      <Typography variant="h5">{text}</Typography>
    </TableCell>
  );
}
