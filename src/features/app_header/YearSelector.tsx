import {FormControl, InputLabel, Select, MenuItem} from '@mui/material';
import {useOscarAppContext} from '../../providers/AppContext';
import {SelectChangeEvent} from '@mui/material';
import {AVAILABLE_YEARS} from '../../config/GlobalConstants';

export default function YearSelector() {
  const {year, setYear} = useOscarAppContext();
  const handleYearSelect = (event: SelectChangeEvent) => {
    setYear(parseInt(event.target.value));
  };

  return (
    <FormControl fullWidth>
      <InputLabel id="select-year" sx={{color: 'white'}}>
        Year
      </InputLabel>
      <Select
        labelId="select-year"
        id="select-year"
        value={year.toString()}
        label="Year"
        size="small"
        color="primary"
        onChange={handleYearSelect}>
        {AVAILABLE_YEARS.map(aYear => (
          <MenuItem key={aYear} value={aYear}>
            {aYear}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
