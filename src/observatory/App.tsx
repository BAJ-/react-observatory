import { useState, useEffect, useRef } from 'react'
import type { PropInfo } from './plugins/schemaPlugin'
import { generateProps } from './generateProps'
import { type SerializableProps, readPropsFromUrl } from './resolveProps'
import { PropsPanel } from './PropsPanel'
import { ViewportControls } from './ViewportControls'
import { TimelinePanel } from './TimelinePanel'
import { useTimeline } from './useTimeline'
import { MSG_PROPS, HMR_SCHEMA_UPDATE, API_SCHEMA } from './constants'
import './App.css'

function writePropsToUrl(props: SerializableProps) {
  const url = new URL(window.location.href)
  url.searchParams.set('props', JSON.stringify(props))
  window.history.replaceState(null, '', url.toString())
}

function buildIframeSrc(
  componentPath: string,
  props: SerializableProps,
): string {
  const params = new URLSearchParams()
  params.set('render', '')
  params.set('component', componentPath)
  params.set('props', JSON.stringify(props))
  return `/?${params.toString()}`
}

function App() {
  const componentPath = new URLSearchParams(window.location.search).get(
    'component',
  )

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [propInfos, setPropInfos] = useState<PropInfo[]>([])
  const [urlProps] = useState(readPropsFromUrl)
  const hasUrlProps = Object.keys(urlProps).length > 0
  const {
    timeline,
    activeProps,
    isReplaying,
    handlePropChange,
    goToNode,
    toggleMarked,
    initTimeline,
    mergeActiveProps,
    replay,
    cancelReplay,
  } = useTimeline(urlProps)
  const [iframeSrc, setIframeSrc] = useState<string | null>(() =>
    componentPath && hasUrlProps
      ? buildIframeSrc(componentPath, urlProps)
      : null,
  )
  const [error, setError] = useState<string | null>(null)
  const [viewportWidth, setViewportWidth] = useState<number | null>(null)
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)

  useEffect(() => {
    if (!componentPath) return

    fetch(`${API_SCHEMA}?component=${encodeURIComponent(componentPath)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.props) {
          setPropInfos(data.props)
          if (!hasUrlProps) {
            const generated = generateProps(data.props)
            initTimeline(generated)
            setIframeSrc(
              (prev) => prev ?? buildIframeSrc(componentPath!, generated),
            )
          }
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err))
      })
  }, [componentPath, urlProps, hasUrlProps, initTimeline])

  // Re-fetch schema when component source changes via HMR
  useEffect(() => {
    if (!componentPath || !import.meta.hot) return

    const path = componentPath
    function refetchSchema() {
      fetch(`${API_SCHEMA}?component=${encodeURIComponent(path)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.props) {
            setPropInfos(data.props)
            mergeActiveProps(generateProps(data.props))
            replay()
          }
        })
    }

    import.meta.hot.on(HMR_SCHEMA_UPDATE, refetchSchema)
    return () => import.meta.hot!.off(HMR_SCHEMA_UPDATE, refetchSchema)
  }, [componentPath, mergeActiveProps, replay])

  // Send props to the iframe whenever they change
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: MSG_PROPS, props: activeProps },
      window.location.origin,
    )
    writePropsToUrl(activeProps)
  }, [activeProps])

  const handleViewportChange = (w: number | null, h: number | null) => {
    setViewportWidth(w)
    setViewportHeight(h)
  }

  if (!componentPath) {
    return (
      <p>
        No component specified. Run: npm run observe path/to/MyComponent.tsx
      </p>
    )
  }

  return (
    <div className="observatory">
      {error && <p className="observatory-error">{error}</p>}
      <div className="observatory-layout">
        <aside className="observatory-panel">
          {propInfos.length > 0 ? (
            <PropsPanel
              props={propInfos}
              values={activeProps}
              onChange={handlePropChange}
            />
          ) : (
            <p>Loading schema...</p>
          )}
          {timeline.nodes.length > 1 && (
            <TimelinePanel
              timeline={timeline}
              isReplaying={isReplaying}
              onGoToNode={goToNode}
              onToggleMarked={toggleMarked}
              onReplay={replay}
              onCancelReplay={cancelReplay}
            />
          )}
        </aside>
        <main className="observatory-preview">
          <ViewportControls
            width={viewportWidth}
            height={viewportHeight}
            onChange={handleViewportChange}
          />
          <div className="viewport-frame">
            <iframe
              ref={iframeRef}
              src={iframeSrc ?? undefined}
              title="Component preview"
              onLoad={() => {
                iframeRef.current?.contentWindow?.postMessage(
                  { type: MSG_PROPS, props: activeProps },
                  window.location.origin,
                )
              }}
              style={{
                width: viewportWidth ? `${viewportWidth}px` : '100%',
                height: viewportHeight ? `${viewportHeight}px` : '100%',
              }}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
