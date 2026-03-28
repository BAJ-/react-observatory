import { useState, useEffect, useCallback } from 'react'
import type { PropInfo } from './plugins/schemaPlugin'
import { generateProps } from './generateProps'
import { resolveProps, type SerializableProps } from './resolveProps'
import { PropsPanel } from './PropsPanel'
import { ErrorBoundary } from './ErrorBoundary'
import './App.css'

function readPropsFromUrl(): SerializableProps {
  const raw = new URLSearchParams(window.location.search).get('props')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function writePropsToUrl(props: SerializableProps) {
  const url = new URL(window.location.href)
  url.searchParams.set('props', JSON.stringify(props))
  window.history.replaceState(null, '', url.toString())
}

function App() {
  const componentPath = new URLSearchParams(window.location.search).get(
    'component',
  )

  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  const [propInfos, setPropInfos] = useState<PropInfo[]>([])
  const [serializableProps, setSerializableProps] =
    useState<SerializableProps>(readPropsFromUrl)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!componentPath) return

    setComponent(null)
    setPropInfos([])
    setError(null)

    const loadComponent = import(
      /* @vite-ignore */ `../${componentPath.replace(/^src\//, '')}`
    ).then((module) => {
      const Comp =
        module.default ??
        Object.values(module).find((exp) => typeof exp === 'function')
      if (Comp) {
        setComponent(() => Comp as React.ComponentType)
      } else {
        setError('No component export found in module.')
      }
    })

    const loadSchema = fetch(
      `/api/schema?component=${encodeURIComponent(componentPath)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.props) {
          setPropInfos(data.props)
          const urlProps = readPropsFromUrl()
          if (Object.keys(urlProps).length === 0) {
            const generated = generateProps(data.props)
            setSerializableProps(generated)
            writePropsToUrl(generated)
          }
        }
      })

    Promise.all([loadComponent, loadSchema]).catch((err) => {
      setError(err instanceof Error ? err.message : String(err))
    })
  }, [componentPath])

  const handlePropChange = useCallback((key: string, value: unknown) => {
    setSerializableProps((prev) => {
      const next = { ...prev, [key]: value }
      writePropsToUrl(next)
      return next
    })
  }, [])

  const resolvedProps =
    propInfos.length > 0
      ? resolveProps(serializableProps, propInfos)
      : serializableProps

  if (!componentPath) {
    return (
      <p>
        No component specified. Run: npm run observe path/to/MyComponent.tsx
      </p>
    )
  }

  return (
    <div className="observatory">
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className="observatory-layout">
        <aside className="observatory-panel">
          {propInfos.length > 0 ? (
            <PropsPanel
              props={propInfos}
              values={serializableProps}
              onChange={handlePropChange}
            />
          ) : (
            <p>Loading schema...</p>
          )}
        </aside>
        <main className="observatory-preview">
          {Component ? (
            <ErrorBoundary key={JSON.stringify(serializableProps)}>
              <Component {...resolvedProps} />
            </ErrorBoundary>
          ) : (
            <p>Loading component...</p>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
