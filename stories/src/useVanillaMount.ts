import { useEffect, useRef } from 'react'

export function useVanillaMount<T>(
  factory: (el: HTMLDivElement) => T,
  cleanup?: (instance: T) => void,
  deps: unknown[] = []
) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const instance = factory(ref.current)
    return () => cleanup?.(instance)
  }, deps)
  return ref
}
