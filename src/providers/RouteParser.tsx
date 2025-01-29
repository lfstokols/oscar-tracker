import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate, matchPath, Navigate} from 'react-router-dom';
import {
  LEGACY_URL,
  BY_USER_URL,
  BY_CATEGORY_URL,
  DEFAULT_YEAR,
  AVAILABLE_YEARS,
} from '../config/GlobalConstants';
import {logToConsole} from '../utils/Logger';

const ROUTES = {
  FULL: '/:tab/:year',
  YEAR_ONLY: '/:year',
  TABS_ONLY: '/:tab',
};

const VALID_TABS = [LEGACY_URL, BY_USER_URL, BY_CATEGORY_URL];

type UrlParams = {
  year: number;
};

export const UrlParamsContext = React.createContext<UrlParams | null>(null);

export default function RouteParser({children}: {children: React.ReactNode}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [urlParams, setUrlParams] = useState<UrlParams>({
    year: getValidParams(location.pathname).year,
  });

  useEffect(() => {
    const {year: validYear, tab: validTab} = getValidParams(location.pathname);

    //* Make sure the context is up to date with the new location
    setUrlParams({year: validYear});

    // If the URL isn't in the complete format or has invalid parameters,
    // redirect to the normalized version
    if (!isValidLocation(location.pathname)) {
      logToConsole(
        `RouteParser's useEffect is about to navigate to ${makeUrl(
          getValidParams(location.pathname),
        )}`,
      );
      void navigate(makeUrl({year: validYear, tab: validTab}), {replace: true});
    }
  }, [location, navigate]);

  logToConsole(
    `RouteParser is about to navigate to ${makeUrl(
      getValidParams(location.pathname),
    )} unless ${isValidLocation(location.pathname)}`,
  );
  return (
    <UrlParamsContext.Provider value={urlParams}>
      {isValidLocation(location.pathname) ? (
        children
      ) : (
        <Navigate to={makeUrl(getValidParams(location.pathname))} replace />
      )}
    </UrlParamsContext.Provider>
  );
}

function getValidParams(pathname: string) {
  // Try to match against each pattern
  const completeMatch = matchPath(ROUTES.FULL, pathname);
  const yearOnlyMatch = matchPath(ROUTES.YEAR_ONLY, pathname);
  const tabOnlyMatch = matchPath(ROUTES.TABS_ONLY, pathname);

  // Extract whatever parameters are available
  const year =
    completeMatch?.params.year ??
    yearOnlyMatch?.params.year ??
    DEFAULT_YEAR.toString();
  const tab =
    completeMatch?.params.tab ?? tabOnlyMatch?.params.tab ?? LEGACY_URL;
  //* Validate Tab
  const validTab = VALID_TABS.includes(tab) ? tab : LEGACY_URL;

  // Validate year
  const parsedYear = parseInt(year);
  const validYear =
    !isNaN(parsedYear) && AVAILABLE_YEARS.includes(parsedYear)
      ? parsedYear
      : DEFAULT_YEAR;

  return {year: validYear, tab: validTab};
}

function isValidLocation(pathname: string) {
  const validParams = getValidParams(pathname);
  const inputParams = matchPath(ROUTES.FULL, pathname)?.params ?? {};
  return (
    validParams.year.toString() === inputParams.year &&
    validParams.tab === inputParams.tab
  );
}

function makeUrl(params: {year: number; tab: string}) {
  return `/${params.tab}/${params.year}`;
}
