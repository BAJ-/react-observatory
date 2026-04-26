import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import { extractProps } from './schemaPlugin'
import { findTsconfig } from './findTsconfig'

const ROOT = resolve(import.meta.dirname, '../..')
const FIXTURES = resolve(ROOT, 'src/test/fixtures')
const tsconfig = findTsconfig(ROOT)

function propsFor(fixture: string) {
  return extractProps(resolve(FIXTURES, fixture), tsconfig)
}

function findProp(props: ReturnType<typeof extractProps>, name: string) {
  return props.find((p) => p.name === name)
}

describe('extractProps', () => {
  describe('basic typed props', () => {
    it('extracts string, number, and boolean props', () => {
      const props = propsFor('BasicComponent.tsx')
      expect(props).toHaveLength(3)

      const label = findProp(props, 'label')
      expect(label).toMatchObject({
        name: 'label',
        type: 'string',
        required: true,
      })

      const count = findProp(props, 'count')
      expect(count).toMatchObject({
        name: 'count',
        type: 'number',
        required: true,
      })

      const active = findProp(props, 'active')
      expect(active).toMatchObject({
        name: 'active',
        type: 'boolean',
        required: true,
      })
    })
  })

  describe('complex props', () => {
    it('extracts enum props with values', () => {
      const props = propsFor('ComplexComponent.tsx')
      const size = findProp(props, 'size')
      expect(size).toMatchObject({ type: 'enum', required: true })
      expect(size!.enumValues).toEqual(['small', 'medium', 'large'])
    })

    it('extracts function props with type "function"', () => {
      const props = propsFor('ComplexComponent.tsx')
      const onClick = findProp(props, 'onClick')
      expect(onClick).toMatchObject({ type: 'function', required: true })
    })

    it('marks optional props as not required', () => {
      const props = propsFor('ComplexComponent.tsx')

      const onChange = findProp(props, 'onChange')
      expect(onChange).toMatchObject({ type: 'function', required: false })

      const title = findProp(props, 'title')
      expect(title).toMatchObject({ type: 'string', required: false })
    })

    it('extracts array props', () => {
      const props = propsFor('ComplexComponent.tsx')
      const items = findProp(props, 'items')
      expect(items).toMatchObject({ type: 'array', required: true })
    })

    it('extracts object props', () => {
      const props = propsFor('ComplexComponent.tsx')
      const config = findProp(props, 'config')
      expect(config).toMatchObject({ type: 'object', required: true })
    })
  })

  describe('export styles', () => {
    it('extracts props from exported arrow function variable', () => {
      const props = propsFor('ArrowComponent.tsx')
      expect(props).toHaveLength(2)

      const name = findProp(props, 'name')
      expect(name).toMatchObject({ type: 'string', required: true })

      const disabled = findProp(props, 'disabled')
      expect(disabled).toMatchObject({ type: 'boolean', required: false })
    })

    it('extracts props from default export function', () => {
      const props = propsFor('ComplexComponent.tsx')
      expect(props.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('returns empty array for component with no props', () => {
      const props = propsFor('NoPropsComponent.tsx')
      expect(props).toEqual([])
    })

    it('returns empty array for non-existent file', () => {
      const props = extractProps(
        resolve(FIXTURES, 'DoesNotExist.tsx'),
        tsconfig,
      )
      expect(props).toEqual([])
    })
  })

  describe('function prop return types', () => {
    it('includes returnDefault for function returning string', () => {
      const props = propsFor('CallbackComponent.tsx')
      const getData = findProp(props, 'getData')
      expect(getData).toMatchObject({ type: 'function', required: true })
      expect(getData!.returnDefault).toBe('')
    })

    it('includes returnDefault for function returning boolean', () => {
      const props = propsFor('CallbackComponent.tsx')
      const transform = findProp(props, 'transform')
      expect(transform!.returnDefault).toBe(false)
    })

    it('includes Promise descriptor for async return type', () => {
      const props = propsFor('CallbackComponent.tsx')
      const fetchUser = findProp(props, 'fetchUser')
      expect(fetchUser!.returnDefault).toEqual({
        __hydrate: 'Promise',
        value: { name: '' },
      })
    })

    it('includes signature string for function props', () => {
      const props = propsFor('CallbackComponent.tsx')
      const transform = findProp(props, 'transform')
      expect(transform!.signature).toContain('number')
      expect(transform!.signature).toContain('boolean')
    })
  })
})
