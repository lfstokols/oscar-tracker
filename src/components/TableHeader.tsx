import {Stack, TableCell, Typography} from '@mui/material';
import {TABLE_HEADER_COLOR} from '../config/StyleChoices';

export function TableHeaderCell({
  text,
  subtext,
  sx,
  icon,
  ...props
}: {
  text?: string;
  icon?: React.ReactNode;
  subtext?: string;
} & React.ComponentProps<typeof TableCell>): React.ReactElement {
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
      <Stack alignItems="center" direction="column" gap={0}>
        <Stack
          alignItems="center"
          direction="row"
          gap="4px"
          justifyContent="center"
          sx={{position: 'relative'}}>
          {text === undefined ? null : (
            <Typography variant="subtitle1">{text}</Typography>
          )}
          {icon}
        </Stack>
        {!!subtext && (
          <Typography
            sx={{height: '4px', overflow: 'visible'}}
            variant="subtitle2">
            <i> ({subtext}) </i>
          </Typography>
        )}
      </Stack>
    </TableCell>
  );
}
