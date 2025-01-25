import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

export default function RuntimeCell({
  runtime_minutes,
  runtime_hours,
  display_formatted,
}: {
  runtime_minutes: number | null;
  runtime_hours: string | null;
  display_formatted: boolean;
}): React.ReactElement {
  return (
    <TableCell sx={{minWidth: 200, className: 'runtime-column'}} align="center">
      <Typography variant="h6">
        {display_formatted ? runtime_hours : runtime_minutes}
      </Typography>
    </TableCell>
  );
}
