import {TableCell, TableRow, Typography} from '@mui/material';
import {ClickableTooltip} from '../../components/ClickableTooltip';
import {TABLE_ROW_MINOR_COLOR} from '../../config/StyleChoices';
import {
  Category,
  CategoryCompletionData,
  MovieList,
  NomList,
  UserId,
  WatchList,
} from '../../types/APIDataSchema';
import {Hypotheticality} from '../userStatsTable/Enums';
import makeCategoryTooltip from './CategoryTooltip';
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
        <Typography variant="body1">
          <i>{category.fullName}</i>
        </Typography>
      </TableCell>
      {userList.map(user => (
        <TableCell key={user} align="center">
          <ClickableTooltip
            followCursor
            popup={makeCategoryTooltip(
              category.id,
              user,
              nominations,
              watchlist,
              movies,
            )}>
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
