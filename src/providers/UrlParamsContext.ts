import * as React from 'react';

export type UrlParams = {
  year: number;
};

export const UrlParamsContext = React.createContext<UrlParams | null>(null);
