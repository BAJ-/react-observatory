import type { PropInfo } from './plugins/schemaPlugin'
import { UNSET } from './generateProps'

type FunctionBehavior = 'noop' | 'log'

const functionBehaviors: Record<
  FunctionBehavior,
  (propName: string) => (...args: unknown[]) => void
> = {
  noop: () => () => {},
  log:
    (propName) =>
    (...args) =>
      console.log(`[${propName}]`, ...args),
}

export type SerializableProps = Record<string, unknown>

export function readPropsFromUrl(): SerializableProps {
  const raw = new URLSearchParams(window.location.search).get('props')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function resolveProps(
  serializable: SerializableProps,
  props: PropInfo[],
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(serializable)) {
    if (value === UNSET) continue

    const prop = props.find((p) => p.name === key)

    if (prop?.type === 'function') {
      const behavior = (value as FunctionBehavior) ?? 'noop'
      resolved[key] =
        functionBehaviors[behavior]?.(key) ?? functionBehaviors.noop(key)
    } else {
      resolved[key] = value
    }
  }

  return resolved
}

export const functionBehaviorOptions: {
  value: FunctionBehavior
  label: string
}[] = [
  { value: 'noop', label: 'No-op' },
  { value: 'log', label: 'Console log' },
]
