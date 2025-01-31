import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {AVAILABLE_YEARS} from '../../config/GlobalConstants';
import {useOscarAppContext} from '../../providers/AppContext';

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
        color="primary"
        id="select-year"
        label="Year"
        labelId="select-year"
        onChange={handleYearSelect}
        size="small"
        value={year.toString()}>
        {AVAILABLE_YEARS.map(aYear => (
          <MenuItem key={aYear} value={aYear}>
            {aYear}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
