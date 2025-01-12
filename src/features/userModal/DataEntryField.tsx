import React from 'react';
import {FormControl, FormLabel, TextField} from '@mui/material';

export default function TextEntry({
    title,
    label,
    placeholder,
    error,
    errorMessage,
  }: {
    title: string;
    label: string;
    placeholder: string;
    error: boolean;
    errorMessage: string;
  }): React.ReactElement {
    return (
      <FormControl>
        <FormLabel htmlFor={label}>{title}</FormLabel>
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

