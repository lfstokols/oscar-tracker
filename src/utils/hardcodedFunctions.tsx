import {CategoryId, CategoryIdSchema} from '../types/APIDataSchema';
import {Grouping} from '../types/Enums';

//* Nominees per grouping
export const groupCounts = (
  shortsAreOne: boolean,
): Record<Grouping, number> => ({
  [Grouping.big_three]: 25,
  [Grouping.acting]: 20,
  [Grouping.filmkraft]: 10,
  [Grouping.art]: 20,
  [Grouping.audio]: 15,
  [Grouping.best_in_class]: 15,
  [Grouping.short]: shortsAreOne ? 3 : 15,
});

export const TOTAL_CATEGORY_COUNT = 23;

export const categoryNomCounts = (
  catId: CategoryId,
  shortsAreOne: boolean,
): number => {
  const shorts = [
    CategoryIdSchema.parse('cat_sanm'),
    CategoryIdSchema.parse('cat_shla'),
    CategoryIdSchema.parse('cat_sdoc'),
  ];
  if (shorts.includes(catId)) {
    return shortsAreOne ? 1 : 5;
  }
  if (catId === CategoryIdSchema.parse('cat_pict')) {
    return 10;
  }
  return 5;
};
