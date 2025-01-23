import React from 'react';
import {FormControl, FormLabel, TextField} from '@mui/material';

export default function TextEntry({
  display_name,
  label,
  placeholder,
  error,
  errorMessage,
}: {
  display_name: string;
  label: string;
  placeholder: string;
  error: boolean;
  errorMessage: string;
}): React.ReactElement {
  return (
    <FormControl>
      <FormLabel htmlFor={label}>{display_name}</FormLabel>
      <TextField
        error={error}
        helperText={errorMessage}
        id={label}
        type="text"
        name={label}
        placeholder={placeholder}
        autoFocus
        required
        fullWidth
        variant="outlined"
        color={error ? 'error' : 'primary'}
      />
    </FormControl>
  );
}
