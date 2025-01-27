import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

export default function RuntimeCell({
  runtimeMinutes,
  runtimeHours,
  isRuntimeFormatted,
}: {
  runtimeMinutes: number | null;
  runtimeHours: string | null;
  isRuntimeFormatted: boolean;
}): React.ReactElement {
  return (
    <TableCell sx={{className: 'runtime-column'}} align="center">
      <Typography variant="body1">
        {isRuntimeFormatted ? runtimeHours : runtimeMinutes}
      </Typography>
    </TableCell>
  );
}
