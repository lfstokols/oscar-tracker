import {Stack, TableCell, Typography} from '@mui/material';
import {TABLE_HEADER_COLOR} from '../config/StyleChoices';

export function TableHeaderCell({
  text,
  subtext,
  sx,
  icon,
  ...props
}: // ...props
{
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
      <Stack direction="column" alignItems="center" gap={0}>
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
          justifyContent="center"
          sx={{position: 'relative'}}>
          {text === undefined ? (
            <></>
          ) : (
            <Typography variant="subtitle1">{text}</Typography>
          )}
          {icon}
        </Stack>
        {subtext && (
          <Typography
            variant="subtitle2"
            sx={{height: '4px', overflow: 'visible'}}>
            {<i> {`(${subtext})`} </i>}
          </Typography>
        )}
      </Stack>
    </TableCell>
  );
}
