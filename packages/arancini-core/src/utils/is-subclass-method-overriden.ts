export const isSubclassMethodOverridden = (
  clazz: { new (...args: never[]): unknown },
  methodName: string
): boolean => {
  return Object.getOwnPropertyNames(clazz.prototype).includes(methodName)
}
