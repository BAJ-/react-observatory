import { useState, useEffect } from 'react'
import type { PropInfo } from './plugins/schemaPlugin'
import { resolveProps, type SerializableProps } from './resolveProps'
import { ErrorBoundary } from './ErrorBoundary'

function readPropsFromUrl(): SerializableProps {
  const raw = new URLSearchParams(window.location.search).get('props')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function ComponentRenderer() {
  const params = new URLSearchParams(window.location.search)
  const componentPath = params.get('component')

  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  const [propInfos, setPropInfos] = useState<PropInfo[]>([])
  const [serializableProps, setSerializableProps] =
    useState<SerializableProps>(readPropsFromUrl)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!componentPath) return

    import(/* @vite-ignore */ `../${componentPath.replace(/^src\//, '')}`)
      .then((module) => {
        const Comp =
          module.default ??
          Object.values(module).find((exp) => typeof exp === 'function')
        if (Comp) {
          setComponent(() => Comp as React.ComponentType)
        } else {
          setError('No component export found in module.')
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err))
      })

    fetch(`/api/schema?component=${encodeURIComponent(componentPath)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.props) setPropInfos(data.props)
      })
  }, [componentPath])

  // Listen for prop updates from the parent window
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (
        e.origin === window.location.origin &&
        e.data?.type === 'observatory:props'
      ) {
        setSerializableProps(e.data.props)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const resolvedProps =
    propInfos.length > 0
      ? resolveProps(serializableProps, propInfos)
      : serializableProps

  if (error) return <p className="observatory-error">{error}</p>
  if (!Component) return <p>Loading...</p>

  return (
    <ErrorBoundary key={JSON.stringify(serializableProps)}>
      <Component {...resolvedProps} />
    </ErrorBoundary>
  )
}
