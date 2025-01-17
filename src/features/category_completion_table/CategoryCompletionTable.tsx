import React from 'react';
import {useSuspenseQuery} from '@tanstack/react-query';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Typography,
  TableContainer,
  IconButton,
  Collapse,
  Stack,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  categoryCompletionOptions,
  categoryOptions,
  userOptions,
} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import {Grouping} from '../../types/Enums';

const grouping_display_names: {[key in Grouping]: string} = {
  [Grouping.big_three]: 'Big Three',
  [Grouping.acting]: 'Acting',
  [Grouping.filmkraft]: 'Filmkraft',
  [Grouping.art]: 'Art',
  [Grouping.audio]: 'Audio',
  [Grouping.best_in_class]: 'Best in Class',
  [Grouping.short]: 'Short',
};

// const grouping_tooltips: {[key in Grouping]: string} = {
//   [Grouping.big_three]: ,
//   [Grouping.acting]: 'Acting',
//   [Grouping.filmkraft]: 'Filmkraft',
//   [Grouping.art]: 'Art',
//   [Grouping.audio]: 'Audio',
//   [Grouping.best_in_class]: 'Best in Class',
//   [Grouping.short]: 'Short',
// };

export default function CategoryCompletionTable(): React.ReactElement {
  const year = useOscarAppContext().year;
  const {data} = useSuspenseQuery(categoryCompletionOptions(year));
  const categoryList = useSuspenseQuery(categoryOptions()).data;
  const userList = useSuspenseQuery(userOptions()).data;
  const groupingList = Object.values(Grouping);

  const [isIndividualOpen, setIsIndividualOpen] = React.useState(false);
  const [isIndividualPlannedOpen, setIsIndividualPlannedOpen] =
    React.useState(false);

  function getGroupingTooltip(grouping: Grouping): string {
    const catList = categoryList.filter(cat => cat.grouping === grouping);
    return catList.map(cat => cat.fullName).join(', ');
  }

  function makeCategoryRow(
    catId: CategoryId,
    planned: boolean,
    isOpen: boolean,
  ): React.ReactElement {
    const cat = categoryList.find(cat => cat.id === catId);
    if (!cat) return <TableRow key={catId} color="error"></TableRow>;
    const i = planned ? 1 : 0;
    return (
      <TableRow key={catId} sx={{display: isOpen ? 'table-row' : 'none'}}>
        <TableCell>
          <Typography variant="h6">{cat.shortName}</Typography>
        </TableCell>
        {userList.map(user => (
          <TableCell key={user.id}>{data[user.id][i][catId]}</TableCell>
        ))}
      </TableRow>
    );
  }

  function makeGroupingRow(
    grouping: Grouping,
    planned: boolean,
  ): React.ReactElement {
    const i = planned ? 1 : 0;
    return (
      <TableRow key={grouping} color={planned ? 'goldenrod' : 'default'}>
        <TableCell>
          <Tooltip title={getGroupingTooltip(grouping)}>
            <Typography variant="h6">
              {grouping_display_names[grouping]}
            </Typography>
          </Tooltip>
        </TableCell>
        {userList.map(user => (
          <TableCell key={user.id}>{data[user.id][i][grouping]}</TableCell>
        ))}
      </TableRow>
    );
  }

  // const [openGroups, setOpenGroups] = React.useState<{
  //   [key in Grouping]?: boolean;
  // }>({});

  // const toggleGroup = (grouping: Grouping) => {
  //   setOpenGroups(prev => ({...prev, [grouping]: !prev[grouping]}));
  // };

  function Section({
    header,
    children,
    isOpen,
    setIsOpen,
  }: {
    header: string;
    children: React.ReactNode;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  }): React.ReactElement {
    return (
      <React.Fragment key={header}>
        <TableRow>
          <TableCell>
            <Stack direction="row" alignItems="center">
              <IconButton
                // size="small"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="expand row">
                {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>
              <Typography variant="body1">{header}</Typography>
            </Stack>
          </TableCell>
        </TableRow>
        {children}
      </React.Fragment>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Category</TableCell>
            {userList.map(user => (
              <TableCell key={user.id}>{user.username}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {groupingList.map(grouping => makeGroupingRow(grouping, false))}
          <Section
            header="Individual Categories"
            isOpen={isIndividualOpen}
            setIsOpen={setIsIndividualOpen}>
            {categoryList.map(cat =>
              makeCategoryRow(cat.id, false, isIndividualOpen),
            )}
          </Section>
          {/* <TableRow>
            <Typography variant="h6">Planned</Typography>
          </TableRow> */}
          <TableRow>
            <TableCell>
              <Typography variant="body1">Planned</Typography>
            </TableCell>
          </TableRow>
          {groupingList.map(grouping => makeGroupingRow(grouping, true))}
          <Section
            header="Individual Categories"
            isOpen={isIndividualPlannedOpen}
            setIsOpen={setIsIndividualPlannedOpen}>
            {categoryList.map(cat =>
              makeCategoryRow(cat.id, true, isIndividualPlannedOpen),
            )}
          </Section>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
