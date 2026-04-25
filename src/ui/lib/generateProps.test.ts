import { describe, it, expect } from 'vitest'
import { generateProps } from './generateProps'
import type { PropInfo } from '@/shared/types'
import { UNSET } from '@/shared/constants'

function prop(overrides: Partial<PropInfo> & { name: string }): PropInfo {
  return {
    type: 'string',
    required: true,
    ...overrides,
  }
}

describe('generateProps', () => {
  it('returns empty object for no props', () => {
    expect(generateProps([])).toEqual({})
  })

  it('generates default values for required props', () => {
    const result = generateProps([
      prop({ name: 'label', type: 'string' }),
      prop({ name: 'count', type: 'number' }),
      prop({ name: 'active', type: 'boolean' }),
    ])
    expect(result.label).toBe('example')
    expect(result.count).toBe(0)
    expect(result.active).toBe(false)
  })

  it('sets optional props to UNSET', () => {
    const result = generateProps([
      prop({ name: 'label', type: 'string', required: false }),
      prop({ name: 'count', type: 'number', required: false }),
    ])
    expect(result.label).toBe(UNSET)
    expect(result.count).toBe(UNSET)
  })

  it('uses first enum value for enum props', () => {
    const result = generateProps([
      prop({
        name: 'size',
        type: 'enum',
        enumValues: ['small', 'medium', 'large'],
      }),
    ])
    expect(result.size).toBe('small')
  })

  it('falls back to empty string for enum with no values', () => {
    const result = generateProps([
      prop({ name: 'size', type: 'enum', enumValues: undefined }),
    ])
    expect(result.size).toBe('')
  })

  it('sets function props to UNSET even when required', () => {
    const result = generateProps([
      prop({ name: 'onClick', type: 'function', required: true }),
    ])
    expect(result.onClick).toBe(UNSET)
  })

  it('generates empty array for array props', () => {
    const result = generateProps([prop({ name: 'items', type: 'array' })])
    expect(result.items).toEqual([])
  })

  it('generates empty object for object props', () => {
    const result = generateProps([prop({ name: 'config', type: 'object' })])
    expect(result.config).toEqual({})
  })

  it('generates empty string for unknown type', () => {
    const result = generateProps([prop({ name: 'mystery', type: 'unknown' })])
    expect(result.mystery).toBe('')
  })

  it('mixes required and optional props correctly', () => {
    const result = generateProps([
      prop({ name: 'label', type: 'string', required: true }),
      prop({ name: 'subtitle', type: 'string', required: false }),
      prop({ name: 'onClick', type: 'function', required: true }),
    ])
    expect(result.label).toBe('example')
    expect(result.subtitle).toBe(UNSET)
    expect(result.onClick).toBe(UNSET)
  })
})
