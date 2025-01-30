import React from 'react';
import {Typography, TableCell, TableRow} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
} from '@mui/icons-material';
import {Grouping} from '../../types/Enums';
import {make_fraction_display, get_num, get_total} from './utils';
import {Hypotheticality} from '../userStatsTable/Enums';
import {CategoryCompletionData} from '../../types/APIDataSchema';
import {UserId} from '../../types/APIDataSchema';
import {grouping_display_names} from '../../types/Enums';

export default function GroupingRow({
  grouping,
  isExpanded,
  handleToggle,
  data,
  hypotheticality,
  userList,
}: {
  grouping: Grouping;
  isExpanded: boolean;
  handleToggle: () => void;
  data: CategoryCompletionData;
  hypotheticality: Hypotheticality;
  userList: UserId[];
}): React.ReactElement {
  const rowRef = React.useRef<HTMLTableRowElement>(null);

  const handleClick = () => {
    const currentPosition = rowRef.current?.getBoundingClientRect().top;
    handleToggle();
    if (currentPosition) {
      requestAnimationFrame(() => {
        const newPosition = rowRef.current?.getBoundingClientRect().top;
        if (newPosition && currentPosition !== newPosition) {
          window.scrollBy(0, newPosition - currentPosition);
        }
      });
    }
  };

  const denominator = get_total(grouping, data);

  return (
    <TableRow
      key={grouping}
      onClick={handleClick}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
      }}>
      <TableCell>
        {isExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
      </TableCell>
      <TableCell>
        <Typography variant="h6">{grouping_display_names[grouping]}</Typography>
      </TableCell>
      {userList.map(user => (
        <TableCell key={user} align="center">
          <Typography variant="h6">
            {make_fraction_display(
              get_num(user, grouping, hypotheticality, data),
              denominator,
            )}
          </Typography>
        </TableCell>
      ))}
    </TableRow>
  );
}
