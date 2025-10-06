import LaunchIcon from '@mui/icons-material/Launch';
import {
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import {ClickableTooltip} from '../../components/ClickableTooltip';
import {TABLE_ROW_MINOR_COLOR} from '../../config/StyleChoices';
import {useNavigateToFilterState} from '../../hooks/useFilterState';
import {
  Category,
  CategoryCompletionData,
  MovieList,
  NomList,
  UserId,
  WatchList,
} from '../../types/APIDataSchema';
import {Hypotheticality} from '../userStatsTable/Enums';
import CategoryTooltip from './CategoryTooltip';
import {get_num, get_total, make_fraction_display} from './utils';

export default function CategoryRow({
  category,
  isOpen,
  data,
  hypotheticality,
  userList,
  nominations,
  watchlist,
  movies,
}: {
  category: Category;
  isOpen: boolean;
  data: CategoryCompletionData;
  hypotheticality: Hypotheticality;
  userList: UserId[];
  nominations: NomList;
  watchlist: WatchList;
  movies: MovieList;
}): React.ReactElement {
  const denominator = get_total(category.id, data);
  const navigateToFilterState = useNavigateToFilterState();
  return (
    <TableRow
      key={category.id}
      // color="secondary"
      sx={{
        backgroundColor: TABLE_ROW_MINOR_COLOR,
        // color: 'text.secondary',
        // opacity: isOpen ? 1 : 0,
        maxHeight: isOpen ? '33px' : '0px',
        overflow: 'hidden',
        visibility: isOpen ? 'visible' : 'collapse',
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        transition: 'all 200ms ease-in-out',
        '& > td': {
          maxHeight: isOpen ? '33px' : '0px',
          // padding: isOpen ? undefined : 0,
          border: '0px',
          height: isOpen ? '25px' : '0px',
          overflow: 'hidden',
          visibility: isOpen ? 'visible' : 'collapse',
          transition: 'all 200ms ease-in-out',
          '& > .MuiTypography-root:not(.MuiTooltip-popper *)': {
            transform: isOpen ? 'translateY(0px)' : 'translateY(-100%)',
            visibility: isOpen ? 'visible' : 'collapse',
            opacity: isOpen ? 1 : 0,
            transition: 'all 200ms ease-in-out, opacity 100ms ease-in-out',
          },
        },
      }}>
      <TableCell />
      <TableCell sx={{paddingLeft: '50px'}}>
        <Stack alignItems="center" direction="row" spacing={1}>
          <Typography variant="h6">{category.fullName}</Typography>
          <IconButton
            onClick={() => {
              navigateToFilterState({
                categories: [category.id],
                watchstatus: [],
              });
            }}>
            <LaunchIcon fontSize="small" />
          </IconButton>
        </Stack>
      </TableCell>
      {userList.map(user => (
        <TableCell key={user} align="center">
          <ClickableTooltip
            followCursor
            isOpaque
            popup={
              <CategoryTooltip
                catId={category.id}
                movies={movies}
                nominations={nominations}
                userId={user}
                watchlist={watchlist}
              />
            }>
            <Typography variant="h6">
              {make_fraction_display(
                get_num(user, category.id, hypotheticality, data),
                denominator,
              )}
            </Typography>
          </ClickableTooltip>
        </TableCell>
      ))}
    </TableRow>
  );
}
