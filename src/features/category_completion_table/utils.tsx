import {
  CategoryCompletionData,
  CategoryCompletionKey,
  UserId,
} from '../../types/APIDataSchema';
import {Hypotheticality} from '../userStatsTable/Enums';
export function make_fraction_display(numerator: number, denominator: number) {
  return `${numerator}/${denominator}`;
}

export function enumToBool(value: Hypotheticality): {
  includeSeen: boolean;
  includeTodo: boolean;
} {
  if (value === Hypotheticality.SEEN) {
    return {includeSeen: true, includeTodo: false};
  }
  if (value === Hypotheticality.TODO) {
    return {includeSeen: false, includeTodo: true};
  }
  return {includeSeen: true, includeTodo: true};
}

export function get_num(
  userId: UserId,
  symbol: CategoryCompletionKey,
  hypotheticality: Hypotheticality,
  data: CategoryCompletionData,
) {
  const {includeSeen, includeTodo} = enumToBool(hypotheticality);
  const num_seen = data[userId]?.[symbol]?.['seen'] ?? 0;
  const num_todo = data[userId]?.[symbol]?.['todo'] ?? 0;
  return (includeSeen ? num_seen : 0) + (includeTodo ? num_todo : 0);
}

export function get_total(
  symbol: CategoryCompletionKey,
  data: CategoryCompletionData,
) {
  return Object.values(data)[0]?.[symbol]?.['total'] ?? 0;
}
