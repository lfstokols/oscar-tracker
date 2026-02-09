import {Search} from '@mui/icons-material';
import {TextField} from '@mui/material';
import {FilterState} from '../../../hooks/useFilterState';
import {DisplayedSettingsButton, FlexibleMenu} from './Common';
import useMenuState from './useMenuState';

export default function SearchMoviesWidget({
  isMobile,
  filterState,
  setFilterState,
}: {
  isMobile: boolean;
  filterState: FilterState;
  setFilterState: (filterState: FilterState) => void;
}): React.ReactElement {
  const [isOpen, menuPosition, handleClick, handleClose] = useMenuState();

  const setSearchFilter = (subString: string) => {
    setFilterState({...filterState, subString});
  };

  return (
    <>
      <DisplayedSettingsButton
        icon={<Search />}
        isMobile={isMobile}
        onClick={handleClick}
        reset={() => {
          setFilterState({...filterState, subString: undefined});
        }}
        text="Search"
        whatIsActive={filterState.subString}
      />
      {!!isOpen && (
        <SearchBar
          filterState={filterState}
          isOpen={isOpen}
          menuPosition={menuPosition}
          onClose={handleClose}
          setSearchFilter={setSearchFilter}
        />
      )}
    </>
  );
}

function SearchBar({
  isOpen,
  onClose,
  menuPosition,
  filterState,
  setSearchFilter: setSearchFilter,
}: {
  isOpen: boolean;
  onClose: () => void;
  menuPosition: HTMLElement | null;
  filterState: FilterState;
  setSearchFilter: (subString: string) => void;
}): React.ReactElement {
  return (
    <FlexibleMenu isOpen={isOpen} menuPosition={menuPosition} onClose={onClose}>
      <TextField
        label="Search"
        onChange={e => setSearchFilter(e.target.value)}
        value={filterState.subString}
      />
    </FlexibleMenu>
  );
}
