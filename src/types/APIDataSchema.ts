import {z} from 'zod';
import {WatchStatus} from './Enums';

// * Primitive Schemas
export const RawWatchStatusSchema = z.enum(['seen', 'todo']);
export const GroupingSchema = z.enum(['big_three', 'acting', 'filmkraft', 'art', 'audio', 'best_in_class', 'short']);
export const MovieIdSchema = z
  .string()
  .regex(/^mov_[a-zA-Z0-9]{6}$/)
  .brand<'MovieId'>();
export const UserIdSchema = z
  .string()
  .regex(/usr_[a-zA-Z0-9]{6}/)
  .brand<'UserId'>();
export const CategoryIdSchema = z
  .string()
  .regex(/cat_[a-z]{4}/)
  .brand<'CategoryId'>();
  
// * Primitive Types
export type MovieId = z.infer<typeof MovieIdSchema>;
export type UserId = z.infer<typeof UserIdSchema>;
export type CategoryId = z.infer<typeof CategoryIdSchema>;
export type RawWatchStatus = z.infer<typeof RawWatchStatusSchema>;

// * Object Schemas
export const UserSchema = z.object({
  id: UserIdSchema,
  username: z.string(),
});

export const MovieSchema = z
  .object({
    id: MovieIdSchema,
    title: z.string(),
    mainTitle: z.string(),
    subtitle: z.string(),
    ImdbId: z.string().nullable(),
    movieDbId: z.number().nullable(),
    runtime_hours: z.string().nullable(),
    runtime_minutes: z.number().nullable(),
    numNoms: z.number().gte(1),
    isShort: z.boolean(),
    posterPath: z.string().regex(/^\/[0-9a-zA-Z]*\.jpg$/).nullable(),
  })
  .passthrough();

export const NomSchema = z.object({
  movieId: MovieIdSchema,
  categoryId: CategoryIdSchema,
  note: z.string().nullable().default(''),
});

export const CategorySchema = z.object({
  id: CategoryIdSchema,
  shortName: z.string(),
  fullName: z.string(),
  hasNote: z.boolean(),
  isShort: z.boolean(),
  grouping: z.string(), // TODO - enum
  maxNoms: z.number().refine(n => n === 5 || n === 10, {
    message: 'Number must be 5 or 10',
  }),
});

export const WatchNoticeSchema = z.object({
  userId: UserIdSchema,
  movieId: MovieIdSchema,
  status: RawWatchStatusSchema.transform(status => {
    return status === RawWatchStatusSchema.enum['seen']
      ? WatchStatus.seen
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      : status === RawWatchStatusSchema.enum['todo']
      ? WatchStatus.todo 
      : WatchStatus.blank;
  }),
});

// * Object Types
export type WatchNotice = z.infer<typeof WatchNoticeSchema>;
export type User = z.infer<typeof UserSchema>;
export type Movie = z.infer<typeof MovieSchema>;
export type Nom = z.infer<typeof NomSchema>;
export type Category = z.infer<typeof CategorySchema>;

// * Collection Schemas
export const NomListSchema = z.array(NomSchema).describe('A list of nominations');
export const UserListSchema = z.array(UserSchema).describe('A list of users');
export const MovieListSchema = z.array(MovieSchema).describe('A list of movies');
export const CategoryListSchema = z.array(CategorySchema).describe('A list of categories').nonempty();
export const WatchListSchema = z.array(WatchNoticeSchema).describe('A watchlist');

// * Collection Types
export type WatchList = z.infer<typeof WatchListSchema>;
export type UserList = z.infer<typeof UserListSchema>;
export type MovieList = z.infer<typeof MovieListSchema>;
export type NomList = z.infer<typeof NomListSchema>;
export type CategoryList = z.infer<typeof CategoryListSchema>;

// * Extended Schemas
export const MyUserDataSchema = UserSchema.extend({
  letterboxd: z.string().nullable(),
  email: z.string().email().nullable(),
  propic: z.string().url().nullable(),
});

export const UserStatsSchema = z.object({
  id: UserIdSchema,
  numSeenFeature: z.number().nullable().default(0),
  numSeenShort: z.number().nullable().default(0),
  numTodoFeature: z.number().nullable().default(0),
  numTodoShort: z.number().nullable().default(0),
  seenWatchtime: z.number().nullable().default(0),
  todoWatchtime: z.number().nullable().default(0),
  numSeenMultinom: z.number().nullable().default(0),
  numTodoMultinom: z.number().nullable().default(0),
  numCatsSeen: z.number().nullable().default(0),
  numCatsTodo: z.number().nullable().default(0),
});
export const UserStatsListSchema = z.array(UserStatsSchema).describe("A list of users' stats");

export type MyUserData = z.infer<typeof MyUserDataSchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
export type UserStatsList = z.infer<typeof UserStatsListSchema>;

export const HypotheticalityTupleSchema = z.object({
  seen: z.number(),
  todo: z.number(),
  total: z.number(),
});
export type HypotheticalityTuple = z.infer<typeof HypotheticalityTupleSchema>;

export const CategoryCompletionKeySchema = z.union([CategoryIdSchema, GroupingSchema]);
export type CategoryCompletionKey = z.infer<typeof CategoryCompletionKeySchema>;

export const CategoryCompletionSchema = z.record(
  UserIdSchema, z.record(CategoryCompletionKeySchema, HypotheticalityTupleSchema)
);

export type CategoryCompletionData = z.infer<typeof CategoryCompletionSchema>;
