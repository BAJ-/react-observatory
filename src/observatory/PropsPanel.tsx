import type { JSONSchema7 } from 'json-schema'
import { getRootSchema } from './generateProps'
import {
  isFunctionSchema,
  functionBehaviorOptions,
  type SerializableProps,
} from './resolveProps'

interface PropsPanelProps {
  schema: JSONSchema7
  values: SerializableProps
  onChange: (key: string, value: unknown) => void
}

export function PropsPanel({ schema, values, onChange }: PropsPanelProps) {
  const root = getRootSchema(schema)

  if (root.type !== 'object' || !root.properties) {
    return <p className="props-empty">No props detected.</p>
  }

  return (
    <div className="props-panel">
      <h3>Props</h3>
      {Object.entries(root.properties).map(([key, rawSchema]) => {
        const propSchema = rawSchema as JSONSchema7
        return (
          <div key={key} className="props-field">
            <label htmlFor={`prop-${key}`}>{key}</label>
            {renderControl(key, propSchema, values[key], onChange)}
          </div>
        )
      })}
    </div>
  )
}

function renderControl(
  key: string,
  schema: JSONSchema7,
  value: unknown,
  onChange: (key: string, value: unknown) => void,
) {
  if (isFunctionSchema(schema)) {
    return (
      <select
        id={`prop-${key}`}
        value={(value as string) ?? 'noop'}
        onChange={(e) => onChange(key, e.target.value)}
      >
        {functionBehaviorOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  if (schema.enum) {
    return (
      <select
        id={`prop-${key}`}
        value={String(value ?? '')}
        onChange={(e) => onChange(key, e.target.value)}
      >
        {schema.enum.map((opt) => (
          <option key={String(opt)} value={String(opt)}>
            {String(opt)}
          </option>
        ))}
      </select>
    )
  }

  switch (schema.type) {
    case 'boolean':
      return (
        <input
          id={`prop-${key}`}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(key, e.target.checked)}
        />
      )
    case 'number':
    case 'integer':
      return (
        <input
          id={`prop-${key}`}
          type="number"
          value={Number(value ?? 0)}
          onChange={(e) => onChange(key, Number(e.target.value))}
        />
      )
    case 'string':
    default:
      return (
        <input
          id={`prop-${key}`}
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(key, e.target.value)}
        />
      )
  }
}
