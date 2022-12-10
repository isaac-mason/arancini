let id = 0;

export const uniqueId = (): string => {
  id++;
  return id.toString();
};
