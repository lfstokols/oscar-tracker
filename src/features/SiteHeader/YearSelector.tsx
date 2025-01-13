import {FormControl, InputLabel, Select, MenuItem} from '@mui/material';
import { useOscarAppContext } from '../../globalProviders/AppContext';
import { SelectChangeEvent } from '@mui/material';
export default function YearSelector() {
  const {year, setYear} = useOscarAppContext();
  const availableYears = [2023, 2024] // ! Get this from the backend
  const handleYearSelect = (event: SelectChangeEvent) => {
    setYear(parseInt(event.target.value));
  };

  return (
    <FormControl fullWidth>
      <InputLabel id="select-year" sx={{color: 'white'}}>Year</InputLabel>
      <Select
        labelId="select-year"
        id="select-year"
        value={year.toString()}
        label="Year"
        size="small"
        color="primary"
        onChange={handleYearSelect}>
        {availableYears.map((year) => (
          <MenuItem key={year} value={year} disabled={year === 2024}>{year}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
