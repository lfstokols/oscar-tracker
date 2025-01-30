type ValueOf<T> = T[keyof T];

export function objectKeys<T extends object>(obj: T): (keyof T)[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return Object.keys(obj) as (keyof T)[];
}

export function objectValues<T extends object>(obj: T): ValueOf<T>[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return Object.values(obj) as ValueOf<T>[];
}

export function objectFromEntries<K extends PropertyKey, V>(
  entries: [K, V][],
): Record<K, V> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return Object.fromEntries(entries) as Record<K, V>;
}

export function isKeyInObject<T extends object>(
  key: PropertyKey,
  obj: T,
): key is keyof T {
  return key in obj;
}
