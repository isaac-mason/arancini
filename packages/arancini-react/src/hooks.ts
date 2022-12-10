import { useLayoutEffect, useEffect, useCallback, useState } from 'react'

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export const mergeRefs =
  <T>(refs: Array<React.Ref<T>>): React.Ref<T> =>
  (v: T) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') ref(v)
      else if (ref) (ref as { current: unknown }).current = v
    })
  }

export function useRerender(): () => void {
  const [_, setVersion] = useState(0)
  return useCallback(() => {
    setVersion((v) => v + 1)
  }, [])
}
