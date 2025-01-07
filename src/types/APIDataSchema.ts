import {z} from 'zod';
import {WatchStatus} from './Enums';

// * Primitive Schemas
export const RawWatchStatusSchema = z.enum(['seen', 'todo']);
export const MovieIdSchema = z
  .string()
  .regex(/^mov_[a-zA-Z0-9]{6}$/)
  .brand<'zMovieId'>();
export const UserIdSchema = z
  .string()
  .regex(/usr_[a-zA-Z0-9]{6}/)
  .brand<'zUserId'>();
export const CategoryIdSchema = z
  .string()
  .regex(/cat_[a-z]{4}/)
  .brand<'zCategoryId'>();
// * Primitive Types
export type MovieId = z.infer<typeof MovieIdSchema>;
export type UserId = z.infer<typeof UserIdSchema>;
export type CategoryId = z.infer<typeof CategoryIdSchema>;
export type RawWatchStatus = z.infer<typeof RawWatchStatusSchema>;

// * Object Schemas
export const UserSchema = z.object({
  id: UserIdSchema,
  username: z.string(),
  email: z.string().email().nullable(),
});

export const MovieSchema = z
  .object({
    id: MovieIdSchema,
    title: z.string(),
    imdbId: z.string().nullable(),
    'runtime(hours)': z.string().nullable(),
    'runtime(minutes)': z.number().nullable(),
    numNoms: z.number().gte(1),
  })
  .passthrough();

// ! This Throws because the data doesn't have 'Id' in it!!!
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
    status === RawWatchStatusSchema.enum['seen']
      ? WatchStatus.seen
      : WatchStatus.todo;
  }),
});

// * Object Types
export type WatchNotice = z.infer<typeof WatchNoticeSchema>;
export type User = z.infer<typeof UserSchema>;
export type Movie = z.infer<typeof MovieSchema>;
export type Nom = z.infer<typeof NomSchema>;
export type Category = z.infer<typeof CategorySchema>;

// * Collection Schemas
export const NomListSchema = z.array(NomSchema);
export const UserListSchema = z.array(UserSchema);
export const MovieListSchema = z.array(MovieSchema);
export const CategoryListSchema = z.array(CategorySchema).nonempty();
export const WatchListSchema = z.array(WatchNoticeSchema);

// * Collection Types
export type WatchList = z.infer<typeof WatchListSchema>;
export type UserList = z.infer<typeof UserListSchema>;
export type MovieList = z.infer<typeof MovieListSchema>;
export type NomList = z.infer<typeof NomListSchema>;
export type CategoryList = z.infer<typeof CategoryListSchema>;
