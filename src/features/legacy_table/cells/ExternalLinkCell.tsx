import {IconButton, Stack, TableCell} from '@mui/material';
import imdbIcon from '../../../assets/IMDb_Logo_Rectangle_Gold.png';
import JWIcon from '../../../assets/JW_logo_color_10px.svg';
import {isKeyInObject} from '../../../utils/objectUtils';

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
  return (
    <IconButton
      onClick={() => handleClick(service, movieId)}
      style={{margin: logoMargin, padding: 0}}
    >
      {icon}
    </IconButton>
  );
}

function handleClick(service: string, movieId: MovieId) {
  const params = new URLSearchParams({
    id: movieId.toString(),
    service: service,
  });
  const url = `/api/forward/get_link?${params.toString()}`;
  fetch(url)
    .then(response => response.json())
    .then((data: {url: string}) => {
      if (
        isKeyInObject('url', data) &&
        typeof data.url === 'string' &&
        data.url.length > 0
      ) {
        window.open(data.url, '_blank');
      }
    })
    .catch(error => {
      console.error('Error fetching link:', error);
    });
}

const justWatchIcon = <img alt="JustWatch" src={JWIcon} style={{maxHeight: logoHeight}} width='auto' />;

const ImdbIcon = <img alt="IMDB" height={logoHeight} src={imdbIcon} />;
