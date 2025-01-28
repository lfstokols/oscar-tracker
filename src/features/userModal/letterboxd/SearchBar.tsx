import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import {debounce} from '@mui/material/utils';
import {LProfile} from './SearchProfileDatabase';
import SearchProfileDatabase from './SearchProfileDatabase';
import {MIN_SEARCH_LENGTH} from '../../../config/GlobalConstants';

type Props = {
  setter: (newValue: string | null) => void;
};

export default function LetterboxdSearchBar(props: Props): React.ReactNode {
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
    fetchSearch({input: inputValue});
  }, [value, inputValue, fetchSearch]);

  return (
    <Autocomplete
      sx={{width: 300}}
      getOptionLabel={option =>
        typeof option === 'string' ? option : option.username
      }
      filterOptions={x => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      noOptionsText="No profiles"
      onSubmit={_event => {
        props.setter(value?.username || null);
      }}
      onChange={(_event, newValue: LProfile | null) => {
        setOptions(newValue ? [newValue, ...options] : options);
        setValue(newValue);
        props.setter(newValue?.username || null);
      }}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={params => (
        <TextField
          {...params}
          label="Enter your Letterboxd username"
          fullWidth
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
                <Typography variant="body2" sx={{color: 'text.primary'}}>
                  {option.username}
                </Typography>
                <Typography variant="body2" sx={{color: 'text.secondary'}}>
                  {option.fullName}
                </Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
    />
  );
}
