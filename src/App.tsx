import { useState, useEffect } from 'react'
import { generateProps } from './generateProps'
import './App.css'

function App() {
  const componentPath = new URLSearchParams(window.location.search).get(
    'component',
  )

  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  const [props, setProps] = useState<Record<string, unknown>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!componentPath) return

    setComponent(null)
    setProps({})
    setError(null)

    const loadComponent = import(
      /* @vite-ignore */ `./${componentPath.replace(/^src\//, '')}`
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
        if (data.schema) {
          setProps(generateProps(data.schema))
        }
      })

    Promise.all([loadComponent, loadSchema]).catch((err) => {
      setError(err instanceof Error ? err.message : String(err))
    })
  }, [componentPath])

  return (
    <>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {Component ? (
        <Component {...props} />
      ) : componentPath ? (
        <p>Loading...</p>
      ) : (
        <p>
          No component specified. Run: npm run observe path/to/MyComponent.tsx
        </p>
      )}
    </>
  )
}

export default App
