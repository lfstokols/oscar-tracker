import AlbumIcon from '@mui/icons-material/Album';
import ArticleIcon from '@mui/icons-material/Article';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CameraIcon from '@mui/icons-material/Camera';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import DrawIcon from '@mui/icons-material/Draw';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import FaceIcon from '@mui/icons-material/Face';
import MakeupFaceIcon from '@mui/icons-material/Face2';
import FemaleFaceIcon from '@mui/icons-material/Face3';
import GroupIcon from '@mui/icons-material/Group';
import LanguageIcon from '@mui/icons-material/Language';
import MovieIcon from '@mui/icons-material/Movie';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SatelliteIcon from '@mui/icons-material/Satellite';
import StarIcon from '@mui/icons-material/StarRate';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import SvgIcon from '@mui/material/SvgIcon/SvgIcon';
import type {SvgIconProps} from '@mui/material/SvgIcon/SvgIcon';
import countries from '../assets/countries.json';
import musicVideos from '../assets/musicVideos.json';

import 'flag-icons/css/flag-icons.min.css';
import {
  ACTING_GROUPING_COLOR,
  ART_GROUPING_COLOR,
  AUDIO_GROUPING_COLOR,
  BEST_IN_CLASS_GROUPING_COLOR,
  BIG_THREE_GROUPING_COLOR,
  FILMKRAFT_GROUPING_COLOR,
  SHORT_GROUPING_COLOR,
} from '../config/StyleChoices';
import {CategoryType, Grouping} from '../types/Enums';

const countryCodes: {name: string; flag: string; code: string}[] = countries;
const songUrls: {title: string; url: string}[] = musicVideos;

export function getFlag(country: string): React.ReactNode {
  //* Convert country names to 2-letter ISO country codes
  const data = countryCodes.find(c => c.name === country);
  if (!data) return '';
  return <span className={`fi fi-${data.code.toLowerCase()}`} />;
}

export function getSong(song: string): React.ReactNode {
  const url = songUrls.find(s => s.title === song)?.url;
  if (!url) return song;
  return (
    <a
      href={url}
      style={{
        marginLeft: '4px',
        textDecoration: 'none',
        color: 'inherit',
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '4px',
      }}>
      <svg
        height="1.25em"
        style={{fill: '#FF0000', position: 'relative', top: '4px'}}
        viewBox="0 0 24 24">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
      </svg>
      {song}
    </a>
  );
}

export function getCategoryIcon(
  category: Category,
  fontSize: SvgIconProps['fontSize'] = 'inherit',
): React.ReactNode {
  const Component = getIconNameForCategory(category);

  return (
    <Component
      fontSize={fontSize}
      htmlColor={getGroupingColor(category.grouping)}
    />
  );
}

export function getGroupingColor(grouping: Grouping): string {
  switch (grouping) {
    case Grouping.big_three:
      return BIG_THREE_GROUPING_COLOR;
    case Grouping.acting:
      return ACTING_GROUPING_COLOR;
    case Grouping.art:
      return ART_GROUPING_COLOR;
    case Grouping.audio:
      return AUDIO_GROUPING_COLOR;
    case Grouping.filmkraft:
      return FILMKRAFT_GROUPING_COLOR;
    case Grouping.best_in_class:
      return BEST_IN_CLASS_GROUPING_COLOR;
    case Grouping.short:
      return SHORT_GROUPING_COLOR;
  }
}

function getIconNameForCategory(category: Category): typeof SvgIcon {
  switch (category.id as CategoryType) {
    // Big Three
    case CategoryType.best_picture:
      return StarIcon;
    case CategoryType.director:
      return MovieIcon;
    case CategoryType.original_screenplay:
    case CategoryType.adapted_screenplay:
      return ArticleIcon;

    // Acting
    case CategoryType.best_actor:
      return FaceIcon;
    case CategoryType.best_actress:
      return FemaleFaceIcon;
    case CategoryType.supporting_actor:
    case CategoryType.supporting_actress:
      return GroupIcon;

    // Art
    case CategoryType.costumes:
      return CheckroomIcon;
    case CategoryType.makeup_and_hair:
      return MakeupFaceIcon;
    case CategoryType.production_design:
      return SatelliteIcon;
    case CategoryType.visual_effects:
      return AutoAwesomeIcon;

    // Audio
    case CategoryType.score:
      return MusicNoteIcon;
    case CategoryType.original_song:
      return AlbumIcon;
    case CategoryType.sound:
      return EqualizerIcon;

    // Filmkraft
    case CategoryType.cinematography:
      return CameraIcon;
    case CategoryType.editing:
      return ContentCutIcon;

    // Best in Class
    case CategoryType.animated_feature:
      return DrawIcon;
    case CategoryType.foreign_film:
      return LanguageIcon;
    case CategoryType.documentary:
      return TravelExploreIcon;

    // Shorts
    case CategoryType.animated_short:
    case CategoryType.live_action_short:
    case CategoryType.documentary_short:
      return VideoLibraryIcon;
  }
}
