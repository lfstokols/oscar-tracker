import {Grouping} from '../../types/Enums';

export function toggleOpenness(
  prev: Record<Grouping, boolean>,
  grouping: Grouping,
): Record<Grouping, boolean> {
  return {...prev, [grouping]: !prev[grouping]};
}
