import type { JSONSchema7 } from 'json-schema'

export function getRootSchema(schema: JSONSchema7): JSONSchema7 {
  return schema.definitions
    ? (Object.values(schema.definitions)[0] as JSONSchema7)
    : schema
}

export function generateProps(schema: JSONSchema7): Record<string, unknown> {
  const root = getRootSchema(schema)

  if (root.type !== 'object' || !root.properties) return {}

  const props: Record<string, unknown> = {}

  for (const [key, rawValue] of Object.entries(root.properties)) {
    props[key] = generateValue(rawValue as JSONSchema7)
  }

  return props
}

function generateValue(schema: JSONSchema7): unknown {
  if (schema.enum && schema.enum.length > 0) return schema.enum[0]
  if (schema.const !== undefined) return schema.const

  switch (schema.type) {
    case 'string':
      return 'example'
    case 'number':
    case 'integer':
      return 0
    case 'boolean':
      return false
    case 'array':
      return []
    case 'object':
      return {}
    default:
      return 'noop'
  }
}
