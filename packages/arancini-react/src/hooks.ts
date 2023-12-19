import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import * as A from '@arancini/core'

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export const useRerender = () => {
  const [, setState] = useState(0)

  const rerender = useCallback(() => {
    setState((state) => state + 1)
  }, [])

  return rerender
}

export const useOnceIfContainerVersionChanged = (
  container: A.EntityContainer<any>,
  callback: Function
) => {
  const originalVersion = useMemo(() => container.version, [container])

  useIsomorphicLayoutEffect(() => {
    if (container.version !== originalVersion) callback()
  }, [container])
}

export const useOnEntityAdded = <E>(
  container: A.EntityContainer<E>,
  callback: (entity: E) => void
) => {
  useOnceIfContainerVersionChanged(container, callback)

  useIsomorphicLayoutEffect(
    () => container.onEntityAdded.add(callback),
    [container, callback]
  )
}

export const useOnEntityRemoved = <E>(
  container: A.EntityContainer<E>,
  callback: (entity: E) => void
) => {
  useOnceIfContainerVersionChanged(container, callback)

  useIsomorphicLayoutEffect(
    () => container.onEntityRemoved.add(callback),
    [container, callback]
  )
}
