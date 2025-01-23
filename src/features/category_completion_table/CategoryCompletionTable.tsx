import React from 'react';
import {useSuspenseQueries} from '@tanstack/react-query';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  TableContainer,
  Stack,
  Paper,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import {ColumnLabel} from '../../components/TableHeader';
import {
  categoryCompletionOptions,
  categoryOptions,
  movieOptions,
  nomOptions,
  userOptions,
  watchlistOptions,
} from '../../hooks/dataOptions';
import {
  useSortUsers,
  getNominees,
  catssByGrouping,
} from '../../utils/dataSelectors';
import {useOscarAppContext} from '../../providers/AppContext';
import {Grouping} from '../../types/Enums';
import {WatchList} from '../../types/APIDataSchema';
import {groupCounts, categoryNomCounts} from '../../utils/hardcodedFunctions';
import {ClickableTooltip} from '../../components/ClickableTooltip';
import {
  TABLE_ROW_COLOR,
  TABLE_ROW_MINOR_COLOR,
  TODO_COLOR,
  TODO_CONTRAST_COLOR,
} from '../../config/StyleChoices';
import {grouping_display_names} from '../../types/Enums';

export default function CategoryCompletionTable(): React.ReactElement {
  const {year, preferences} = useOscarAppContext();
  const [mainDataQ, usersQ, nominationsQ, categoriesQ, moviesQ, watchlistQ] =
    useSuspenseQueries({
      queries: [
        categoryCompletionOptions(year),
        userOptions(),
        nomOptions(year),
        categoryOptions(),
        movieOptions(year),
        watchlistOptions(year),
      ],
    });
  const userList = useSortUsers(usersQ.data);
  const data = mainDataQ.data;
  const watchlist = watchlistQ.data;
  const movies = moviesQ.data;
  const categories = categoriesQ.data;
  const nominations = nominationsQ.data;
  const groupingDict = catssByGrouping(categories);
  const groupNomCounts = groupCounts(preferences.shortsAreOneFilm);
  const groupingList = Object.values(Grouping);

  const [areOpenRegular, setAreOpenRegular] = React.useState<
    Record<Grouping, boolean>
  >(
    Object.values(Grouping).reduce((acc, grouping) => {
      acc[grouping] = false;
      return acc;
    }, {} as Record<Grouping, boolean>),
  );

  const [areOpenPlanned, setAreOpenPlanned] = React.useState<
    Record<Grouping, boolean>
  >(
    Object.values(Grouping).reduce((acc, grouping) => {
      acc[grouping] = false;
      return acc;
    }, {} as Record<Grouping, boolean>),
  );

  function makeCategoryRow(
    cat: Category,
    planned: boolean,
    isOpen: boolean,
  ): React.ReactElement {
    // if (!isOpen) return <></>;
    const i = planned ? 1 : 0;
    const denominator = categoryNomCounts(cat.id, preferences.shortsAreOneFilm);
    return (
      <TableRow
        key={planned ? `planned-${cat.id}` : cat.id}
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
          <Typography variant="h6">
            <i>{cat.fullName}</i>
          </Typography>
        </TableCell>
        {userList.map(user => (
          <TableCell key={user.id} align="center">
            <ClickableTooltip
              popup={makeCategoryTooltip(
                cat.id,
                user.id,
                nominations,
                watchlist,
                movies,
              )}
              followCursor>
              <Typography variant="h6">
                {data[user.id][i][cat.id].toString() +
                  ' / ' +
                  denominator.toString()}
              </Typography>
            </ClickableTooltip>
          </TableCell>
        ))}
      </TableRow>
    );
  }

  function makeGroupingRow({
    grouping,
    isExpanded,
    handleToggle,
    planned,
  }: {
    grouping: Grouping;
    isExpanded: boolean;
    handleToggle: () => void;
    planned: boolean;
  }): React.ReactElement {
    const i = planned ? 1 : 0;
    const rowRef = React.useRef<HTMLTableRowElement>(null);

    const handleClick = () => {
      const currentPosition = rowRef.current?.getBoundingClientRect().top;
      handleToggle();
      if (currentPosition) {
        requestAnimationFrame(() => {
          const newPosition = rowRef.current?.getBoundingClientRect().top;
          if (newPosition && currentPosition !== newPosition) {
            window.scrollBy(0, newPosition - currentPosition);
          }
        });
      }
    };
    return (
      <TableRow
        key={planned ? `planned-${grouping}` : grouping}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
          },
        }}
        onClick={handleClick}>
        <TableCell>
          {isExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
        </TableCell>
        <TableCell>
          <Typography variant="h6">
            {grouping_display_names[grouping]}
          </Typography>
        </TableCell>
        {userList.map(user => (
          <TableCell key={user.id} align="center">
            <Typography variant="h6">
              {data[user.id][i][grouping].toString() +
                ' / ' +
                groupNomCounts[grouping].toString()}
            </Typography>
          </TableCell>
        ))}
      </TableRow>
    );
  }

  return (
    <Paper
      sx={{
        marginTop: '16px',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        scrollbarWidth: '0px',
      }}>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <ColumnLabel width="50px" text="" />
              <ColumnLabel width="300px" text="Category" />
              {userList.map(user => (
                <ColumnLabel key={user.id} text={user.username} />
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[0, 1].map(i => (
              <React.Fragment key={i}>
                {i === 1 && plannedBanner}
                {groupingList.map(grouping => {
                  const isExpanded =
                    i === 1
                      ? areOpenPlanned[grouping]
                      : areOpenRegular[grouping];
                  return (
                    <React.Fragment key={`${i}-${grouping}`}>
                      {makeGroupingRow({
                        grouping,
                        isExpanded,
                        handleToggle: () =>
                          i === 1
                            ? setAreOpenPlanned(prev => ({
                                ...prev,
                                [grouping]: !prev[grouping],
                              }))
                            : setAreOpenRegular(prev => ({
                                ...prev,
                                [grouping]: !prev[grouping],
                              })),
                        planned: i === 1,
                      })}
                      {groupingDict[grouping].map(cat =>
                        makeCategoryRow(cat, i === 1, isExpanded),
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function makeCategoryTooltip(
  catId: CategoryId,
  userId: UserId,
  nominations: NomList,
  watchlist: WatchList,
  movies: MovieList,
): React.ReactNode {
  const categoryMovies = getNominees(catId, nominations).filter(
    (movieId): movieId is MovieId => movieId !== null,
  );
  const getIds = (actual: boolean) =>
    watchlist
      .filter(
        wl =>
          wl.userId === userId &&
          wl.status === (actual ? 'seen' : 'todo') &&
          categoryMovies.includes(wl.movieId),
      )
      .map(wl => wl.movieId);
  const myMovieIds = getIds(true);
  const myPlannedMovieIds = getIds(false);
  const myMissingMovieIds = categoryMovies.filter(
    movieId =>
      !myMovieIds.includes(movieId) && !myPlannedMovieIds.includes(movieId),
  );
  return (
    <Stack
      spacing={2}
      direction="row"
      justifyContent="space-between"
      sx={{
        maxWidth: '7500px',
        '& > div': {
          flex: 1,
          minWidth: '75px', // This prevents flex items from overflowing
        },
      }}>
      <div>
        <div style={{width: '100%', textAlign: 'center'}}>
          <Typography variant="h6" noWrap>
            <u>Seen</u>
          </Typography>
        </div>
        <Stack gap={1.5} style={{paddingLeft: '12px', marginTop: '0px'}}>
          {myMovieIds.map(id => {
            const movie = movies.find(m => m.id === id);
            return (
              <div key={id}>
                <Typography variant="body1" sx={{lineHeight: 1.1}} noWrap>
                  {movie ? movie.mainTitle : '??? '}
                </Typography>
              </div>
            );
          })}
        </Stack>
      </div>
      <div>
        <div style={{width: '100%', textAlign: 'center'}}>
          <Typography variant="h6" noWrap>
            <u>Planned</u>
          </Typography>
        </div>
        <Stack gap={1.5} style={{paddingLeft: '12px', marginTop: '0px'}}>
          {myPlannedMovieIds.map(id => {
            const movie = movies.find(m => m.id === id);
            return (
              <div key={id}>
                <Typography variant="body1" sx={{lineHeight: 1.1}} noWrap>
                  {movie ? movie.mainTitle : '??? '}
                </Typography>
              </div>
            );
          })}
        </Stack>
      </div>
      <div>
        <div style={{width: '100%', textAlign: 'center'}}>
          <Typography variant="h6" noWrap>
            <u>Missing</u>
          </Typography>
        </div>
        <Stack gap={1.5} style={{paddingLeft: '12px', marginTop: '0px'}}>
          {myMissingMovieIds.map(id => {
            const movie = movies.find(m => m.id === id);
            return (
              <div key={id}>
                <Typography variant="body1" sx={{lineHeight: 1.1}} noWrap>
                  {movie ? movie.mainTitle : '???'}
                </Typography>
              </div>
            );
          })}
        </Stack>
      </div>
    </Stack>
  );
}
const plannedBanner = (
  <TableRow>
    <TableCell
      colSpan={100}
      sx={{
        backgroundColor: 'background.paper',
        position: 'sticky',
        top: 56,
        zIndex: 2,
      }}
      align="center">
      <Typography color={TODO_COLOR} variant="h5">
        Planned
      </Typography>
    </TableCell>
  </TableRow>
);
