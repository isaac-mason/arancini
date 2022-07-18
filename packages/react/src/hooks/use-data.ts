import { useEffect, useRef } from 'react';

export function useData<T>(fn: () => T, deps: any[] = []): T {
  const ref = useRef<T>();
  const first = useRef(true);

  if (!ref.current) {
    ref.current = fn();
    first.current = false;
  }

  useEffect(() => {
    if (!first.current) {
      ref.current = fn();
    }
  }, deps);

  return ref.current;
}
