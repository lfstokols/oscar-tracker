import {useContext, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import { AVAILABLE_YEARS,DEFAULT_YEAR} from '../config/GlobalConstants';
import {UrlParamsContext} from './../providers/UrlParamsContext';

export default function useYearState(): [number, (year: number) => void] {
  const navigate = useNavigate();
  const urlParams = useContext(UrlParamsContext);

  const [year, setYear] = useState<number>(() => {
    const urlYear = urlParams?.year ?? null;
    if (urlYear && AVAILABLE_YEARS.includes(urlYear)) {
      return urlYear;
    }
    return DEFAULT_YEAR;
  });

  //* Set a new version of setYear that also updates the URL
  const newSetYear = upgradeSetYear(setYear, navigate);

  useEffect(() => {
    if (urlParams?.year) {
      const parsedYear = urlParams.year;
      if (AVAILABLE_YEARS.includes(parsedYear)) {
        setYear(parsedYear);
      }
    }
  }, [urlParams?.year]);

  return [year, newSetYear];
}

//* Returns a new version of setYear that also updates the URL
function upgradeSetYear(
  setYear: (year: number) => void,
  navigate: ReturnType<typeof useNavigate>,
): (year: number) => void {
  return (year: number) => {
    setYear(year);
    const currentPath = window.location.pathname;
    const match = currentPath.match(/(\d{4})/);
    if (match) {
      void navigate(currentPath.replace(match[0], year.toString()), {
        replace: true,
      });
    } else {
      void navigate(`/${year}`, {replace: true});
    }
  };
}
