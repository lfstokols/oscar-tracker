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
        autoFocus
        color={error ? 'error' : 'primary'}
        error={error}
        fullWidth
        helperText={errorMessage}
        id={label}
        name={label}
        placeholder={placeholder}
        required
        type="text"
        variant="outlined"
      />
    </FormControl>
  );
}
