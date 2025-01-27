import {useOscarAppContext} from '../../../providers/AppContext';

import {
  // Menu,
  // MenuItem,
  Checkbox,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  List,
  Divider,
  ListItem,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {FilterAlt} from '@mui/icons-material';
import {Grouping, WatchStatuses} from '../../../types/Enums';
import {DisplayedSettingsButton, CenteredMenu, useMenuState} from './Common';
import {categoryOptions} from '../../../hooks/dataOptions';
import {useSuspenseQuery} from '@tanstack/react-query';
import {grouping_display_names} from '../../../types/Enums';
import {NoAccountBlocker} from '../../../components/NoAccountBlocker';

export default function FilterRowsWidget({
  isMobile,
  filterState,
  setFilterState,
}: {
  isMobile: boolean;
  filterState: {watchstatus: WatchStatus[]; categories: CategoryId[]};
  setFilterState: (filterState: {
    watchstatus: WatchStatus[];
    categories: CategoryId[];
  }) => void;
}): React.ReactElement {
  const [isOpen, menuPosition, handleClick, handleClose] = useMenuState();

  const toggleWatchStatusFilter = (watchStatus: WatchStatus) => {
    const newState = [...filterState.watchstatus];
    if (newState.includes(watchStatus)) {
      newState.splice(newState.indexOf(watchStatus), 1);
    } else {
      newState.push(watchStatus);
    }
    setFilterState({...filterState, watchstatus: newState});
  };

  const toggleCategoryFilter = (category: CategoryId) => {
    const newState = [...filterState.categories];
    if (newState.includes(category)) {
      newState.splice(newState.indexOf(category), 1);
    } else {
      newState.push(category);
    }
    setFilterState({...filterState, categories: newState});
  };

  const toggleGroupingFilter = (idList: CategoryId[], add: boolean) => {
    const newState = [...filterState.categories];
    for (const id of idList) {
      if (add && !newState.includes(id)) {
        newState.push(id);
      } else if (!add && newState.includes(id)) {
        newState.splice(newState.indexOf(id), 1);
      }
    }
    setFilterState({...filterState, categories: newState});
  };

  return (
    <>
      <DisplayedSettingsButton
        onClick={handleClick}
        isMobile={isMobile}
        icon={<FilterAlt />}
        text="Filter Rows"
      />
      {isOpen && (
        <SelectionMenu
          menuPosition={menuPosition}
          isOpen={isOpen}
          onClose={handleClose}
          filterState={filterState}
          toggleWatchStatusFilter={toggleWatchStatusFilter}
          toggleCategoryFilter={toggleCategoryFilter}
          toggleGroupingFilter={toggleGroupingFilter}
        />
      )}
    </>
  );
}

function SelectionMenu({
  isOpen,
  onClose,
  menuPosition,
  filterState,
  toggleCategoryFilter,
  toggleWatchStatusFilter,
  toggleGroupingFilter,
}: {
  isOpen: boolean;
  onClose: () => void;
  menuPosition: HTMLElement | null;
  filterState: {watchstatus: WatchStatus[]; categories: CategoryId[]};
  toggleCategoryFilter: (category: CategoryId) => void;
  toggleWatchStatusFilter: (watchStatus: WatchStatus) => void;
  toggleGroupingFilter: (idList: CategoryId[], add: boolean) => void;
}): React.ReactElement {
  const {data: categories} = useSuspenseQuery(categoryOptions());
  const isLoggedIn = useOscarAppContext().activeUserId !== null;
  let watchStatusMessage = 'Showing all statuses';
  if (filterState.watchstatus.length !== 0) {
    watchStatusMessage = 'Filtered: only show selected statuses';
  }
  let categoryMessage = 'Showing all categories';
  if (filterState.categories.length !== 0) {
    categoryMessage = 'Filtered: only show selected categories';
  }
  return (
    <CenteredMenu isOpen={isOpen} onClose={onClose} menuPosition={menuPosition}>
      <Typography sx={{px: 2, py: 1}} color="text.information">
        {watchStatusMessage}
      </Typography>
      <NoAccountBlocker hasAccess={isLoggedIn}>
        <FormGroup sx={{px: 2, py: 1}}>
          <FormControlLabel
            control={
              <Checkbox
                checked={filterState.watchstatus.includes(WatchStatuses.seen)}
                onChange={() => {
                  toggleWatchStatusFilter(WatchStatuses.seen);
                }}
              />
            }
            label="Seen"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filterState.watchstatus.includes(WatchStatuses.todo)}
                onChange={() => {
                  toggleWatchStatusFilter(WatchStatuses.todo);
                }}
              />
            }
            label="To-Do"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={filterState.watchstatus.includes(WatchStatuses.blank)}
                onChange={() => {
                  toggleWatchStatusFilter(WatchStatuses.blank);
                }}
              />
            }
            label="Un-marked"
          />
        </FormGroup>
      </NoAccountBlocker>
      <Divider />
      <Typography sx={{px: 2, py: 1}}>{categoryMessage}</Typography>
      {Object.values(Grouping).map(grouping => (
        <GroupingAccordion
          key={grouping}
          grouping={grouping}
          categories={categories}
          filterState={filterState.categories}
          toggleCategoryFilter={toggleCategoryFilter}
          toggleGroupingFilter={toggleGroupingFilter}
        />
      ))}
    </CenteredMenu>
  );
}

function GroupingAccordion({
  grouping,
  categories,
  filterState,
  toggleCategoryFilter,
  toggleGroupingFilter,
}: {
  grouping: Grouping;
  categories: Category[];
  filterState: CategoryId[];
  toggleCategoryFilter: (category: CategoryId) => void;
  toggleGroupingFilter: (idList: CategoryId[], add: boolean) => void;
}): React.ReactElement {
  const myCategories = categories.filter(
    category => category.grouping === grouping,
  );
  const myCategoryIds = myCategories.map(category => category.id);
  const totalNumCategories = myCategoryIds.length;
  const numSelected = filterState.filter(id =>
    myCategoryIds.includes(id),
  ).length;
  const isSelected = numSelected === totalNumCategories;
  const toggleAll = () => {
    toggleGroupingFilter(myCategoryIds, !isSelected);
  };
  return (
    <Accordion key={grouping} sx={{width: '100%'}}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction="row"
          alignItems="center"
          width="100%"
          justifyContent="space-between">
          <FormControlLabel
            onClick={e => e.stopPropagation()}
            control={<Checkbox checked={isSelected} onChange={toggleAll} />}
            label={<Typography>{grouping_display_names[grouping]}</Typography>}
          />
          <Typography color="text.disabled" sx={{paddingRight: '16px'}}>
            {`${numSelected} / ${totalNumCategories}`}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <List>
          {myCategories.map(category => (
            <ListItem key={`category:${category.id}`}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterState.includes(category.id)}
                    onChange={() => {
                      toggleCategoryFilter(category.id);
                    }}
                  />
                }
                label={category.fullName}
              />
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}
