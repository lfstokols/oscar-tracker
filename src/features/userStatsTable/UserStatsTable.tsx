import {useSuspenseQuery} from '@tanstack/react-query';
import React from 'react';
import {Table, TableHead, TableRow, TableCell, TableBody} from '@mui/material';
import {userStatsOptions} from '../../hooks/dataOptions';
import {useOscarAppContext} from '../../providers/AppContext';
import {UserStats} from '../../types/APIDataSchema';

export default function UserStatsTable(): React.ReactElement {
  const year = useOscarAppContext().year;
  const userStats = useSuspenseQuery(userStatsOptions(year)).data;

  // const rows = Object.keys(userStats[0]).filter(
  //   key => key !== 'id' && key !== 'username',
  // );
  const rows: (keyof UserStats)[] = [
    'numSeen',
    'numTodo',
    'seenWatchtime',
    'todoWatchtime',
  ];

  // const rowDisplayNames: Record<(typeof rows)[number], string> = {
  //   numSeen: 'Movies Seen',
  //   numTodo: 'Movies Left to Watch',
  //   seenWatchtime: 'Total Watchtime Completed',
  //\   todoWatchtime: 'Total Watchtime Remaining',
  // };

  function getRowDisplayName(row: string) {
    switch (row) {
      case 'numSeen':
        return 'Movies Seen';
      case 'numTodo':
        return 'Movies Left to Watch';
      case 'seenWatchtime':
        return 'Total Watchtime Completed';
      case 'todoWatchtime':
        return 'Total Watchtime Remaining';
      default:
        return 'Error';
    }
  }

  function getRowValue(row: string, user: UserStats) {
    switch (row) {
      case 'seenWatchtime':
      case 'todoWatchtime':
        return minutesToHours(user[row]);
      case 'numSeen':
      case 'numTodo':
        return user[row] + '/??';
      default:
        return 'Error';
    }
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell />
          {userStats.map(user => (
            <TableCell key={user.id}>{user.username}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(row => (
          <TableRow key={row}>
            <TableCell>{getRowDisplayName(row)}</TableCell>
            {userStats.map(user => (
              <TableCell key={user.id}>{getRowValue(row, user)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function minutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}:${formatNumber(remainingMinutes)}`;
}

function formatNumber(number: number): string {
  return number.toString().padStart(2, '0');
}
