import {Stack, TableCell, Typography} from '@mui/material';
import {TABLE_HEADER_COLOR} from '../config/StyleChoices';

export function ColumnLabel({
  text,
  sx,
  icon,
  ...props
}: // ...props
{text: string; icon?: React.ReactNode} & React.ComponentProps<
  typeof TableCell
>): React.ReactElement {
  return (
    <TableCell
      {...props}
      align="center"
      // color={TABLE_HEADER_COLOR}
      sx={{
        ...sx,
        backgroundColor: TABLE_HEADER_COLOR,
        alignItems: 'center',
        gap: 1,
        padding: 1,
      }}>
      <Stack
        direction="row"
        gap={1}
        alignItems="center"
        justifyContent="center">
        <Typography variant="subtitle1">{text}</Typography>
        {icon}
      </Stack>
    </TableCell>
  );
}
