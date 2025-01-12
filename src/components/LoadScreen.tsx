import React from 'react';
import {Backdrop, CircularProgress} from '@mui/material';

export function LoadScreen(): React.ReactElement {
    return (
      <Backdrop
        sx={theme => ({color: '#fff', zIndex: theme.zIndex.drawer + 1, flexGrow: 1})}
        open={true}
        onClick={() => {}}>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }