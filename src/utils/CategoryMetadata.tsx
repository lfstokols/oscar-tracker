import type { SvgIconProps } from '@mui/material/SvgIcon/SvgIcon';
import SvgIcon from '@mui/material/SvgIcon/SvgIcon';

import countries from '../assets/countries.json';
import musicVideos from '../assets/musicVideos.json';
import AlbumTwoToneIcon from '@mui/icons-material/AlbumTwoTone';
import ArchitectureTwoToneIcon from '@mui/icons-material/ArchitectureTwoTone';
import ArticleTwoToneIcon from '@mui/icons-material/ArticleTwoTone';
import AutoAwesomeTwoToneIcon from '@mui/icons-material/AutoAwesomeTwoTone';
import BrushTwoToneIcon from '@mui/icons-material/BrushTwoTone';
import CheckroomTwoToneIcon from '@mui/icons-material/CheckroomTwoTone';
import ContentCutTwoToneIcon from '@mui/icons-material/ContentCutTwoTone';
import EqualizerTwoToneIcon from '@mui/icons-material/EqualizerTwoTone';
import Face4TwoToneIcon from '@mui/icons-material/Face4TwoTone';
import FaceTwoToneIcon from '@mui/icons-material/FaceTwoTone';
import GroupTwoToneIcon from '@mui/icons-material/GroupTwoTone';
import LanguageTwoToneIcon from '@mui/icons-material/LanguageTwoTone';
import MovieTwoToneIcon from '@mui/icons-material/MovieTwoTone';
import MusicNoteTwoToneIcon from '@mui/icons-material/MusicNoteTwoTone';
import SmartToyTwoToneIcon from '@mui/icons-material/SmartToyTwoTone';
import StarTwoToneIcon from '@mui/icons-material/StarTwoTone';
import TravelExploreTwoToneIcon from '@mui/icons-material/TravelExploreTwoTone';
import VideocamTwoToneIcon from '@mui/icons-material/VideocamTwoTone';
import VideoLibraryTwoToneIcon from '@mui/icons-material/VideoLibraryTwoTone';

import 'flag-icons/css/flag-icons.min.css';
import { CategoryType, Grouping } from '../types/Enums';
import {
  BIG_THREE_GROUPING_COLOR,
  ACTING_GROUPING_COLOR,
  ART_GROUPING_COLOR,
  AUDIO_GROUPING_COLOR,
  FILMKRAFT_GROUPING_COLOR,
  BEST_IN_CLASS_GROUPING_COLOR,
  SHORT_GROUPING_COLOR,
} from '../config/StyleChoices';

const countryCodes: { name: string; flag: string; code: string }[] = countries;
const songUrls: { title: string; url: string }[] = musicVideos;


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
        style={{ fill: '#FF0000', position: 'relative', top: '4px' }}
        viewBox="0 0 24 24">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
      </svg>
      {song}
    </a>
  );
}

export function getCategoryIcon(
  category: Category,
  fontSize: SvgIconProps['fontSize'] = 'small',
): React.ReactNode {
  const Component = getIconNameForCategory(category);

  return <Component htmlColor={getGroupingColor(category.grouping)} fontSize={fontSize} />;
}

function getGroupingColor(grouping: Grouping): string {
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
      return StarTwoToneIcon;
    case CategoryType.director:
      return MovieTwoToneIcon;
    case CategoryType.original_screenplay:
    case CategoryType.adapted_screenplay:
      return ArticleTwoToneIcon;

    // Acting
    case CategoryType.best_actor:
      return FaceTwoToneIcon;
    case CategoryType.best_actress:
      return Face4TwoToneIcon;
    case CategoryType.supporting_actor:
    case CategoryType.supporting_actress:
      return GroupTwoToneIcon;

    // Art
    case CategoryType.costumes:
      return CheckroomTwoToneIcon;
    case CategoryType.makeup_and_hair:
      return BrushTwoToneIcon;
    case CategoryType.production_design:
      return ArchitectureTwoToneIcon;
    case CategoryType.visual_effects:
      return AutoAwesomeTwoToneIcon;

    // Audio
    case CategoryType.score:
      return MusicNoteTwoToneIcon;
    case CategoryType.original_song:
      return AlbumTwoToneIcon;
    case CategoryType.sound:
      return EqualizerTwoToneIcon;

    // Filmkraft
    case CategoryType.cinematography:
      return VideocamTwoToneIcon;
    case CategoryType.editing:
      return ContentCutTwoToneIcon;

    // Best in Class
    case CategoryType.animated_feature:
      return SmartToyTwoToneIcon;
    case CategoryType.foreign_film:
      return LanguageTwoToneIcon;
    case CategoryType.documentary:
      return TravelExploreTwoToneIcon;

    // Shorts
    case CategoryType.animated_short:
    case CategoryType.live_action_short:
    case CategoryType.documentary_short:
      return VideoLibraryTwoToneIcon;
  }
} 