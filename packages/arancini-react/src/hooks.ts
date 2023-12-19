import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export const useRerender = () => {
  const [, setState] = useState(0)

  const rerender = useCallback(() => {
    setState((state) => state + 1)
  }, [])

  return rerender
}
