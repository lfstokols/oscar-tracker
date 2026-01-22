import {useQuery} from '@tanstack/react-query';
import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {defaultYearOptions, yearsOptions} from './dataOptions';

export default function useYearState(): [number, (year: number) => void] {
  const navigate = useNavigate();
  const urlParams = useParams();
  const {data: dynamicDefaultYear} = useQuery(defaultYearOptions());
  const {data: availableYears} = useQuery(yearsOptions());

  const [year, setYear] = useState<number>(() => {
    const urlYear = parseInt(urlParams.year ?? '');
    if (urlYear && availableYears?.includes(urlYear)) {
      return urlYear;
    }
    return dynamicDefaultYear ?? 0;
  });

  //* Set a new version of setYear that also updates the URL
  const newSetYear = upgradeSetYear(setYear, navigate);

  useEffect(() => {
    if (urlParams.year) {
      const parsedYear = parseInt(urlParams.year);
      if (availableYears?.includes(parsedYear)) {
        setYear(parsedYear);
      }
    } else if (dynamicDefaultYear) {
      setYear(dynamicDefaultYear);
    }
  }, [urlParams.year, dynamicDefaultYear, availableYears]);

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
      const cleanPath = currentPath.endsWith('/')
        ? currentPath.slice(0, -1)
        : currentPath;
      void navigate(`${cleanPath}/${year}`, {replace: true});
    }
  };
}
