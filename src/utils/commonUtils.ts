
export function objectKeys<T extends object>(obj: T): (keyof T)[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return Object.keys(obj) as (keyof T)[];
}

export function isKeyInObject<T extends object>(key: PropertyKey, obj: T): key is keyof T {
  return key in obj;
}