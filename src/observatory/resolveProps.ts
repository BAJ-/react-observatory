import type { JSONSchema7 } from 'json-schema'
import { getRootSchema } from './generateProps'

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

export function resolveProps(
  serializable: SerializableProps,
  schema: JSONSchema7,
): Record<string, unknown> {
  const root = getRootSchema(schema)

  if (root.type !== 'object' || !root.properties) return { ...serializable }

  const resolved: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(serializable)) {
    const propSchema = root.properties[key] as JSONSchema7 | undefined

    if (propSchema && isFunctionSchema(propSchema)) {
      const behavior = (value as FunctionBehavior) ?? 'noop'
      resolved[key] =
        functionBehaviors[behavior]?.(key) ?? functionBehaviors.noop(key)
    } else {
      resolved[key] = value
    }
  }

  return resolved
}

export function isFunctionSchema(schema: JSONSchema7): boolean {
  return !schema.type && !schema.enum && !schema.anyOf && !schema.oneOf
}

export const functionBehaviorOptions: {
  value: FunctionBehavior
  label: string
}[] = [
  { value: 'noop', label: 'No-op' },
  { value: 'log', label: 'Console log' },
]
