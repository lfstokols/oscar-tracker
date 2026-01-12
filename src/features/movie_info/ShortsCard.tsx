import {Card, CardContent, Typography} from '@mui/material';
// import {Movie} from '../../types/APIDataSchema';

type Props = {
  type: 'animated' | 'live-action' | 'documentary';
  //   movies: Movie[];
};

export default function ShortsCard({type}: Props): React.ReactElement {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{type}</Typography>
      </CardContent>
    </Card>
  );
}
