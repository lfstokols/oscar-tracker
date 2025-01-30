type ValueOf<T> = T[keyof T];

export function objectKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function objectValues<T extends object>(obj: T): ValueOf<T>[] {
  return Object.values(obj) as ValueOf<T>[];
}

// type Entries<T> = {
//   [K in keyof T]: [K, T[K]];
// }[keyof T][];

// type Entries<T> = [keyof T, T[keyof T]][];

export function objectFromEntries<K extends PropertyKey, V>(
  entries: [K, V][],
): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>;
}

export function isKeyInObject<T extends object>(
  key: PropertyKey,
  obj: T,
): key is keyof T {
  return key in obj;
}
