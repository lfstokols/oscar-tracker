import {
  Menu,
  MenuItem,
  Checkbox,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  Divider,
  ListItem,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {FilterAlt} from '@mui/icons-material';
import {Grouping, WatchStatuses} from '../../../types/Enums';
import {DisplayedSettingsButton, CenteredMenu, useMenuState} from './Common';
import {categoryOptions} from '../../../hooks/dataOptions';
import {useSuspenseQuery} from '@tanstack/react-query';

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
  const toggleCategoryFilter = (category: CategoryId) => {
    const newState = {...filterState};
    newState.categories = filterState.categories.includes(category)
      ? filterState.categories.filter((c: CategoryId) => c !== category)
      : [...filterState.categories, category];
    setFilterState(newState);
  };
  const toggleWatchStatusFilter = (watchStatus: WatchStatus) => {
    const newState = {...filterState};
    newState.watchstatus = filterState.watchstatus.includes(watchStatus)
      ? filterState.watchstatus.filter(w => w !== watchStatus)
      : [...filterState.watchstatus, watchStatus];
    setFilterState(newState);
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
          toggleCategoryFilter={toggleCategoryFilter}
          toggleWatchStatusFilter={toggleWatchStatusFilter}
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
}: {
  isOpen: boolean;
  onClose: () => void;
  menuPosition: HTMLElement | null;
  filterState: {watchstatus: WatchStatus[]; categories: CategoryId[]};
  toggleCategoryFilter: (category: CategoryId) => void;
  toggleWatchStatusFilter: (watchStatus: WatchStatus) => void;
}): React.ReactElement {
  const {data: categories} = useSuspenseQuery(categoryOptions());
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
      <MenuItem key="watchstatusMessage">
        <Typography>{watchStatusMessage}</Typography>
      </MenuItem>
      <MenuItem key="status:seen">
        <Checkbox
          checked={filterState.watchstatus.includes(WatchStatuses.seen)}
          onChange={() => {
            toggleWatchStatusFilter(WatchStatuses.seen);
          }}
        />
        <Typography>Seen</Typography>
      </MenuItem>
      <MenuItem key="status:todo">
        <Checkbox
          checked={filterState.watchstatus.includes(WatchStatuses.todo)}
          onChange={() => {
            toggleWatchStatusFilter(WatchStatuses.todo);
          }}
        />
        <Typography>To-Do</Typography>
      </MenuItem>
      <MenuItem key="status:blank">
        <Checkbox
          checked={filterState.watchstatus.includes(WatchStatuses.blank)}
          onChange={() => {
            toggleWatchStatusFilter(WatchStatuses.blank);
          }}
        />
        <Typography>Un-marked</Typography>
      </MenuItem>
      <Divider />
      <MenuItem key="categoryMessage">
        <Typography>{categoryMessage}</Typography>
      </MenuItem>
      {Object.values(Grouping).map(grouping => (
        <MenuItem key={`grouping:${grouping}`}>
          <GroupingAccordion
            grouping={grouping}
            categories={categories}
            filterState={filterState.categories}
            toggleCategoryFilter={toggleCategoryFilter}
          />
        </MenuItem>
      ))}
    </CenteredMenu>
  );
}

function GroupingAccordion({
  grouping,
  categories,
  filterState,
  toggleCategoryFilter,
}: {
  grouping: Grouping;
  categories: Category[];
  filterState: CategoryId[];
  toggleCategoryFilter: (category: CategoryId) => void;
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
    //* selects everything, unless that's already true, then deselects everything
    if (isSelected) {
      for (const category of myCategories) {
        toggleCategoryFilter(category.id);
      }
    } else {
      for (const category of myCategories) {
        if (!filterState.includes(category.id)) {
          toggleCategoryFilter(category.id);
        }
      }
    }
  };
  return (
    <Accordion key={grouping}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Checkbox checked={isSelected} onChange={toggleAll} />
        <Typography>{grouping}</Typography>
        <Typography
          color="disabled"
          sx={{
            marginLeft: '8px',
          }}>{`${numSelected} / ${totalNumCategories}`}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <List>
          {myCategories.map(category => (
            <ListItem key={`category:${category.id}`}>
              <Checkbox
                checked={filterState.includes(category.id)}
                onChange={() => {
                  toggleCategoryFilter(category.id);
                }}
              />
              <Typography>{category.fullName}</Typography>
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}
