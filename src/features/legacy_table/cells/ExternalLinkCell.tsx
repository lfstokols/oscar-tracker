import {IconButton, Stack, TableCell} from '@mui/material';
import {z} from 'zod';
import imdbIcon from '../../../assets/IMDb_Logo_Rectangle_Gold.png';
import JWIcon from '../../../assets/JW_logo_color_10px.svg';
import { NotificationsDispatch, useNotifications } from '../../../providers/NotificationContext';
import { errorToConsole } from '../../../utils/Logger';
const logoHeight = '25px';
const logoMargin = '10px';

export default function ExternalLinkCell({
  movieId,
}: {
  movieId: MovieId;
}): React.ReactElement {
  return (
    <TableCell>
      <Stack direction="column" spacing={0} width="100px">
        <ExternalLink
          icon={justWatchIcon}
          movieId={movieId}
          service="justwatch"
        />
        <ExternalLink icon={ImdbIcon} movieId={movieId} service="imdb" />
      </Stack>
    </TableCell>
  );
}

function ExternalLink({
  icon,
  service,
  movieId,
}: {
  icon: React.ReactElement;
  service: string;
  movieId: MovieId;
}): React.ReactElement {
  const notifications = useNotifications();
  return (
    <IconButton
      onClick={() => handleClick(service, movieId, notifications)}
      style={{margin: logoMargin, padding: 0}}
    >
      {icon}
    </IconButton>
  );
}

function handleClick(service: string, movieId: MovieId, notifications: NotificationsDispatch) {
  const params = new URLSearchParams({
    id: movieId.toString(),
    service: service,
  });
  const url = `/api/forward/get_link?${params.toString()}`;
  fetch(url)
    .then(response => response.json())
    .then((data: z.infer<typeof apiResponse>) => {
      const valid_data = (apiResponse.parse(data));
      if ( valid_data.failed ) {
        notifications.show({
          type: 'info',
          message: valid_data.message ?? 'There are no offers for this movie',
        });
      } else if ( valid_data.url ) {
        window.open(valid_data.url, '_blank');
      }
    })
    .catch(error => {
      errorToConsole(`Error fetching link: ${error}`);
      notifications.show({
        type: 'error',
        message: 'Unable to obtain link',
      });
    });
}

const justWatchIcon = <img alt="JustWatch" src={JWIcon} style={{maxHeight: logoHeight}} width='auto' />;

const ImdbIcon = <img alt="IMDB" height={logoHeight} src={imdbIcon} />;

const apiResponse = z.object({
  failed: z.boolean(),
  message: z.string().optional(),
  url: z.string().url().optional(),
}).refine((data) => {
  if (data.failed) {
    return data.message !== undefined;
  }
  return data.url !== undefined;
}, {
  message: 'Invalid API response, if successful must include url, if unsuccessful must include message',
});
