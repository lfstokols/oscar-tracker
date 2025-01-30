import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {debounce} from '@mui/material/utils';
import * as React from 'react';
import {MIN_SEARCH_LENGTH} from '../../../config/GlobalConstants';
import SearchProfileDatabase, {LProfile} from './SearchProfileDatabase';

type Props = {
  setter: (newValue: string | null) => void;
};

export default function LetterboxdSearchBar({setter}: Props): React.ReactNode {
  const [value, setValue] = React.useState<LProfile | null>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState<LProfile[]>([]);

  const fetchSearch = React.useMemo(
    () =>
      debounce(async (request: {input: string}) => {
        const results = await SearchProfileDatabase(request.input);
        setOptions(results);
      }, 400),
    [],
  );

  React.useEffect(() => {
    if (inputValue === '' || inputValue.length < MIN_SEARCH_LENGTH) {
      setOptions(value ? [value] : []);
      return;
    }
    void fetchSearch({input: inputValue});
  }, [value, inputValue, fetchSearch]);

  return (
    <Autocomplete
      autoComplete
      filterOptions={x => x}
      filterSelectedOptions
      getOptionLabel={option =>
        typeof option === 'string' ? option : option.username
      }
      includeInputInList
      noOptionsText="No profiles"
      onChange={(_event, newValue: LProfile | null) => {
        setOptions(newValue ? [newValue, ...options] : options);
        setValue(newValue);
        setter(newValue?.username ?? null);
      }}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onSubmit={_event => {
        setter(value?.username ?? null);
      }}
      options={options}
      renderInput={params => (
        <TextField
          {...params}
          fullWidth
          label="Enter your Letterboxd username"
        />
      )}
      renderOption={(
        props: {key: string} & React.ComponentPropsWithoutRef<'li'>,
        option: LProfile,
      ) => {
        const {key, ...optionProps} = props;
        return (
          <li key={key} {...optionProps}>
            <Grid container sx={{alignItems: 'center'}}>
              <Grid sx={{display: 'flex', width: 44}}>
                <Avatar src={option.avatar} />
              </Grid>
              <Grid sx={{width: 'calc(100% - 44px)', wordWrap: 'break-word'}}>
                <Typography sx={{color: 'text.primary'}} variant="body2">
                  {option.username}
                </Typography>
                <Typography sx={{color: 'text.secondary'}} variant="body2">
                  {option.fullName}
                </Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
      sx={{width: 300}}
      value={value}
    />
  );
}
