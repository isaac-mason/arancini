import { useLayoutEffect, useEffect, useCallback, useState } from 'react'

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function useRerender(): () => void {
  const [_, setVersion] = useState(0)
  return useCallback(() => {
    setVersion((v) => v + 1)
  }, [])
}
