import { useCallback, useState } from 'react';

export function useRerender(): () => void {
  const [_, setVersion] = useState(0);
  return useCallback(() => {
    setVersion((v) => v + 1);
  }, []);
}
