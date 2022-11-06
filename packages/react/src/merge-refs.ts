export const mergeRefs =
  <T>(refs: Array<React.Ref<T>>): React.Ref<T> =>
  (v: T) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') ref(v);
      else if (ref) (ref as { current: unknown }).current = v;
    });
  };
